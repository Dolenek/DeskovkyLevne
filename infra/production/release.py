"""Build releases and switch the existing production Compose project."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request


STATE = Path("/var/lib/deskovky-deploy")
SITE = Path("/var/www/DeskovkyLevne")
BUILD_USER = "deskovky-build"


def command(arguments, **options):
    return subprocess.run(arguments, check=True, **options)


def output(arguments, **options):
    return subprocess.check_output(arguments, text=True, **options).strip()


def runtime_environment():
    result = subprocess.check_output([
        "bash", "-c", 'set -a; source "$1"; env -0', "bash", str(SITE / ".env"),
    ])
    return dict(entry.decode().split("=", 1) for entry in result.split(b"\0") if entry)


def compose(manifest, *arguments, **options):
    return command([
        "docker", "compose", "--project-name", "rewrite", "--file", str(manifest),
        *arguments,
    ], **options)


def build_frontend(release, environment):
    build_environment = {
        "PATH": os.environ["PATH"], "HOME": "/var/lib/deskovky-build",
        "CI": "true", "NODE_OPTIONS": "--max-old-space-size=768",
        "PLAYWRIGHT_BROWSERS_PATH": "/var/lib/deskovky-build/browsers",
        **{key: value for key, value in environment.items() if key.startswith("VITE_")},
    }
    command(["chown", "-R", f"{BUILD_USER}:{BUILD_USER}", str(release)])
    for arguments in (["npm", "ci"], ["npx", "playwright", "install", "chromium"],
                      ["npm", "run", "build"]):
        command(["runuser", "-u", BUILD_USER, "--preserve-environment", "--", *arguments],
                cwd=release, env=build_environment)
    if not (release / "dist/index.html").is_file():
        raise RuntimeError("Frontend build did not produce index.html")
    command(["chown", "-R", "root:root", str(release)])
    shutil.rmtree(release / "node_modules")


def create_manifest(release, revision, environment):
    configuration = release / "infra/rewrite/docker-compose.api-go.yml"
    override = release / "image.json"
    override.write_text(json.dumps({"services": {"api-go": {
        "image": f"deskovkylevne-api:{revision}",
    }}}))
    manifest = STATE / "manifests" / f"{release.name}.json"
    rendered = output([
        "docker", "compose", "-p", "rewrite", "-f", str(configuration),
        "-f", str(override), "config", "--format", "json",
    ], env={**environment, "API_VERSION": revision, "API_COMMIT": revision,
            "API_BUILT_AT": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
    manifest.write_text(rendered)
    manifest.chmod(0o600)
    compose(manifest, "build", "api-go")
    return manifest


def get_json(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return json.load(response)


def smoke_check(revision=None):
    for attempt in range(30):
        try:
            get_json("http://127.0.0.1:18080/ready")
            break
        except (OSError, ValueError):
            if attempt == 29:
                raise
            time.sleep(2)
    version = get_json("http://127.0.0.1:18080/version")
    if revision and version["commit"] != revision:
        raise RuntimeError("API is not running the requested commit")
    catalog = get_json("http://127.0.0.1:4444/api/v1/catalog?limit=1")
    if not catalog.get("rows"):
        raise RuntimeError("Production catalog smoke check returned no products")
    with urllib.request.urlopen("http://127.0.0.1:4444/", timeout=15) as response:
        if b"<html" not in response.read().lower():
            raise RuntimeError("Production frontend is not HTML")


def atomic_link(target, link):
    pending = link.with_name(link.name + ".pending")
    pending.unlink(missing_ok=True)
    pending.symlink_to(target)
    pending.replace(link)


def activate(release, manifest, revision):
    previous_manifest = (STATE / "active-manifest").resolve(strict=True)
    previous_frontend = (SITE / "dist").resolve(strict=True)
    (STATE / "pending.json").write_text(json.dumps({
        "manifest": str(previous_manifest), "frontend": str(previous_frontend),
        "revision": (STATE / "deployed-sha").read_text(),
    }))
    try:
        compose(manifest, "up", "-d", "--no-build", "--wait", "--wait-timeout", "120")
        atomic_link(release / "dist", SITE / "dist")
        smoke_check(revision)
    except BaseException:
        print("Deployment failed; restoring previous API and frontend", flush=True)
        recover_pending()
        raise
    atomic_link(previous_manifest, STATE / "previous-manifest")
    atomic_link(previous_frontend, STATE / "previous-frontend")
    atomic_link(manifest, STATE / "active-manifest")
    (STATE / "deployed-sha").write_text(revision + "\n")
    (STATE / "pending.json").unlink()


def recover_pending():
    pending = STATE / "pending.json"
    if not pending.exists():
        return
    previous = json.loads(pending.read_text())
    print("Recovering interrupted deployment", flush=True)
    atomic_link(Path(previous["frontend"]), SITE / "dist")
    compose(Path(previous["manifest"]), "up", "-d", "--no-build",
            "--wait", "--wait-timeout", "120")
    smoke_check()
    atomic_link(Path(previous["manifest"]), STATE / "active-manifest")
    (STATE / "deployed-sha").write_text(previous["revision"])
    pending.unlink()

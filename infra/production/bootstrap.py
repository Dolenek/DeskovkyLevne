#!/usr/bin/env python3
"""One-time installation; run as root after installing Docker Compose v2+."""
import json
from pathlib import Path
import shutil

from github_gate import REPOSITORY
from release import STATE, SITE, atomic_link, command, output, runtime_environment


def initialize_directories():
    command(["docker", "compose", "version"])
    if not Path("/var/lib/deskovky-build").exists():
        command(["useradd", "--system", "--create-home", "--home-dir",
                 "/var/lib/deskovky-build", "--shell", "/usr/sbin/nologin", "deskovky-build"])
    for directory in (STATE, STATE / "releases", STATE / "manifests"):
        directory.mkdir(exist_ok=True, mode=0o755)
    (STATE / "manifests").chmod(0o700)
    repository = STATE / "repository.git"
    if not repository.exists():
        command(["git", "init", "--bare", str(repository)])
        command(["git", "--git-dir", str(repository), "remote", "add", "origin",
                 f"https://github.com/{REPOSITORY}.git"])


def capture_baseline():
    if (STATE / "active-manifest").exists():
        return
    environment = runtime_environment()
    existing = json.loads(output(["docker", "inspect", "tlamasite-api-go"]))[0]
    environment.update(entry.split("=", 1) for entry in existing["Config"]["Env"])
    configuration = SITE / "infra/rewrite/docker-compose.api-go.yml"
    rendered = json.loads(output([
        "docker", "compose", "-p", "rewrite", "-f", str(configuration),
        "config", "--format", "json",
    ], env=environment))
    rendered["services"]["api-go"].pop("build", None)
    rendered["services"]["api-go"]["image"] = existing["Image"]
    redis = json.loads(output(["docker", "inspect", "tlamasite-redis"]))[0]
    rendered["services"]["redis"]["user"] = redis["Config"]["User"]
    rendered["services"]["redis"]["image"] = redis["Image"]
    manifest = STATE / "manifests/baseline.json"
    manifest.write_text(json.dumps(rendered))
    manifest.chmod(0o600)
    baseline = STATE / "releases/baseline"
    baseline.mkdir(exist_ok=True)
    if not (SITE / "dist").is_symlink():
        (SITE / "dist").rename(baseline / "dist")
        atomic_link(baseline / "dist", SITE / "dist")
    atomic_link(manifest, STATE / "active-manifest")
    revision = output(["git", "-C", str(SITE), "rev-parse", "HEAD"])
    (STATE / "deployed-sha").write_text(revision + "\n")


def install_service():
    source = Path(__file__).resolve().parent
    destination = Path("/usr/local/lib/deskovky-deploy")
    destination.mkdir(exist_ok=True)
    destination.chmod(0o755)
    for filename in ("deploy.py", "release.py", "github_gate.py"):
        if source != destination:
            shutil.copy2(source / filename, destination / filename)
        (destination / filename).chmod(0o644)
    for filename in ("deskovky-deploy.service", "deskovky-deploy.timer"):
        shutil.copy2(source / filename, Path("/etc/systemd/system") / filename)
        (Path("/etc/systemd/system") / filename).chmod(0o644)
    command(["systemctl", "daemon-reload"])
    command(["systemctl", "enable", "--now", "deskovky-deploy.timer"])


if __name__ == "__main__":
    initialize_directories()
    capture_baseline()
    install_service()

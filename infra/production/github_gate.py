"""Select only the current main revision with a successful push CI run."""
import json
import urllib.parse
import urllib.request


REPOSITORY = "Dolenek/DeskovkyLevne"


def successful_run(workflow_runs, revision):
    matching = [run for run in workflow_runs if (
        run["head_sha"] == revision
        and run["head_branch"] == "main"
        and run["event"] == "push"
        and run["head_repository"]["full_name"] == REPOSITORY
    )]
    if not matching:
        return None
    latest = max(matching, key=lambda run: (run["run_number"], run["run_attempt"]))
    if latest["status"] == "completed" and latest["conclusion"] == "success":
        return latest["html_url"]
    return None


def check_ci(revision):
    query = urllib.parse.urlencode({
        "branch": "main", "event": "push", "head_sha": revision, "per_page": 100,
    })
    url = f"https://api.github.com/repos/{REPOSITORY}/actions/workflows/ci.yml/runs?{query}"
    request = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "DeskovkyLevne-production-deployer",
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return successful_run(json.load(response)["workflow_runs"], revision)

"""Failure-path tests that run without production access."""
import copy
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from github_gate import REPOSITORY, successful_run
import release


class GitHubGateTests(unittest.TestCase):
    def setUp(self):
        self.run = {
            "head_sha": "a" * 40, "head_branch": "main", "event": "push",
            "head_repository": {"full_name": REPOSITORY}, "run_number": 3,
            "run_attempt": 1, "status": "completed", "conclusion": "success",
            "html_url": "https://github.com/example/run/3",
        }

    def test_only_successful_main_push_can_deploy(self):
        self.assertEqual(successful_run([self.run], "a" * 40), self.run["html_url"])
        for field, value in (("head_sha", "b" * 40), ("head_branch", "feature"),
                             ("event", "pull_request"), ("status", "in_progress"),
                             ("conclusion", "failure"),
                             ("head_repository", {"full_name": "attacker/fork"})):
            with self.subTest(field=field):
                candidate = {**self.run, field: value}
                self.assertIsNone(successful_run([candidate], "a" * 40))

    def test_newer_rerun_blocks_previous_success(self):
        rerun = copy.deepcopy(self.run)
        rerun.update(run_attempt=2, status="in_progress", conclusion=None)
        self.assertIsNone(successful_run([self.run, rerun], "a" * 40))


class ActivationTests(unittest.TestCase):
    def test_failed_smoke_check_restores_both_components(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            previous = root / "old.json"
            previous.touch()
            old_frontend = root / "old-dist"
            old_frontend.mkdir()
            (root / "active-manifest").symlink_to(previous)
            (root / "deployed-sha").write_text("old-sha\n")
            (root / "dist").symlink_to(old_frontend, target_is_directory=True)
            candidate = root / "new"
            (candidate / "dist").mkdir(parents=True)
            with patch.object(release, "STATE", root), patch.object(release, "SITE", root), \
                    patch.object(release, "compose") as compose, \
                    patch.object(release, "smoke_check", side_effect=[RuntimeError("bad"), None]):
                with self.assertRaisesRegex(RuntimeError, "bad"):
                    release.activate(candidate, root / "new.json", "a" * 40)
            self.assertEqual((root / "dist").resolve(), old_frontend)
            self.assertEqual(compose.call_args.args[0], previous)
            self.assertEqual((root / "active-manifest").resolve(), previous)
            self.assertEqual((root / "deployed-sha").read_text(), "old-sha\n")
            self.assertFalse((root / "pending.json").exists())

    def test_interrupted_deployment_recovers_before_retry(self):
        import json
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest = root / "old.json"
            manifest.touch()
            frontend = root / "old-dist"
            frontend.mkdir()
            (root / "pending.json").write_text(json.dumps({
                "manifest": str(manifest), "frontend": str(frontend), "revision": "old\n",
            }))
            with patch.object(release, "STATE", root), patch.object(release, "SITE", root), \
                    patch.object(release, "compose"), patch.object(release, "smoke_check"):
                release.recover_pending()
            self.assertEqual((root / "dist").resolve(), frontend)
            self.assertEqual((root / "active-manifest").resolve(), manifest)
            self.assertEqual((root / "deployed-sha").read_text(), "old\n")
            self.assertFalse((root / "pending.json").exists())


if __name__ == "__main__":
    unittest.main()

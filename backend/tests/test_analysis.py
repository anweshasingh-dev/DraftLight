import io
import json
import socket
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib import error

from backend.app import create_app


VALID_ANALYSIS = {
    "where_you_left_off": "The launch plan has a goal and a partial checklist.",
    "unfinished": [
        "The launch date is still undecided.",
        "Ownership of the final review is unclear.",
    ],
    "next_steps": [
        {
            "title": "Choose a launch window",
            "description": "Narrow the open timing decision before adding more tasks.",
            "action": "Write down two possible dates and the tradeoff for each.",
        },
        {
            "title": "Assign the review",
            "description": "Give the remaining quality check a clear owner.",
            "action": "Name one person to review the checklist.",
        },
        {
            "title": "Finish the checklist",
            "description": "Turn the partial list into a usable launch sequence.",
            "action": "Add the next three concrete launch tasks.",
        },
    ],
}


class FakeResponse:
    def __init__(self, payload):
        self.body = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, _exception_type, _exception, _traceback):
        return False

    def read(self):
        return self.body


def ollama_response(model_content):
    return FakeResponse({"message": {"content": model_content}})


class AnalysisApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "test.db"
        self.app = create_app(
            {
                "TESTING": True,
                "DATABASE": str(self.database_path),
                "OLLAMA_BASE_URL": "http://127.0.0.1:11434",
                "OLLAMA_MODEL": "test-model:latest",
                "OLLAMA_TIMEOUT_SECONDS": 1.5,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def create_project(self, *, content="Goal: launch the project. Checklist: draft copy."):
        response = self.client.post(
            "/api/projects",
            json={"title": "Launch plan", "content": content},
        )
        self.assertEqual(response.status_code, 201)
        return response.get_json()["data"]["project"]

    @patch("backend.analysis.request.urlopen")
    def test_successful_analysis_uses_local_ollama_and_does_not_modify_project(
        self, urlopen
    ):
        project = self.create_project()
        urlopen.return_value = ollama_response(json.dumps(VALID_ANALYSIS))

        response = self.client.post(f"/api/projects/{project['id']}/analyze")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["analysis"], VALID_ANALYSIS)
        stored = self.client.get(f"/api/projects/{project['id']}").get_json()["data"][
            "project"
        ]
        self.assertEqual(stored, project)

        http_request = urlopen.call_args.args[0]
        self.assertEqual(http_request.full_url, "http://127.0.0.1:11434/api/chat")
        self.assertEqual(urlopen.call_args.kwargs["timeout"], 1.5)
        request_payload = json.loads(http_request.data)
        self.assertEqual(request_payload["model"], "test-model:latest")
        self.assertFalse(request_payload["stream"])
        self.assertEqual(request_payload["format"]["required"], list(VALID_ANALYSIS))
        self.assertIn(project["title"], request_payload["messages"][1]["content"])
        self.assertIn(project["content"], request_payload["messages"][1]["content"])

    @patch("backend.analysis.request.urlopen")
    def test_project_not_found_does_not_call_ollama(self, urlopen):
        response = self.client.post("/api/projects/missing/analyze")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"], "Project not found.")
        urlopen.assert_not_called()

    @patch("backend.analysis.request.urlopen")
    def test_empty_or_punctuation_only_project_content_is_rejected(self, urlopen):
        for content in ("", "   \n\t", "... ---"):
            with self.subTest(content=content):
                project = self.create_project(content=content)
                response = self.client.post(f"/api/projects/{project['id']}/analyze")
                self.assertEqual(response.status_code, 400)
                self.assertIn("meaningful project content", response.get_json()["error"])

        urlopen.assert_not_called()

    @patch("backend.analysis.request.urlopen")
    def test_ollama_unavailable_returns_recoverable_error(self, urlopen):
        project = self.create_project()
        urlopen.side_effect = error.URLError(ConnectionRefusedError())

        response = self.client.post(f"/api/projects/{project['id']}/analyze")

        self.assertEqual(response.status_code, 503)
        self.assertIn("could not reach Ollama", response.get_json()["error"])

    @patch("backend.analysis.request.urlopen")
    def test_model_unavailable_returns_recoverable_error(self, urlopen):
        project = self.create_project()
        urlopen.side_effect = error.HTTPError(
            "http://127.0.0.1:11434/api/chat",
            404,
            "Not Found",
            {},
            io.BytesIO(b'{"error":"model test-model:latest not found"}'),
        )

        response = self.client.post(f"/api/projects/{project['id']}/analyze")

        self.assertEqual(response.status_code, 503)
        self.assertIn("test-model:latest", response.get_json()["error"])
        self.assertIn("ollama pull", response.get_json()["error"])

    @patch("backend.analysis.request.urlopen")
    def test_invalid_json_response_is_rejected(self, urlopen):
        project = self.create_project()
        urlopen.return_value = ollama_response("This is not JSON")

        response = self.client.post(f"/api/projects/{project['id']}/analyze")

        self.assertEqual(response.status_code, 502)
        self.assertIn("invalid JSON", response.get_json()["error"])

    @patch("backend.analysis.request.urlopen")
    def test_incomplete_analysis_is_rejected(self, urlopen):
        project = self.create_project()
        incomplete = {
            "where_you_left_off": "A partial plan exists.",
            "unfinished": ["The date is open."],
        }
        urlopen.return_value = ollama_response(json.dumps(incomplete))

        response = self.client.post(f"/api/projects/{project['id']}/analyze")

        self.assertEqual(response.status_code, 502)
        self.assertIn("incomplete analysis", response.get_json()["error"])

    @patch("backend.analysis.request.urlopen")
    def test_request_timeout_returns_recoverable_error(self, urlopen):
        project = self.create_project()
        urlopen.side_effect = socket.timeout()

        response = self.client.post(f"/api/projects/{project['id']}/analyze")

        self.assertEqual(response.status_code, 504)
        self.assertIn("timed out", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()

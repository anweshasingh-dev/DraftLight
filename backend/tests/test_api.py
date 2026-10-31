import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

from backend.app import create_app


class ApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "test.db"
        self.app = create_app(
            {
                "TESTING": True,
                "DATABASE": str(self.database_path),
            }
        )
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def create_project(self, **overrides):
        payload = {"title": "A draft", "content": "Opening notes"}
        payload.update(overrides)
        response = self.client.post("/api/projects", json=payload)
        self.assertEqual(response.status_code, 201)
        return response.get_json()["data"]["project"]

    def legacy_project(self, **overrides):
        project = {
            "id": "legacy-project",
            "title": "Legacy draft",
            "content": "Kept from browser storage",
            "created_at": "2026-10-01T09:00:00+05:30",
            "updated_at": "2026-10-20T18:30:00+05:30",
        }
        project.update(overrides)
        return project

    def test_health_endpoint(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"success": True, "data": {"status": "ok"}},
        )

    def test_create_project(self):
        response = self.client.post(
            "/api/projects",
            json={"title": "New idea", "content": "A first note"},
        )

        self.assertEqual(response.status_code, 201)
        project = response.get_json()["data"]["project"]
        self.assertEqual(project["title"], "New idea")
        self.assertEqual(project["content"], "A first note")
        self.assertTrue(project["id"])
        self.assertEqual(project["created_at"], project["updated_at"])

    def test_retrieve_all_projects_most_recently_updated_first(self):
        first = self.create_project(title="First")
        second = self.create_project(title="Second")
        self.client.put(
            f"/api/projects/{first['id']}",
            json={"content": "Updated later"},
        )

        response = self.client.get("/api/projects")

        self.assertEqual(response.status_code, 200)
        projects = response.get_json()["data"]["projects"]
        self.assertEqual(
            [project["id"] for project in projects],
            [first["id"], second["id"]],
        )

    def test_retrieve_single_project(self):
        created = self.create_project()

        response = self.client.get(f"/api/projects/{created['id']}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["project"], created)

    def test_update_project_preserves_omitted_fields_and_created_at(self):
        created = self.create_project()

        response = self.client.put(
            f"/api/projects/{created['id']}",
            json={"title": "Renamed"},
        )

        self.assertEqual(response.status_code, 200)
        updated = response.get_json()["data"]["project"]
        self.assertEqual(updated["title"], "Renamed")
        self.assertEqual(updated["content"], created["content"])
        self.assertEqual(updated["created_at"], created["created_at"])
        self.assertNotEqual(updated["updated_at"], created["updated_at"])

    def test_delete_project(self):
        created = self.create_project()

        response = self.client.delete(f"/api/projects/{created['id']}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["id"], created["id"])
        self.assertEqual(
            self.client.get(f"/api/projects/{created['id']}").status_code,
            404,
        )

    def test_missing_project_behavior(self):
        missing_url = "/api/projects/missing-id"

        self.assertEqual(self.client.get(missing_url).status_code, 404)
        self.assertEqual(
            self.client.put(missing_url, json={"title": "Nope"}).status_code,
            404,
        )
        self.assertEqual(self.client.delete(missing_url).status_code, 404)

    def test_invalid_request_data(self):
        cases = [
            self.client.post("/api/projects", data="not json"),
            self.client.post("/api/projects", json=[]),
            self.client.post("/api/projects", json={"title": 42}),
            self.client.post("/api/projects", json={"id": "client-id"}),
            self.client.put("/api/projects/any-id", json={}),
        ]

        for response in cases:
            with self.subTest(response=response):
                self.assertEqual(response.status_code, 400)
                self.assertFalse(response.get_json()["success"])

    def test_import_legacy_projects_preserves_ids_and_timestamps(self):
        legacy = self.legacy_project()

        response = self.client.post(
            "/api/projects/import",
            json={"projects": [legacy]},
        )

        self.assertEqual(response.status_code, 201)
        migration = response.get_json()["data"]["migration"]
        self.assertEqual(migration["status"], "imported")
        self.assertEqual(migration["projects"], [legacy])

    def test_import_retry_is_idempotent(self):
        legacy = self.legacy_project()
        payload = {"projects": [legacy]}
        first = self.client.post("/api/projects/import", json=payload)

        second = self.client.post("/api/projects/import", json=payload)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(
            second.get_json()["data"]["migration"]["status"],
            "already_imported",
        )
        projects = self.client.get("/api/projects").get_json()["data"]["projects"]
        self.assertEqual(projects, [legacy])

    def test_imported_projects_are_ordered_by_actual_timestamp(self):
        older = self.legacy_project(
            id="older-with-offset",
            updated_at="2026-10-30T15:00:00+05:30",
        )
        newer = self.legacy_project(
            id="newer-in-utc",
            updated_at="2026-10-30T10:00:00+00:00",
        )
        self.client.post(
            "/api/projects/import",
            json={"projects": [older, newer]},
        )

        projects = self.client.get("/api/projects").get_json()["data"]["projects"]

        self.assertEqual([project["id"] for project in projects], [newer["id"], older["id"]])

    def test_import_does_not_overwrite_existing_projects(self):
        existing = self.create_project()

        response = self.client.post(
            "/api/projects/import",
            json={"projects": [self.legacy_project()]},
        )

        self.assertEqual(response.status_code, 409)
        projects = self.client.get("/api/projects").get_json()["data"]["projects"]
        self.assertEqual(projects, [existing])

    def test_import_rejects_invalid_projects_atomically(self):
        valid = self.legacy_project()
        invalid = self.legacy_project(id="", title=42)

        response = self.client.post(
            "/api/projects/import",
            json={"projects": [valid, invalid]},
        )

        self.assertEqual(response.status_code, 400)
        projects = self.client.get("/api/projects").get_json()["data"]["projects"]
        self.assertEqual(projects, [])

    def test_database_initialization_and_persistence_across_app_instances(self):
        created = self.create_project()

        with closing(sqlite3.connect(self.database_path)) as connection:
            table = connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
                ("projects",),
            ).fetchone()
        self.assertEqual(table, ("projects",))

        second_app = create_app(
            {
                "TESTING": True,
                "DATABASE": str(self.database_path),
            }
        )
        second_client = second_app.test_client()
        response = second_client.get(f"/api/projects/{created['id']}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["project"], created)


if __name__ == "__main__":
    unittest.main()

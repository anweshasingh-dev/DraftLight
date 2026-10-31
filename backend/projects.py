from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from flask import Blueprint, request

from . import database


projects_bp = Blueprint("projects", __name__)
PROJECT_FIELDS = {"title", "content"}
IMPORTED_PROJECT_FIELDS = {
    "id",
    "title",
    "content",
    "created_at",
    "updated_at",
}


def _error(message: str, status_code: int = 400):
    return {"success": False, "error": message}, status_code


def _json_object() -> tuple[dict[str, Any] | None, tuple | None]:
    if not request.is_json:
        return None, _error("Request body must be JSON.")

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, _error("Request body must be a JSON object.")

    return payload, None


def _validate_project_fields(
    payload: dict[str, Any], *, require_field: bool
) -> tuple[dict[str, str] | None, tuple | None]:
    unexpected_fields = set(payload) - PROJECT_FIELDS
    if unexpected_fields:
        fields = ", ".join(sorted(unexpected_fields))
        return None, _error(f"Unexpected field(s): {fields}.")

    if require_field and not payload:
        return None, _error("At least one of title or content is required.")

    for field in PROJECT_FIELDS:
        if field in payload and not isinstance(payload[field], str):
            return None, _error(f"{field} must be a string.")

    return payload, None


def _is_timestamp(value: Any) -> bool:
    if not isinstance(value, str):
        return False

    normalized = f"{value[:-1]}+00:00" if value.endswith("Z") else value
    try:
        return datetime.fromisoformat(normalized).tzinfo is not None
    except ValueError:
        return False


def _validate_imported_projects(
    payload: dict[str, Any],
) -> tuple[list[database.Project] | None, tuple | None]:
    if set(payload) != {"projects"} or not isinstance(payload["projects"], list):
        return None, _error("projects must be an array.")

    projects = payload["projects"]
    if not projects:
        return None, _error("At least one project is required.")

    validated: list[database.Project] = []
    project_ids: set[str] = set()

    for index, project in enumerate(projects):
        if not isinstance(project, dict) or set(project) != IMPORTED_PROJECT_FIELDS:
            return None, _error(f"Project at index {index} has an invalid shape.")

        if not isinstance(project["id"], str) or not project["id"]:
            return None, _error(f"Project at index {index} has an invalid id.")
        if project["id"] in project_ids:
            return None, _error("Project ids must be unique.")

        if not isinstance(project["title"], str) or not isinstance(
            project["content"], str
        ):
            return None, _error(f"Project at index {index} has invalid text fields.")
        if not _is_timestamp(project["created_at"]) or not _is_timestamp(
            project["updated_at"]
        ):
            return None, _error(f"Project at index {index} has invalid timestamps.")

        project_ids.add(project["id"])
        validated.append(database.Project(**project))

    return validated, None


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


@projects_bp.get("/api/projects")
def list_projects():
    return {"success": True, "data": {"projects": database.list_projects()}}


@projects_bp.get("/api/projects/<string:project_id>")
def get_project(project_id: str):
    project = database.get_project(project_id)
    if project is None:
        return _error("Project not found.", 404)
    return {"success": True, "data": {"project": project}}


@projects_bp.post("/api/projects")
def create_project():
    payload, error = _json_object()
    if error:
        return error

    fields, error = _validate_project_fields(payload, require_field=False)
    if error:
        return error

    timestamp = _timestamp()
    project = database.Project(
        id=str(uuid4()),
        title=fields.get("title", "Untitled Draft"),
        content=fields.get("content", ""),
        created_at=timestamp,
        updated_at=timestamp,
    )
    database.insert_project(project)
    return {"success": True, "data": {"project": project}}, 201


@projects_bp.post("/api/projects/import")
def import_projects():
    payload, error = _json_object()
    if error:
        return error

    projects, error = _validate_imported_projects(payload)
    if error:
        return error

    status = database.import_projects(projects)
    if status == "conflict":
        return _error(
            "The project database already contains different projects; "
            "browser data was not imported.",
            409,
        )

    response_status = 201 if status == "imported" else 200
    return {
        "success": True,
        "data": {
            "migration": {
                "status": status,
                "projects": database.list_projects(),
            }
        },
    }, response_status


@projects_bp.put("/api/projects/<string:project_id>")
def update_project(project_id: str):
    payload, error = _json_object()
    if error:
        return error

    fields, error = _validate_project_fields(payload, require_field=True)
    if error:
        return error

    existing = database.get_project(project_id)
    if existing is None:
        return _error("Project not found.", 404)

    project = database.Project(
        id=existing["id"],
        title=fields.get("title", existing["title"]),
        content=fields.get("content", existing["content"]),
        created_at=existing["created_at"],
        updated_at=_timestamp(),
    )
    database.update_project(project)
    return {"success": True, "data": {"project": project}}


@projects_bp.delete("/api/projects/<string:project_id>")
def delete_project(project_id: str):
    if not database.delete_project(project_id):
        return _error("Project not found.", 404)
    return {"success": True, "data": {"id": project_id}}

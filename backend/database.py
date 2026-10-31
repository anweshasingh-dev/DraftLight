import sqlite3
from pathlib import Path
from typing import Literal, TypedDict

from flask import Flask, current_app, g


SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Draft',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at
ON projects(updated_at DESC);
"""


class Project(TypedDict):
    id: str
    title: str
    content: str
    created_at: str
    updated_at: str


ImportStatus = Literal["imported", "already_imported", "conflict"]


def get_db() -> sqlite3.Connection:
    """Return the SQLite connection for the current application context."""
    if "db" not in g:
        database_path = Path(current_app.config["DATABASE"])
        database_path.parent.mkdir(parents=True, exist_ok=True)

        connection = sqlite3.connect(database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 5000")
        g.db = connection

    return g.db


def close_db(_error: BaseException | None = None) -> None:
    """Close the current application context's database connection."""
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db() -> None:
    """Create the database schema when it does not already exist."""
    with get_db() as connection:
        connection.executescript(SCHEMA)


def init_app(app: Flask) -> None:
    """Register database lifecycle handling with Flask."""
    app.teardown_appcontext(close_db)


def _project_from_row(row: sqlite3.Row) -> Project:
    return Project(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def list_projects() -> list[Project]:
    rows = get_db().execute(
        """
        SELECT id, title, content, created_at, updated_at
        FROM projects
        ORDER BY julianday(updated_at) DESC, id DESC
        """
    ).fetchall()
    return [_project_from_row(row) for row in rows]


def get_project(project_id: str) -> Project | None:
    row = get_db().execute(
        """
        SELECT id, title, content, created_at, updated_at
        FROM projects
        WHERE id = ?
        """,
        (project_id,),
    ).fetchone()
    return _project_from_row(row) if row is not None else None


def insert_project(project: Project) -> None:
    with get_db() as connection:
        connection.execute(
            """
            INSERT INTO projects (id, title, content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                project["id"],
                project["title"],
                project["content"],
                project["created_at"],
                project["updated_at"],
            ),
        )


def update_project(project: Project) -> None:
    with get_db() as connection:
        connection.execute(
            """
            UPDATE projects
            SET title = ?, content = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                project["title"],
                project["content"],
                project["updated_at"],
                project["id"],
            ),
        )


def delete_project(project_id: str) -> bool:
    with get_db() as connection:
        cursor = connection.execute(
            "DELETE FROM projects WHERE id = ?",
            (project_id,),
        )
    return cursor.rowcount > 0


def _projects_match(existing: Project, candidate: Project) -> bool:
    fields = ("id", "title", "content", "created_at", "updated_at")
    return all(existing[field] == candidate[field] for field in fields)


def import_projects(projects: list[Project]) -> ImportStatus:
    """Atomically import legacy projects without replacing existing records."""
    connection = get_db()
    connection.execute("BEGIN IMMEDIATE")

    try:
        rows = connection.execute(
            """
            SELECT id, title, content, created_at, updated_at
            FROM projects
            """
        ).fetchall()
        existing = {}
        for row in rows:
            project = _project_from_row(row)
            existing[project["id"]] = project

        if existing:
            already_imported = all(
                project["id"] in existing
                and _projects_match(existing[project["id"]], project)
                for project in projects
            )
            connection.rollback()
            return "already_imported" if already_imported else "conflict"

        connection.executemany(
            """
            INSERT INTO projects (id, title, content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (
                    project["id"],
                    project["title"],
                    project["content"],
                    project["created_at"],
                    project["updated_at"],
                )
                for project in projects
            ],
        )
        connection.commit()
        return "imported"
    except Exception:
        connection.rollback()
        raise

# Draftlight — Architecture Specification

## 1. Direction and Current State

Draftlight is a local-first application with a React and Vite frontend plus a local Flask and SQLite backend. The frontend uses the Flask project API through relative `/api` paths, and SQLite is the primary project store. The AI area remains a presentational placeholder; no Ollama integration exists yet.

The next phase adds an Ollama-backed analysis service behind the existing Flask boundary. This extends the current foundation rather than redesigning it.

```text
┌──────────────────────────────────────────────────────┐
│ React + Vite frontend                               │
│ Project library | context workspace | AI assistance │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP / JSON
                         v
┌──────────────────────────────────────────────────────┐
│ Local Flask backend                                  │
│ app setup + feature modules + database / AI adapters │
└─────────────────┬───────────────────────┬────────────┘
                  v                       v
       ┌───────────────────┐   ┌──────────────────────┐
       │ Local SQLite DB   │   │ Local Ollama daemon  │
       └───────────────────┘   └──────────────────────┘
```

The diagram describes the intended full MVP architecture. Frontend API integration, Flask, and SQLite are implemented; Ollama remains a future task.

---

## 2. Current Foundation to Preserve

- **Frontend:** React 18, Vite, scoped vanilla CSS, and shared theme tokens.
- **Project model:** `id`, `title`, `content`, `created_at`, and `updated_at`.
- **Persistence:** SQLite is the source of truth. `frontend/src/services/projectStorage.js` reads legacy browser projects only for safe migration.
- **Behavior:** Create, select, edit, rename, and delete projects; changes save automatically.

Future work must preserve this behavior and user-created content.

---

## 3. Intended MVP Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 18 + Vite | Library, text workspace, AI-assistance UI, and explicit user actions. |
| Backend | Python 3.10+ + Flask | Local JSON API, validation, orchestration, and errors. |
| Database | SQLite via `sqlite3` | Durable local project persistence. |
| Local AI | Ollama + an open-weight model | Analyze user-provided context and return structured guidance. |

Avoid a UI framework, ORM, state library, or other dependency unless a concrete requirement justifies it.

---

## 4. Backend Boundaries

```text
backend/
├── tests/
│   ├── __init__.py
│   └── test_api.py              # Isolated API and persistence tests
├── app.py                       # App factory, health route, errors, startup
├── config.py                    # Local database path
├── database.py                  # Schema, connections, SQL, transactions
├── projects.py                  # Project routes, validation, orchestration
└── requirements.txt             # Pinned backend dependencies
```

- `app.py` creates and configures Flask, initializes the database, registers project routes, exposes health status, and owns application-level error handling.
- `projects.py` keeps the related project routes, validation, ID and timestamp creation, and CRUD orchestration together. It contains no SQL.
- `database.py` owns the small SQLite schema, connection lifecycle, parameterized SQL, and import transaction.
- `config.py` remains separate so the database path can still be overridden through Flask configuration.
- AI modules own prompts, Ollama communication, parsing, and schema validation.
- Add a new layer only when it introduces a meaningful boundary; do not add forwarding-only service or repository modules.

---

## 5. Generic Project Model

Projects do not require a writing genre or any other category. The MVP needs a title and user-provided text context plus identifiers and timestamps.

```sql
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Draft',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at
ON projects(updated_at DESC);
```

The API model should match the frontend shape to reduce migration risk. AI analysis is derived data and is not required to create or edit a project. Persist it only if a later proven requirement justifies doing so.

---

## 6. API Surface

- `GET /api/projects` — list projects by most recent update.
- `POST /api/projects` — create a project.
- `POST /api/projects/import` — atomically and idempotently import validated legacy browser projects without overwriting an existing library.
- `GET /api/projects/<id>` — retrieve one project.
- `PUT /api/projects/<id>` — update its title and/or content.
- `DELETE /api/projects/<id>` — delete a project after explicit UI confirmation.
- `GET /api/health` — report backend availability.
- `POST /api/analysis` — planned for a later task; analyze supplied text context without mutating the project.

Implemented endpoints use `{"success": true, "data": { ... }}` for successful responses and `{"success": false, "error": "Human-readable explanation"}` for errors, with appropriate status codes and validated JSON inputs.

---

## 7. Structured AI Boundary

The first response schema is deliberately small and general:

| Field | Type | Purpose |
|---|---|---|
| `summary` | string | Concise description of the current state. |
| `unfinished` | string list | Unfinished parts or open threads. |
| `questions` | string list | Blockers or unclear points. |
| `next_steps` | object list | A few titled actions with short rationales. |

- Treat model output as untrusted input.
- Validate keys, types, list sizes, and reasonable text limits before display.
- Return a recoverable error for invalid output; never trust raw malformed output.
- Analysis is read-only and cannot update stored project content.
- Suggestions remain separate until the user explicitly copies or applies one.

---

## 8. Incremental Transition

1. Add Flask and SQLite while the frontend continues using its current storage. **Complete.**
2. Connect CRUD to the API and preserve existing content before SQLite becomes the source of truth. **Complete.**
3. Add Ollama behind the analysis service.
4. Add the validated continuation workflow to the existing companion area.

Repository inspection, image analysis, cloud services, specialized agents, and complex project schemas are outside the MVP.

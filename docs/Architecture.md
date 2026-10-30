# Draftlight — Architecture Specification

## 1. Direction and Current State

Draftlight is a local-first application with a React and Vite frontend. The current implementation is frontend-only: it stores projects in browser `localStorage`, and its AI area is a presentational placeholder. No Flask, SQLite, or Ollama integration exists yet.

The next phases incrementally add a local Flask API and SQLite database, then an Ollama-backed analysis service. This extends the current foundation rather than redesigning it.

```text
┌──────────────────────────────────────────────────────┐
│ React + Vite frontend                               │
│ Project library | context workspace | AI assistance │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP / JSON
                         v
┌──────────────────────────────────────────────────────┐
│ Local Flask backend                                  │
│ routes -> services -> database / AI adapters         │
└─────────────────┬───────────────────────┬────────────┘
                  v                       v
       ┌───────────────────┐   ┌──────────────────────┐
       │ Local SQLite DB   │   │ Local Ollama daemon  │
       └───────────────────┘   └──────────────────────┘
```

The diagram describes the intended MVP architecture, not the current runtime.

---

## 2. Current Foundation to Preserve

- **Frontend:** React 18, Vite, scoped vanilla CSS, and shared theme tokens.
- **Project model:** `id`, `title`, `content`, `created_at`, and `updated_at`.
- **Persistence:** `frontend/src/services/projectStorage.js` validates and saves projects in browser `localStorage`.
- **Behavior:** Create, select, edit, rename, and delete projects; changes save automatically.

Backend work must preserve this behavior and user-created content.

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
├── app.py                  # Application factory and startup
├── config.py               # DB path and Ollama URL
├── database/
│   ├── db.py               # Connections and transactions
│   └── schema.sql          # SQLite schema
├── routes/
│   ├── projects.py         # Project HTTP boundary
│   ├── analysis.py         # Analysis HTTP boundary
│   └── system.py           # Health HTTP boundary
└── services/
    ├── project_service.py  # Project behavior
    ├── analysis_service.py # Analysis workflow and validation
    └── ollama_service.py   # Ollama client and prompts
```

- Routes translate HTTP requests and responses; they contain no SQL or prompt logic.
- Services own application behavior and coordinate dependencies.
- Database modules own SQL, connections, and transactions.
- AI modules own prompts, Ollama communication, parsing, and schema validation.
- Add only modules needed by the current implementation task.

---

## 5. Generic Project Model

Projects do not require a writing genre or any other category. The MVP needs a title and user-provided text context plus identifiers and timestamps.

```sql
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Project',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at
ON projects(updated_at DESC);
```

The API model should match the frontend shape to reduce migration risk. AI analysis is derived data and is not required to create or edit a project. Persist it only if a later proven requirement justifies doing so.

---

## 6. Planned API Surface

- `GET /api/projects` — list projects by most recent update.
- `POST /api/projects` — create a project.
- `GET /api/projects/<id>` — retrieve one project.
- `PUT /api/projects/<id>` — update its title and/or content.
- `DELETE /api/projects/<id>` — delete a project after explicit UI confirmation.
- `GET /api/system/health` — report backend availability; include Ollama status once integrated.
- `POST /api/analysis` — analyze supplied text context without mutating the project.

Use one consistent success/error envelope, appropriate status codes, and validated inputs. Finalize exact payloads during their implementation tasks.

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

1. Add Flask and SQLite while the frontend continues using its current storage.
2. Connect CRUD to the API and preserve existing content before SQLite becomes the source of truth.
3. Add Ollama behind the analysis service.
4. Add the validated continuation workflow to the existing companion area.

Repository inspection, image analysis, cloud services, specialized agents, and complex project schemas are outside the MVP.

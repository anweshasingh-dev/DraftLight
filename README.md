# Draftlight

**A little light for the things you haven't finished.**

Draftlight is a local-first AI companion for returning to unfinished work. It helps you understand where you left off, notice what is unfinished or unclear, and find a practical next step.

The project is not limited to writing. Its simple text workspace can hold context for a story, software project, plan, personal goal, creative project, or any other work that has lost momentum.

> Understand where you left off. Find your next step. Keep going.

Draftlight is a working name. This repository makes no claim about name availability.

## Current Status

The frontend project workflow is connected to the local Flask API, with SQLite as the primary project store and safe migration for projects created by the earlier browser-storage version.

Currently implemented:

- React and Vite frontend shell.
- Split monochrome workspace with a project library, text workspace, and companion panel.
- Create, open, edit, rename, and delete projects.
- Automatic persistence in local SQLite storage through Flask.
- Generic projects with a title, text content, and timestamps.
- Local Flask JSON API with validated project CRUD routes.
- Safe, idempotent migration of valid legacy `localStorage` projects.
- Loading, saving, and recoverable backend error states.
- Automatic SQLite schema initialization and persistent project storage.
- Isolated backend tests for API behavior and persistence.
- Placeholder companion states for the future AI workflow.

Not implemented yet:

- Ollama connection or AI inference.
- Project analysis and next-step suggestions.

The companion panel currently contains placeholders. It does not send project content to an AI service.

## Run the Development Environment

### Prerequisites

- A current Node.js release.
- npm.
- Python 3.10 or newer.

### First-time setup

From the repository root in PowerShell:

```powershell
npm install --prefix frontend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### Start both development servers

Start Flask in the first terminal:

```powershell
.\.venv\Scripts\python.exe -m backend.app
```

Start Vite in a second terminal:

```powershell
npm run dev --prefix frontend
```

Open `http://127.0.0.1:5173/` in the browser. This is the single browser origin for local development.

Vite forwards requests beginning with `/api` to Flask on `http://127.0.0.1:5000` while preserving the request path. Browser-side API calls should therefore use relative paths such as:

- `/api/health`
- `/api/projects`

For example, `http://127.0.0.1:5173/api/health` is proxied to `http://127.0.0.1:5000/api/health`. Port 5000 remains available for direct backend debugging.

The proxy is development-only. Project management uses the Flask API and SQLite; browser `localStorage` is read only by the legacy migration path. SQLite creates `backend/draftlight.db` automatically when Flask first starts.

### Verification commands

To verify a frontend production build:

```powershell
npm run build --prefix frontend
```

Run the frontend service, migration, and hook tests with:

```powershell
npm test --prefix frontend
```

Run the isolated backend tests with:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend\tests -v
```

## Local Data

SQLite is the primary project database. The frontend retrieves and mutates projects through relative `/api` requests, which Vite proxies to Flask during development.

On first load, Draftlight checks the previous `draftlight.projects.v1` browser-storage key. If SQLite is empty, valid browser projects are imported atomically with their IDs and timestamps. A successful import writes the `draftlight.projects.sqlite-migration.v1` marker, but the original browser data is retained for recovery. Failed imports leave both the marker and browser data untouched so retrying is safe. If SQLite already contains different projects, Draftlight uses SQLite without overwriting or deleting the browser data.

## Product Principles

- **Momentum over automation:** Help people resume their work rather than completing it for them.
- **User control:** AI suggestions must never silently overwrite user-created content.
- **Local-first:** Keep project data and AI inference on the user's machine for the MVP.
- **General workspace:** Do not require project categories or separate interfaces for writing, code, art, or planning.
- **Small MVP:** Add capabilities incrementally and avoid speculative feature expansion.

## Planned MVP Architecture

The backend foundation now provides:

- A local Flask JSON API.
- SQLite as the durable project store.
- A practical backend split between application setup, project API behavior, configuration, and SQLite access.
- Frontend CRUD through relative API paths and a development proxy.
- Safe legacy browser-data migration.

The next phases will add:

- Local inference through Ollama and an open-weight model.
- Structured AI output that is validated before display.

The first AI workflow will summarize the current state, identify unfinished or unclear areas, and suggest a few practical next steps. Analysis remains read-only unless the user deliberately applies a suggestion.

## Roadmap

- [x] Task 1 — Frontend shell.
- [x] Task 2 — Project management and browser persistence.
- [x] Task 3 — Flask backend and SQLite foundation.
- [x] Task 4 — Connect frontend project management to the backend.
- [ ] Task 5 — Local AI analysis service through Ollama.
- [ ] Task 6 — First continuation workflow.

Detailed acceptance criteria are in [docs/Tasks.md](docs/Tasks.md).

## Repository Structure

```text
DraftLight/
├── docs/
│   ├── Product.md       # Product direction and MVP scope
│   ├── Architecture.md  # Current and planned architecture
│   ├── Design.md        # Split-workspace visual direction
│   ├── Rules.md         # Development and AI safety rules
│   └── Tasks.md         # Incremental implementation roadmap
├── frontend/            # React and Vite application
└── backend/             # Flask API, SQLite access, and backend tests
```

## Foundation Documents

- [Product specification](docs/Product.md)
- [Architecture specification](docs/Architecture.md)
- [Design and UI specification](docs/Design.md)
- [Development rules](docs/Rules.md)
- [Implementation roadmap](docs/Tasks.md)

## MVP Boundaries

The MVP does not include automatic repository inspection, image analysis, cloud sync, collaboration, specialized AI agents, automatic project completion, model training, or complex project-management features.

## Contributing

Before implementing a change, read the product specification, development rules, and current roadmap task. Keep changes focused, preserve user content, avoid unnecessary dependencies, and update the foundation documents before expanding product scope.

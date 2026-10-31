# Draftlight — Implementation Roadmap

This roadmap keeps the MVP incremental. Complete and verify each task before beginning the next.

## Task 1 — Frontend shell

**Status: Complete**

Established the React and Vite interface, project library, central text workspace, supporting companion panel, and split monochrome visual direction.

## Task 2 — Project management and local persistence

**Status: Complete**

Implemented project creation, selection, editing, renaming, deletion, timestamps, validation, and automatic browser `localStorage` persistence.

## Task 3 — Flask backend and SQLite foundation

**Status: Complete**

**Goal:** Introduce a local backend and durable database without adding AI behavior.

**Acceptance criteria:**

- A modular Flask application starts locally and exposes a health endpoint.
- SQLite initialization creates the generic projects table documented in `Architecture.md`.
- Project CRUD routes, validation, and orchestration are grouped by feature, while SQLite access remains separate.
- Request and response data are validated and errors are consistent.
- Automated backend tests cover database initialization and core CRUD behavior.
- No frontend behavior is switched to the backend in this task.

## Task 4 — Connect frontend project management to the backend

**Status: Complete**

**Goal:** Make SQLite the source of truth while preserving the existing experience and content.

**Acceptance criteria:**

- Existing create, open, edit, rename, and delete interactions use the Flask API.
- Loading, saving, empty, and recoverable error states are clear and non-destructive.
- Browser-stored projects are preserved through an explicit safe migration or export/import path before browser storage is retired.
- Project titles, text content, and timestamps survive reloads.
- The visual layout and interactions remain materially unchanged.
- Integration tests cover the primary project-management flow.

## Task 5 — Local AI analysis service through Ollama

**Goal:** Add a backend analysis service without yet building the full user workflow.

**Acceptance criteria:**

- Ollama configuration and health handling are isolated from routes.
- The service sends only user-provided text context to a configured local open-weight model.
- The model is prompted for summary, unfinished areas, questions, and next steps.
- Model output is parsed and validated before it reaches the API response.
- Invalid output, missing models, timeouts, and an offline Ollama daemon produce clear recoverable errors.
- Analysis is read-only and never changes stored project content.
- Service tests use mocks or fixtures and do not require live inference.

## Task 6 — First continuation workflow

**Goal:** Help the user understand where they left off and choose a practical next step in the existing companion area.

**Acceptance criteria:**

- The user can deliberately request analysis for the open project.
- The companion area displays the summary, unfinished or unclear areas, and a few practical next steps.
- Loading, empty, offline, invalid-response, and retry states are accessible and non-blocking.
- Suggestions remain visually distinct from user content.
- No suggestion changes the project unless the user takes an explicit action.
- The workflow is phrased generically and works without project categories.

## Deferred beyond the MVP

Repository inspection, image analysis, cloud sync, collaboration, specialized agents, automatic project completion, model training, and complex project-management features require separate product decisions and roadmap updates.

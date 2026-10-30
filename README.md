# Draftlight

**A little light for the things you haven't finished.**

Draftlight is a local-first AI companion for returning to unfinished work. It helps you understand where you left off, notice what is unfinished or unclear, and find a practical next step.

The project is not limited to writing. Its simple text workspace can hold context for a story, software project, plan, personal goal, creative project, or any other work that has lost momentum.

> Understand where you left off. Find your next step. Keep going.

Draftlight is a working name. This repository makes no claim about name availability.

## Current Status

The frontend foundation and browser-based project persistence are complete.

Currently implemented:

- React and Vite frontend shell.
- Split monochrome workspace with a project library, text workspace, and companion panel.
- Create, open, edit, rename, and delete projects.
- Automatic persistence in browser `localStorage`.
- Generic projects with a title, text content, and timestamps.
- Placeholder companion states for the future AI workflow.

Not implemented yet:

- Flask backend.
- SQLite persistence.
- Ollama connection or AI inference.
- Project analysis and next-step suggestions.

The companion panel currently contains placeholders. It does not send project content to an AI service.

## Run the Current Frontend

### Prerequisites

- A current Node.js release.
- npm.

### Setup

```bash
cd frontend
npm install
npm run dev
```

Open the local address printed by Vite.

To verify a production build:

```bash
cd frontend
npm run build
```

## Local Data

The current frontend stores projects in the browser under the `draftlight.projects.v1` local-storage key.

This data is local to the current browser profile. Clearing site data or using another browser can make those projects unavailable. A safe transition path must be provided before SQLite replaces browser storage.

## Product Principles

- **Momentum over automation:** Help people resume their work rather than completing it for them.
- **User control:** AI suggestions must never silently overwrite user-created content.
- **Local-first:** Keep project data and AI inference on the user's machine for the MVP.
- **General workspace:** Do not require project categories or separate interfaces for writing, code, art, or planning.
- **Small MVP:** Add capabilities incrementally and avoid speculative feature expansion.

## Planned MVP Architecture

The next phases will extend the current frontend with:

- A local Flask JSON API.
- SQLite as the durable project store.
- Clear route, service, database, and AI module boundaries.
- Local inference through Ollama and an open-weight model.
- Structured AI output that is validated before display.

The first AI workflow will summarize the current state, identify unfinished or unclear areas, and suggest a few practical next steps. Analysis remains read-only unless the user deliberately applies a suggestion.

## Roadmap

- [x] Task 1 — Frontend shell.
- [x] Task 2 — Project management and browser persistence.
- [ ] Task 3 — Flask backend and SQLite foundation.
- [ ] Task 4 — Connect frontend project management to the backend.
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
└── frontend/            # Current React and Vite application
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

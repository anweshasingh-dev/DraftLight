# DraftLight — Architecture Specification

## 1. System Overview

DraftLight is built as a lightweight, decoupled client-server application optimized for local execution.

```
┌────────────────────────────────────────────────────────┐
│                   User Web Browser                     │
│             React + Vite UI (Port 5173)                │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON REST
                           ▼
┌────────────────────────────────────────────────────────┐
│               DraftLight Backend Server                │
│              Python + Flask (Port 5000)                │
│                                                        │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   Project Service    │    │   Ollama AI Service  │  │
│  └──────────┬───────────┘    └──────────┬───────────┘  │
└─────────────┼───────────────────────────┼──────────────┘
              │ SQLite Direct             │ HTTP Client
              ▼                           ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     SQLite Database     │    │      Ollama Daemon      │
│   (draftlight.db file)  │    │  http://localhost:11434 │
│                         │    │  (Local Open-Weight LLM)│
└─────────────────────────┘    └─────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR, minimal build overhead, component-based modular UI. |
| **Styling** | Vanilla CSS / Tailwind CSS | Lightweight, modern utility styling without heavy UI framework bloat. |
| **Backend** | Python 3.10+ & Flask | Minimal boilerplate, native standard library support, straightforward REST routing. |
| **Database** | SQLite (via Python standard `sqlite3`) | Zero-configuration single file database; fully local, reliable, and portable. |
| **Local AI Engine** | Ollama REST API (`localhost:11434`) | Open-source, supports top open-weight models (`llama3.2`, `mistral`, `gemma2`, `qwen2.5`). |

---

## 3. Directory Structure

```
DraftLight/
├── docs/                      # Architectural & product documentation
│   ├── Product.md
│   ├── Architecture.md
│   ├── Design.md
│   └── Rules.md
├── frontend/                  # React + Vite application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Sidebar/       # Project list, creation, filters
│       │   ├── Editor/        # Writing canvas, title, word stats
│       │   ├── Companion/     # Analysis summary, 3 continuation cards
│       │   └── Common/        # OllamaStatusBadge, Modal, Toast
│       ├── services/          # API client modules (api.js, ollama.js)
│       ├── hooks/             # Custom hooks (useProjects.js, useAutoSave.js)
│       └── styles/            # Theme tokens and global styling
└── backend/                   # Python + Flask application
    ├── requirements.txt
    ├── app.py                 # Application factory and entrypoint
    ├── config.py              # Port, DB path, Ollama host configuration
    ├── database/
    │   ├── db.py              # SQLite connection helper & migrations
    │   └── schema.sql         # Table definitions
    ├── routes/
    │   ├── projects.py        # Project CRUD REST endpoints
    │   ├── ai.py              # Analysis and continuation endpoints
    │   └── system.py          # Ollama health and model query endpoints
    └── services/
        ├── project_service.py # Project business logic and SQLite operations
        ├── ollama_service.py  # Ollama HTTP client and prompt runner
        └── prompts.py         # Formatted prompt templates for AI reasoning
```

---

## 4. Database Schema (SQLite)

DraftLight uses a single normalized table with optional metadata for analysis persistence:

```sql
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Draft',
    content TEXT DEFAULT '',
    genre TEXT DEFAULT 'story', -- 'story', 'poem', 'blog', 'notes'
    last_analysis_json TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
```

---

## 5. API Specification

### System & Health Endpoints
- `GET /api/system/health`: Checks backend health and Ollama daemon connectivity.
- `GET /api/system/models`: Queries Ollama (`/api/tags`) to list installed local models.

### Project Endpoints
- `GET /api/projects`: List all projects (id, title, genre, word_count, updated_at).
- `POST /api/projects`: Create a new project.
- `GET /api/projects/<id>`: Retrieve full project details including content and cached analysis.
- `PUT /api/projects/<id>`: Update project title, content, or genre.
- `DELETE /api/projects/<id>`: Delete a project.

### AI Endpoints
- `POST /api/ai/analyze`
  - **Input:** `{ "project_id": str, "content": str, "model": str }`
  - **Output:** `{ "tone": str, "themes": list[str], "open_threads": list[str], "summary": str }`
- `POST /api/ai/continue`
  - **Input:** `{ "project_id": str, "content": str, "model": str, "style_hint": str }`
  - **Output:**
    ```json
    {
      "suggestions": [
        {
          "type": "narrative_momentum",
          "title": "Forward Momentum",
          "text": "..."
        },
        {
          "type": "catalyst_twist",
          "title": "Unforeseen Catalyst",
          "text": "..."
        },
        {
          "type": "reflective_depth",
          "title": "Reflective Subtext",
          "text": "..."
        }
      ]
    }
    ```

---

## 6. Local AI Integration Strategy

### Ollama Communication
- Backend communicates with Ollama via `requests` or `urllib` to `http://localhost:11434/api/generate` with `stream: false` (or server-sent events for real-time streaming in future iterations).
- Default recommended model: `llama3.2:3b` for fast consumer laptop execution, with seamless switching to `mistral:7b` or `qwen2.5:7b`.

### Prompt Architecture & Determinism
- **JSON Mode Enforced:** Prompts request strict JSON output with defined keys to avoid parsing failures.
- **Context Truncation Guard:** If text exceeds model context limit, a sliding window of the latest characters/paragraphs is prioritized alongside the opening lines to maintain context without exceeding token budgets.
- **Non-Destructive Boundary:** All continuations represent standalone extension candidates; none are merged into the draft on the backend.


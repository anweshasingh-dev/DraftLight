# Draftlight — Development Rules & Conventions

## 1. Core Principles

- **Simplicity First:** Avoid premature optimization, heavy frameworks, or unnecessary abstractions. If Python's built-in `sqlite3` or a 20-line React hook accomplishes the task cleanly, do not install a third-party dependency.
- **Local-First:** Project data and AI inference remain local for the MVP. Do not introduce accounts, cloud sync, telemetry, or hosted AI services without an approved product change.
- **Preserve User Content:** Treat user-created titles and context as irreplaceable. Migrations and persistence changes must preserve existing data or provide an explicit, recoverable transition.
- **Maintainable Modularity:** Each module (database, routes, services, AI logic, and frontend components) has one clear responsibility and an obvious interface.
- **AI-Assisted Friendliness:** Maintain small, readable files (<200 lines where practical), typed Python functions, and clean component contracts.
- **Incremental Delivery:** Implement and verify one roadmap task at a time. Do not expand scope without first updating the product requirements and roadmap.

---

## 2. Frontend Conventions (React + Vite)

### Architecture & Components
- **Functional Components & Hooks:** Use standard React functional components. Avoid class components and complex state management libraries (Redux, Zustand) for the MVP—React's built-in `useState`, `useCallback`, and custom hooks are sufficient.
- **Clean Service Boundaries:**
  - Never call raw `fetch()` directly inside UI components.
  - All backend interactions must be encapsulated in `src/services/api.js` or another focused API client module. The frontend must not call Ollama directly.
- **Component File Structure:** Group components by feature domain:
  - `components/Sidebar/`: Project drawer and creation controls.
  - `components/Editor/`: The project context workspace and text stats.
  - `components/Companion/`: Analysis view and suggestion cards.
  - `components/Common/`: Badges, buttons, and alert toasts.
- **Styling Discipline:** Prefer the existing scoped CSS and shared tokens. Preserve the split workspace and restrained monochrome direction defined in `docs/Design.md`.

---

## 3. Backend Conventions (Python + Flask)

### Structure & Routing
- **Modular Blueprints:** Group routes by concern:
  - `routes/projects.py` for project CRUD.
  - `routes/analysis.py` for the user-requested analysis workflow.
  - `routes/system.py` for Ollama health and local model discovery.
- **Uniform API Response Structure:**
  - **Success:** `{"success": true, "data": { ... }}`
  - **Error:** `{"success": false, "error": "Human-readable explanation"}`
- **Standard HTTP Status Codes:** `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `503 Service Unavailable` (for Ollama offline).

### Database Rules (SQLite)
- Always use parameterized queries (`?`) to prevent SQL injection.
- Manage connections and cursors using Python context managers (`with get_db() as conn:`).
- Keep schemas clean in `database/schema.sql` and run automatic table creation upon backend startup.

### Code Style
- Use Python 3.10+ type annotations for service function signatures.
- Standard PEP 8 formatting.
- Handle exceptions at service boundaries and return clear error messages to the API layer.

---

## 4. Local AI & Ollama Integration Rules (Critical)

### The Non-Overwrite Rule (User Control)
> [!IMPORTANT]
> **The AI must NEVER replace or mutate the user's existing text automatically.**
- All AI-generated analysis and next-step suggestions must remain separate from user-created content.
- The user must take an explicit action before any suggestion can enter the workspace.
- The backend must not touch the stored project content during analysis or continuation calls.

### Prompting & Output Parsing
- Prompts must request valid JSON matching the documented analysis schema.
- Treat model output as untrusted: parse it defensively and validate keys, types, list sizes, and text limits before display.
- If parsing or validation fails, return a clear recoverable error. Do not silently accept malformed output or expose it as trusted analysis.

### Local Performance & Latency Handling
- Set reasonable timeouts for Ollama HTTP calls (e.g., 60s) to avoid hanging requests if a user runs a large model on limited hardware.
- The frontend must display an animated, non-blocking analysis state during inference and provide a cancel option if generation takes too long.
- Default to recommending lightweight models (3B to 7B parameters) in all onboarding prompts and documentation.

---

## 5. Repository & Contribution Hygiene
- **Never commit:** `node_modules/`, `.venv/`, `__pycache__/`, `draftlight.db`, `.env`, or OS junk files (`.DS_Store`, `Thumbs.db`).
- **Keep PRs atomic:** One feature or fix per pull request.
- **Document Changes:** Any new API endpoint or configuration flag must be documented in `docs/Architecture.md`.


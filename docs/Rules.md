# DraftLight — Development Rules & Conventions

## 1. Core Principles

- **Simplicity First:** Avoid premature optimization, heavy frameworks, or unnecessary abstractions. If Python's built-in `sqlite3` or a 20-line React hook accomplishes the task cleanly, do not install a third-party dependency.
- **Hacktoberfest-Ready Modularity:** Each module (database, routes, services, frontend components) should have single responsibilities and obvious interfaces so contributors can easily add features or fix bugs in isolation.
- **AI-Assisted Friendliness:** Maintain small, readable files (<200 lines where practical), typed Python functions, and clean component contracts.

---

## 2. Frontend Conventions (React + Vite)

### Architecture & Components
- **Functional Components & Hooks:** Use standard React functional components. Avoid class components and complex state management libraries (Redux, Zustand) for the MVP—React's built-in `useState`, `useCallback`, and custom hooks are sufficient.
- **Clean Service Boundaries:**
  - Never call raw `fetch()` directly inside UI components.
  - All API interactions must be encapsulated in `src/services/api.js` or `src/services/ollama.js`.
- **Component File Structure:** Group components by feature domain:
  - `components/Sidebar/`: Project drawer and creation controls.
  - `components/Editor/`: The drafting canvas and word stats.
  - `components/Companion/`: Analysis view and suggestion cards.
  - `components/Common/`: Badges, buttons, and alert toasts.
- **Styling Discipline:** Use clean Tailwind utility classes or scoped CSS. Maintain consistent spacing, typography tokens, and the warm dark palette defined in `docs/Design.md`.

---

## 3. Backend Conventions (Python + Flask)

### Structure & Routing
- **Modular Blueprints:** Group routes by concern:
  - `routes/projects.py` for project CRUD.
  - `routes/ai.py` for Ollama analysis and generation.
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

### The Non-Overwrite Rule (Author Sovereignty)
> [!IMPORTANT]
> **The AI must NEVER replace or mutate the user's existing text automatically.**
- All AI-generated continuations must be returned as separate candidate suggestions.
- The user must explicitly click an action (`Append to Draft`, `Insert at Cursor`, or `Copy`) for AI text to enter the editor.
- The backend must not touch the stored project content during analysis or continuation calls.

### Prompting & Output Parsing
- Prompts must explicitly instruct the local LLM to return valid JSON with strict schema tags (e.g. `tone`, `themes`, `suggestions`).
- Backend `ollama_service.py` must include a robust fallback parser that cleans markdown fences (````json ... ````) before deserializing.
- If JSON parsing fails due to local model quirks, fall back to a structured delimiter parser rather than crashing the user request.

### Local Performance & Latency Handling
- Set reasonable timeouts for Ollama HTTP calls (e.g., 60s) to avoid hanging requests if a user runs a large model on limited hardware.
- The frontend must display an animated, non-blocking "Illuminating..." state during inference and provide an abort controller or cancel option if generation takes too long.
- Default to recommending lightweight models (3B to 7B parameters) in all onboarding prompts and documentation.

---

## 5. Repository & Contribution Hygiene
- **Never commit:** `node_modules/`, `.venv/`, `__pycache__/`, `draftlight.db`, `.env`, or OS junk files (`.DS_Store`, `Thumbs.db`).
- **Keep PRs atomic:** One feature or fix per pull request.
- **Document Changes:** Any new API endpoint or configuration flag must be documented in `docs/Architecture.md`.


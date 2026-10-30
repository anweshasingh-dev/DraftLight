# Draftlight — Product Specification

## 1. Product Direction

**Draftlight — A little light for the things you haven't finished.**

Draftlight is a local-first AI companion for returning to unfinished work. It helps a person understand where they left off, what remains unfinished or unclear, what may be blocking progress, and what practical step they could take next.

The work may be a story, article, software project, plan, personal goal, creative project, or another unfinished idea. Draftlight does not require the user to classify it. The shared problem is lost momentum.

**Core promise: Understand where you left off. Find your next step. Keep going.**

Draftlight supports the user's judgment rather than taking over the work. AI analysis and suggestions remain separate from user-created content until the user explicitly chooses to use them.

---

## 2. Product Principles

1. **Momentum over automation:** Help the user regain context and take a manageable next step; do not attempt to complete the whole project.
2. **Local-first:** Keep project data and AI inference on the user's machine for the MVP.
3. **User control:** Preserve user-created content. Never silently rewrite, replace, or append to it.
4. **General workspace:** Use a simple title and text context that can represent many kinds of unfinished work without category-specific interfaces.
5. **Small, focused MVP:** Prefer a useful continuation loop over a broad feature set.

---

## 3. Core Experience

```text
[1. Create or open a project]
              |
              v
[2. Add or review the available context]
              |
              v
[3. Ask Draftlight to assess the current state]
              |
              v
[4. Review a summary, unfinished areas, and open questions]
              |
              v
[5. Choose a practical next step]
              |
              v
[6. Continue the work and save it locally]
```

The initial AI experience works only with the text and notes the user provides. A software project, for example, can be represented by pasted notes or relevant snippets, but Draftlight will not automatically inspect its repository in the MVP.

---

## 4. Scope by Stage

### Current foundation (Tasks 1 and 2 complete)

- React and Vite frontend shell.
- Split workspace with a project library, text workspace, and supporting companion area.
- Create, open, edit, rename, and delete projects.
- Generic project records containing a title, text content, and timestamps.
- Automatic persistence in the browser's local storage.
- Placeholder AI states; no backend or AI connection is implemented yet.

### Planned MVP functionality

- Flask backend with SQLite persistence, replacing browser storage as the project source of truth after a safe transition.
- Existing project-management interactions connected to the backend.
- Local AI inference through Ollama and an open-weight model.
- Structured, validated analysis that provides:
  - a concise summary of where the user left off;
  - unfinished parts, open questions, blockers, or unclear areas;
  - a few practical suggestions for continuing.
- User-controlled actions for copying or deliberately applying a suggestion without silently changing the project.

### Future possibilities (not commitments)

The generic project model may later support additional ways to supply context, such as selected repository information or visual material. These possibilities require separate product decisions and are not part of the MVP.

---

## 5. Explicit MVP Exclusions

- Automatic analysis of Git repositories or codebases.
- Image or visual analysis for art and craft projects.
- Cloud synchronization, accounts, or collaboration.
- Multiple specialized AI agents.
- Automatic completion of entire projects.
- Fine-tuning or model training.
- Complex project-management features, workflows, or category-specific modes.
- Silent AI edits to user-created content.

---

## 6. MVP Success Criteria

- A returning user can quickly understand the state of an unfinished project.
- The user receives a small set of relevant, practical next steps from the context they supplied.
- User content remains safe, local, and under explicit user control.
- The workflow remains useful across different kinds of projects without separate implementations.
- Setup and local inference remain achievable on ordinary consumer hardware.

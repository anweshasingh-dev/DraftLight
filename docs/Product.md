# DraftLight — Product Specification

## 1. Vision & Overview
**DraftLight** is a local-first AI writing companion designed to revive unfinished creative writing—abandoned drafts, poems, blog posts, fragmented story scenes, and scattered thought notes. 

Rather than generating full texts from scratch, DraftLight serves as an empathetic sounding board that reads what already exists, assesses its emotional tone, themes, and unresolved threads, and provides three distinct, imaginative directions to help the writer overcome creative block.

---

## 2. Core Principles
1. **Local-First & Private:** All data and AI inference run locally on the user's machine. Zero cloud lock-in, zero external telemetry, zero paid AI APIs.
2. **Author Sovereignty (Never Overwrite):** The AI never mutates or replaces the user's original words. Continuations are presented alongside the original draft for the author to choose, tweak, append, or discard.
3. **Low Friction & Distraction-Free:** Simple, lightweight interface focused on writing and reflection, avoiding feature bloat and complicated formatting bars.
4. **Open Source & Hacktoberfest Friendly:** Clean, modular, and easy for new open-source contributors to understand and extend.

---

## 3. User Workflow
```
[1. Create / Open Project] 
          │
          ▼
[2. Paste or Write Unfinished Content]
          │
          ▼
[3. Request AI Analysis ("Illuminate Draft")]
          │
          ▼
[4. Inspect Analysis & 3 Distinct Continuations]
    ├─ Direction A: Narrative Momentum / Escalation
    ├─ Direction B: Character / Perspective Shift
    └─ Direction C: Thematic / Reflective Turn
          │
          ▼
[5. Insert or Append Chosen Continuation into Editor]
          │
          ▼
[6. Write & Save Project Locally to SQLite]
```

---

## 4. MVP Features

### A. Project Management
- Create a new project (Title, Content, Project Type: Story, Poem, Blog Post, Notes).
- Project list/drawer showing saved drafts with last modified timestamp and word count.
- Manual and auto-save (debounced) to local SQLite database.
- Delete or rename existing projects.

### B. Distraction-Free Writing Canvas
- Plain text / lightweight Markdown editor.
- Live word and character counter.
- Clean typography tuned for long-form reading and drafting.

### C. AI Analysis ("Draft Diagnosis")
- Single-click action to analyze current draft content.
- Summary of:
  - Detected tone and mood (e.g., melancholic, inquisitive, tense).
  - Key thematic elements and motifs.
  - Potential cliffhangers or unresolved plot/thematic questions.

### D. Three Distinct Continuation Suggestions
- Structured generation providing three contrasting creative paths:
  1. **Direct Progression:** Moves the immediate scene or argument forward logically.
  2. **Surprise / Catalyst:** Introduces an unexpected development, counter-argument, or external factor.
  3. **Atmospheric / Reflective:** Deepens internal monologue, sensory detail, or thematic subtext.
- Action controls per suggestion:
  - **Append to Draft**: Adds text to the end of the editor.
  - **Insert at Cursor**: Inserts at the current caret position.
  - **Copy to Clipboard**: Copies suggestion text for selective manual pasting.

### E. Ollama Environment Status
- Real-time indicator of Ollama connection status (Online / Offline / Model missing).
- Model selector dropdown from locally installed Ollama models (defaulting to recommended lightweight models e.g., `llama3.2:3b` or `mistral:7b`).

---

## 5. Explicit Exclusions (Out of Scope for MVP)
To keep the MVP lean, maintainable, and achievable, the following features are intentionally excluded:
- ❌ **No Commercial Cloud APIs:** No OpenAI, Anthropic, or external API keys.
- ❌ **No User Authentication or Accounts:** Single-user local desktop application.
- ❌ **No Cloud Sync or Multi-Device Sync:** Data lives exclusively in the local SQLite database.
- ❌ **No Heavy WYSIWYG / Rich Text formatting:** No complex tables, embedded media, or Word-style formatting engines. Plain text and simple Markdown only.
- ❌ **No Real-Time Collaborative Editing:** No WebSockets/CRDTs.
- ❌ **No Automated Overwrite:** AI cannot replace or rephrase text without explicit user button clicks.
- ❌ **No Agentic Tool-Use / Web Browsing:** The model focuses strictly on creative reasoning over provided text.

---

## 6. Success Metrics for Hacktoberfest MVP
- Quick local setup: Clone repo, `pip install`, `npm install`, and launch in under 5 minutes.
- Smooth offline inference on consumer hardware with 3B–8B parameter open-weight models.
- Responsive, intuitive UI with zero data loss.


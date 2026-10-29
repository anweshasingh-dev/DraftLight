# DraftLight — Design & UI Specification

## 1. Visual Identity & Mood

**DraftLight** is designed around the metaphor of a warm, comforting desk lamp lighting up a writer’s journal at night.

Unlike clinical, corporate AI chat tools or frantic social editors, DraftLight fosters an ambient, focused, and calm creative sanctuary. The AI acts not as an intrusive co-author, but as a silent lantern revealing paths forward through creative fog.

---

## 2. Color Palette & Theming

DraftLight uses a warm dark aesthetic by default, prioritizing long-session eye comfort with warm amber and paper-toned accents.

### Core Theme Tokens
- **Background Deep (`--bg-primary`):** `#111317` — Deep obsidian canvas.
- **Surface / Card (`--bg-secondary`):** `#1A1D24` — Muted slate for sidebars and panels.
- **Surface Elevated (`--bg-elevated`):** `#242832` — Interactive cards and modals.
- **Border Subtle (`--border-subtle`):** `#2D323F` — Low-contrast dividers.
- **Accent Primary / Lantern Light (`--accent-lantern`):** `#E5A93C` — Warm amber for calls to action, focus highlights, and AI illumination.
- **Text High-Contrast (`--text-main`):** `#F1F5F9` — Crisp, legible reading text.
- **Text Muted (`--text-muted`):** `#8B95A5` — Labels, timestamps, and word counters.

### Directional Accent Accents (The Three Paths)
- **Path A (Forward Momentum):** Amber Gold (`#F59E0B`)
- **Path B (The Catalyst / Twist):** Sage / Emerald (`#10B981`)
- **Path C (Reflective Subtext):** Twilight Violet (`#8B5CF6`)

---

## 3. Typography System

| Context | Font Family | Weight & Size | Purpose |
|---|---|---|---|
| **Editor Canvas** | `Lora`, `Merriweather`, or `Georgia` (Serif) | Regular 400 (18px/1.75 line-height) | Immersive, comfortable creative drafting. |
| **UI Labels & Controls** | `Inter`, `system-ui` (Sans-Serif) | Medium 500, Semi-Bold 600 (13px–15px) | Clean legibility for toolbars and buttons. |
| **AI Suggestion Text** | `Inter` or `Lora` | Regular 400 (15px/1.6 line-height) | Clear distinction between suggestions and main draft. |

---

## 4. Layout Architecture (3-Panel Adaptive Grid)

DraftLight uses a clean, non-intrusive 3-panel split view:

```
┌───────────────┬───────────────────────────────────┬───────────────────────┐
│ Drafts (Left) │       Writing Canvas (Center)     │ AI Companion (Right)  │
├───────────────┼───────────────────────────────────┼───────────────────────┤
│ [ + New Draft ]│ Title: Midnight Train to Kyoto   │ [ ✨ Illuminate Draft ]│
│               │                                   │                       │
│ • Kyoto Scene │ The rain beat against the cold    │ ── DRAFT PULSE ────── │
│   1,240 words │ glass of the carriage window...   │ Tone: Melancholic     │
│   2 hrs ago   │                                   │ Motif: Rain, departure│
│               │                                   │                       │
│ • Ghost Story │                                   │ ── THREE PATHS ────── │
│   450 words   │                                   │ [1. Forward Momentum] │
│   Yesterday   │                                   │ [2. Sudden Catalyst]  │
│               │                                   │ [3. Reflective Turn]  │
│ [⚙ Ollama:OK] │ Words: 1,240 | Characters: 6,810  │ [Insert] [Append]     │
└───────────────┴───────────────────────────────────┴───────────────────────┘
```

### Panel 1: Project Drawer (Left, Collapsible)
- New Project button with genre badge selector (Story, Poem, Essay, Notes).
- List of saved drafts sorted by `updated_at`.
- Bottom bar indicating Ollama status (`● Connected: llama3.2:3b` or `○ Offline`).

### Panel 2: The Writing Canvas (Center)
- Clean, distraction-free text area with generous margins.
- Clean header: Editable project title with subtle "Saved" indicator.
- Footer toolbar: Live word count, character count, and quick toggle to show/hide the companion panel.

### Panel 3: The Companion Panel / "The Lantern" (Right)
- Action trigger: **"Illuminate Draft"** button with warm amber gradient.
- **Section 1: Draft Diagnosis / Pulse:**
  - Detected Mood/Tone tags (e.g., `Melancholy`, `Suspense`).
  - Core themes identified.
  - Unresolved story hooks or open thoughts.
- **Section 2: Three Continuation Cards:**
  - Card title and short premise badge.
  - Continuation snippet (2–4 paragraphs).
  - Explicit non-destructive action bar:
    - **[ Insert at Cursor ]**
    - **[ Append to End ]**
    - **[ Copy to Clipboard ]**

---

## 5. State & Micro-Interaction Guidelines

1. **Empty State:**
   - Soft placeholder: *"Paste an abandoned draft, a half-finished poem, or scattered notes to begin..."*
2. **AI Inference State ("Illuminating..."):**
   - No harsh blocking popups.
   - The Companion panel displays a gentle breathing amber glow along the border while Ollama generates tokens locally.
3. **Ollama Offline / Setup Needed:**
   - A friendly, unobtrusive notification bar: *"Ollama is not detected at localhost:11434. Run `ollama serve` and make sure your model is pulled."*
   - Direct link to setup documentation.


import { useEffect, useRef } from 'react';
import { Circle, PencilLine } from 'lucide-react';
import './EditorWorkspace.css';

function getWordCount(content) {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function EditorWorkspace({
  project,
  persistenceLabel,
  focusRequest,
  onTitleChange,
  onContentChange,
}) {
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  useEffect(() => {
    if (focusRequest?.target === 'title') {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }

    if (focusRequest?.target === 'content') {
      contentInputRef.current?.focus();
    }
  }, [focusRequest]);

  return (
    <section className="editor-workspace" aria-label="Writing editor">
      <header className="editor-toolbar">
        <span className="window-label">
          <PencilLine size={14} strokeWidth={1.7} aria-hidden="true" />
          Draft
        </span>
        <span className="memory-label">
          <Circle size={6} fill="currentColor" aria-hidden="true" />
          {persistenceLabel}
        </span>
      </header>

      <div className="editor-scroll-area">
        <div className="editor-page">
          <label className="sr-only" htmlFor="project-title">
            Project title
          </label>
          <input
            ref={titleInputRef}
            id="project-title"
            className="project-title-input"
            type="text"
            value={project.title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Untitled project"
            autoComplete="off"
          />

          <div className="title-rule" aria-hidden="true">
            <span />
          </div>

          <label className="sr-only" htmlFor="project-content">
            Project content
          </label>
          <textarea
            ref={contentInputRef}
            id="project-content"
            className="writing-area"
            value={project.content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Begin wherever the light finds you…"
            spellCheck="true"
          />
        </div>
      </div>

      <footer className="editor-statusbar">
        <span>{getWordCount(project.content).toLocaleString()} words</span>
        <span>{project.content.length.toLocaleString()} characters</span>
      </footer>
    </section>
  );
}

export default EditorWorkspace;

import { useEffect, useRef } from 'react';
import {
  Bold,
  Circle,
  FileText,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  MoreHorizontal,
  PencilLine,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';
import './EditorWorkspace.css';

function getWordCount(content) {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatUpdatedAt(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function FormattingToolbar() {
  return (
    <div className='formatting-toolbar' aria-hidden='true'>
      <Undo2 size={17} />
      <Redo2 size={17} />
      <span className='toolbar-divider' />
      <b>H1</b><b>H2</b><b>H3</b>
      <span className='toolbar-divider' />
      <Bold size={17} /><Italic size={17} /><Underline size={17} />
      <span className='toolbar-divider' />
      <List size={17} /><ListOrdered size={17} /><Quote size={17} />
      <span className='toolbar-divider' />
      <Link size={17} /><Image size={17} /><MoreHorizontal size={17} />
    </div>
  );
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
  const wordCount = getWordCount(project.content);

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
          <span>02</span>
          Writing desk
        </span>
        <span className="memory-label" title={persistenceLabel}>
          <Circle size={6} fill="currentColor" aria-hidden="true" />
          {persistenceLabel}
        </span>
      </header>

      <div className="editor-scroll-area">
        <article className="editor-page">
          <header className="document-masthead">
            <span className="document-type">
              <FileText size={13} strokeWidth={1.7} aria-hidden="true" />
              Working document
            </span>
            <span className="document-date">Updated {formatUpdatedAt(project.updated_at)}</span>
          </header>

          <div className="title-field">
            <label className="editor-field-label" htmlFor="project-title">
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
          </div>

          <div className="title-rule" aria-hidden="true">
            <span />
          </div>

          <div className="writing-heading">
            <label className="editor-field-label" htmlFor="project-content">
              <span className='sr-only'>Project content</span>
              <span aria-hidden='true'>Project context</span>
            </label>
            <span>{wordCount.toLocaleString()} words</span>
          </div>

          <div className="writing-field">
            <textarea
              ref={contentInputRef}
              aria-label='Project content'
              id="project-content"
              className="writing-area"
              value={project.content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Begin wherever the light finds you…"
              spellCheck="true"
            />
          </div>

          <p className="editor-footnote">
            Keep the useful fragments. Draftlight will help you find the next thread later.
          </p>
          <FormattingToolbar />
        </article>
      </div>

      <footer className="editor-statusbar">
        <span className="document-mode">
          <Circle size={5} fill="currentColor" aria-hidden="true" />
          Local document
        </span>
        <span className="document-counts">
          <span>{wordCount.toLocaleString()} words</span>
          <span>{project.content.length.toLocaleString()} characters</span>
        </span>
      </footer>
    </section>
  );
}

export default EditorWorkspace;

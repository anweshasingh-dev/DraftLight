import { useState } from 'react';
import {
  BarChart3,
  EllipsisVertical,
  Feather,
  FileText,
  FolderOpen,
  Home,
  Library,
  PenLine,
  Plus,
  Trash2,
} from 'lucide-react';
import './ProjectSidebar.css';
import './ProjectMenu.css';

function getPreview(content) {
  const preview = content.replace(/\s+/g, ' ').trim();
  return preview || 'An empty page, ready for a first line.';
}

function formatModified(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'recently' : new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatProjectNumber(index) {
  return String(index + 1).padStart(2, '0');
}

function ProjectSidebar({
  projects,
  selectedProjectId,
  persistenceLabel,
  isCreating,
  onSelect,
  onCreate,
  onRename,
  onDeleteRequest,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <aside className="project-sidebar" aria-label="Project library">
      <header className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <Feather size={18} strokeWidth={1.8} />
        </span>
        <span>
          <strong>DraftLight</strong>
          <small>A little light for unfinished work.</small>
        </span>
      </header>

      <nav className='primary-nav' aria-label='Primary navigation'>
        <button className='primary-nav-item is-active' type='button'>
          <Home size={19} strokeWidth={1.7} aria-hidden='true' />
          Home
        </button>
        <button className='primary-nav-item' type='button'>
          <Library size={19} strokeWidth={1.7} aria-hidden='true' />
          Library
        </button>
        <button className='primary-nav-item' type='button'>
          <FolderOpen size={19} strokeWidth={1.7} aria-hidden='true' />
          Open projects
          <span className='nav-count'>{projects.length}</span>
        </button>
        <button className='primary-nav-item' type='button'>
          <BarChart3 size={19} strokeWidth={1.7} aria-hidden='true' />
          Insights
        </button>
      </nav>

      <div className="library-heading">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Open projects</h1>
        </div>
        <span className="project-count" aria-label={`${projects.length} projects`}>
          {String(projects.length).padStart(2, '0')}
        </span>
      </div>

      <button
        className="new-project-button"
        type="button"
        onClick={onCreate}
        disabled={isCreating}
      >
        <Plus size={16} aria-hidden="true" />
        {isCreating ? 'Creating…' : 'New project'}
      </button>

      <nav className="project-list" aria-label="Projects">
        {projects.length > 0 ? (
          projects.map((project, index) => (
            <div
              className="project-list-row"
              key={project.id}
              data-active={project.id === selectedProjectId}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenuId(null);
              }}
            >
              <button
                className="project-list-item"
                type="button"
                aria-current={project.id === selectedProjectId ? 'page' : undefined}
                onClick={() => {
                  setOpenMenuId(null);
                  onSelect(project.id);
                }}
              >
                <span className="project-item-title">
                  <span className="project-index" aria-hidden="true">
                    {formatProjectNumber(index)}
                  </span>
                  <strong>{project.title || 'Untitled Draft'}</strong>
                </span>
                <span className="project-preview">{getPreview(project.content)}</span>
                <span className="project-modified">
                  Edited {formatModified(project.updated_at)}
                </span>
              </button>

              <div className="project-menu-container">
                <button
                  className="project-menu-trigger"
                  type="button"
                  aria-label={`Project actions for ${project.title || 'Untitled Draft'}`}
                  aria-haspopup="menu"
                  aria-expanded={openMenuId === project.id}
                  aria-controls={`project-menu-${project.id}`}
                  onClick={() =>
                    setOpenMenuId((currentId) => (currentId === project.id ? null : project.id))
                  }
                >
                  <EllipsisVertical size={16} aria-hidden="true" />
                </button>

                {openMenuId === project.id && (
                  <div className="project-menu" id={`project-menu-${project.id}`} role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuId(null);
                        onRename(project.id);
                      }}
                    >
                      <PenLine size={13} aria-hidden="true" />
                      Rename
                    </button>
                    <button
                      className="project-menu-delete"
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuId(null);
                        onDeleteRequest(project.id);
                      }}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="library-empty-state">
            <FileText size={22} strokeWidth={1.4} aria-hidden="true" />
            <p>No unfinished work yet.</p>
            <span>Create a project and leave yourself somewhere to return to.</span>
          </div>
        )}
      </nav>

      <footer className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        <span className="status-copy" title={persistenceLabel}>
          {persistenceLabel}
        </span>
      </footer>
    </aside>
  );
}

export default ProjectSidebar;

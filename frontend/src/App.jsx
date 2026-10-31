import { useEffect, useState } from 'react';
import { FilePlus2, LoaderCircle, ServerOff } from 'lucide-react';
import ConfirmDialog from './components/Common/ConfirmDialog';
import CompanionPanel from './components/Companion/CompanionPanel';
import EditorWorkspace from './components/Editor/EditorWorkspace';
import ProjectSidebar from './components/Sidebar/ProjectSidebar';
import { useProjects } from './hooks/useProjects';

function App() {
  const {
    projects,
    loadStatus,
    statusMessage,
    isCreating,
    isDeleting,
    reloadProjects,
    createProject,
    openProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const pendingDeleteProject = projects.find((project) => project.id === pendingDeleteId) ?? null;

  useEffect(() => {
    if (loadStatus !== 'ready') return;
    setSelectedProjectId((currentId) => {
      if (projects.some((project) => project.id === currentId)) return currentId;
      return projects[0]?.id ?? null;
    });
  }, [loadStatus, projects]);

  function updateSelectedProject(field, value) {
    if (selectedProjectId) updateProject(selectedProjectId, { [field]: value });
  }

  async function handleCreateProject() {
    const projectId = await createProject();
    if (!projectId) return;

    setSelectedProjectId(projectId);
    setFocusRequest({ projectId, target: 'content', token: Date.now() });
  }

  async function handleSelectProject(projectId) {
    const project = await openProject(projectId);
    if (!project) return;
    setSelectedProjectId(projectId);
    setFocusRequest(null);
  }

  async function handleRenameProject(projectId) {
    const project = await openProject(projectId);
    if (!project) return;
    setSelectedProjectId(projectId);
    setFocusRequest({ projectId, target: 'title', token: Date.now() });
  }

  async function confirmDeleteProject() {
    if (!pendingDeleteProject) return;

    const remainingProjects = projects.filter((project) => project.id !== pendingDeleteProject.id);
    const deleted = await deleteProject(pendingDeleteProject.id);
    if (!deleted) return;

    if (selectedProjectId === pendingDeleteProject.id) {
      setSelectedProjectId(remainingProjects[0]?.id ?? null);
      setFocusRequest(null);
    }

    setPendingDeleteId(null);
  }

  return (
    <main className="app-shell">
      <ProjectSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        persistenceLabel={statusMessage}
        isCreating={isCreating}
        onSelect={handleSelectProject}
        onCreate={handleCreateProject}
        onRename={handleRenameProject}
        onDeleteRequest={setPendingDeleteId}
      />

      {loadStatus === 'loading' ? (
        <section className="workspace-empty-state" aria-live="polite">
          <LoaderCircle className="loading-icon" size={30} strokeWidth={1.3} aria-hidden="true" />
          <p className="eyebrow">Opening the library</p>
          <h2>Gathering your projects.</h2>
          <p>Draftlight is checking SQLite and any browser projects that need migration.</p>
        </section>
      ) : loadStatus === 'error' ? (
        <section className="workspace-empty-state" role="alert">
          <ServerOff size={30} strokeWidth={1.3} aria-hidden="true" />
          <p className="eyebrow">The local backend is unavailable</p>
          <h2>Your work is still safe.</h2>
          <p>{statusMessage}</p>
          <button type="button" onClick={reloadProjects}>
            Retry connection
          </button>
        </section>
      ) : selectedProject ? (
        <div className="workspace-shell">
          <EditorWorkspace
            key={selectedProject.id}
            project={selectedProject}
            persistenceLabel={statusMessage}
            focusRequest={
              focusRequest?.projectId === selectedProject.id ? focusRequest : null
            }
            onTitleChange={(title) => updateSelectedProject('title', title)}
            onContentChange={(content) => updateSelectedProject('content', content)}
          />
          <CompanionPanel />
        </div>
      ) : (
        <section className="workspace-empty-state">
          <FilePlus2 size={30} strokeWidth={1.3} aria-hidden="true" />
          <p className="eyebrow">The desk is clear</p>
          <h2>Begin with an empty page.</h2>
          <p>
            Create a project to start writing. Your work will be kept in local SQLite storage.
          </p>
          <button type="button" onClick={handleCreateProject} disabled={isCreating}>
            Create first project
          </button>
        </section>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteProject)}
        projectTitle={pendingDeleteProject?.title || 'Untitled Draft'}
        isBusy={isDeleting}
        onCancel={() => {
          if (!isDeleting) setPendingDeleteId(null);
        }}
        onConfirm={confirmDeleteProject}
      />
    </main>
  );
}

export default App;

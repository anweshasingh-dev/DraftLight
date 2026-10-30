import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import ConfirmDialog from './components/Common/ConfirmDialog';
import CompanionPanel from './components/Companion/CompanionPanel';
import EditorWorkspace from './components/Editor/EditorWorkspace';
import ProjectSidebar from './components/Sidebar/ProjectSidebar';
import { useProjects } from './hooks/useProjects';

const persistenceLabels = {
  ready: 'Browser storage ready',
  saved: 'Saved in this browser',
  invalid: 'Saved data was unreadable',
  unavailable: 'Memory only',
};

function App() {
  const { projects, storageStatus, isCreating, createProject, updateProject, deleteProject } =
    useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const pendingDeleteProject = projects.find((project) => project.id === pendingDeleteId) ?? null;
  const persistenceLabel = persistenceLabels[storageStatus];

  function updateSelectedProject(field, value) {
    if (selectedProjectId) updateProject(selectedProjectId, { [field]: value });
  }

  function handleCreateProject() {
    const projectId = createProject();
    if (!projectId) return;

    setSelectedProjectId(projectId);
    setFocusRequest({ projectId, target: 'content', token: Date.now() });
  }

  function handleSelectProject(projectId) {
    setSelectedProjectId(projectId);
    setFocusRequest(null);
  }

  function handleRenameProject(projectId) {
    setSelectedProjectId(projectId);
    setFocusRequest({ projectId, target: 'title', token: Date.now() });
  }

  function confirmDeleteProject() {
    if (!pendingDeleteProject) return;

    const remainingProjects = projects.filter((project) => project.id !== pendingDeleteProject.id);
    deleteProject(pendingDeleteProject.id);

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
        persistenceLabel={persistenceLabel}
        isCreating={isCreating}
        onSelect={handleSelectProject}
        onCreate={handleCreateProject}
        onRename={handleRenameProject}
        onDeleteRequest={setPendingDeleteId}
      />

      {selectedProject ? (
        <div className="workspace-shell">
          <EditorWorkspace
            key={selectedProject.id}
            project={selectedProject}
            persistenceLabel={persistenceLabel}
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
            Create a project to start writing. Your work will be kept locally in this browser.
          </p>
          <button type="button" onClick={handleCreateProject} disabled={isCreating}>
            Create first project
          </button>
        </section>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteProject)}
        projectTitle={pendingDeleteProject?.title || 'Untitled Draft'}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeleteProject}
      />
    </main>
  );
}

export default App;

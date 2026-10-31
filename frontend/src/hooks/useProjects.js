import { useCallback, useEffect, useRef, useState } from 'react';
import * as projectApi from '../services/projectApi';
import { loadProjectsWithMigration } from '../services/projectMigration';

const DEFAULT_SAVE_DELAY = 450;

export function useProjects({
  api = projectApi,
  loadProjectLibrary = loadProjectsWithMigration,
  storage,
  saveDelay = DEFAULT_SAVE_DELAY,
} = {}) {
  const [projects, setProjects] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('Connecting to SQLite…');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const projectsRef = useRef([]);
  const saveEntriesRef = useRef(new Map());
  const creationLockRef = useRef(false);
  const deletionLocksRef = useRef(new Set());
  const loadRequestRef = useRef(0);

  const commitProjects = useCallback((updater) => {
    const nextProjects = updater(projectsRef.current);
    projectsRef.current = nextProjects;
    setProjects(nextProjects);
    return nextProjects;
  }, []);

  const reloadProjects = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoadStatus('loading');
    setStatusMessage('Connecting to SQLite…');

    try {
      const result = await loadProjectLibrary({ api, storage });
      if (loadRequestRef.current !== requestId) return;
      commitProjects(() => result.projects);
      setLoadStatus('ready');
      setStatusMessage(result.notice ?? 'Saved in SQLite');
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;
      commitProjects(() => []);
      setLoadStatus('error');
      setStatusMessage(error.message);
    }
  }, [api, commitProjects, loadProjectLibrary, storage]);

  useEffect(() => {
    reloadProjects();
    return () => {
      loadRequestRef.current += 1;
      for (const entry of saveEntriesRef.current.values()) {
        if (entry.timer) clearTimeout(entry.timer);
        entry.cancelled = true;
      }
    };
  }, [reloadProjects]);

  const flushProject = useCallback(
    async (projectId) => {
      const entry = saveEntriesRef.current.get(projectId);
      if (!entry || entry.cancelled) return;
      entry.timer = null;

      if (entry.inFlight) {
        entry.requested = true;
        return entry.inFlight;
      }

      entry.requested = false;
      const revision = entry.revision;
      const snapshot = entry.snapshot;
      setStatusMessage('Saving to SQLite…');
      entry.inFlight = api.updateProject(projectId, {
        title: snapshot.title,
        content: snapshot.content,
      });

      try {
        const storedProject = await entry.inFlight;
        if (!entry.cancelled && entry.revision === revision) {
          entry.dirty = false;
          commitProjects((currentProjects) =>
            currentProjects.map((project) =>
              project.id === projectId ? storedProject : project,
            ),
          );
          setStatusMessage('Saved in SQLite');
        }
      } catch (error) {
        if (!entry.cancelled) {
          setStatusMessage(`${error.message} Unsaved edits remain in this session.`);
        }
      } finally {
        entry.inFlight = null;
        if (entry.cancelled) {
          saveEntriesRef.current.delete(projectId);
        } else if (entry.requested) {
          if (entry.timer) clearTimeout(entry.timer);
          entry.timer = setTimeout(() => flushProject(projectId), 0);
        }
      }
    },
    [api, commitProjects],
  );

  const createProject = useCallback(async () => {
    if (creationLockRef.current) return null;
    creationLockRef.current = true;
    setIsCreating(true);
    setStatusMessage('Creating in SQLite…');

    try {
      const project = await api.createProject({ title: 'Untitled Draft', content: '' });
      commitProjects((currentProjects) => [project, ...currentProjects]);
      setStatusMessage('Saved in SQLite');
      return project.id;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    } finally {
      creationLockRef.current = false;
      setIsCreating(false);
    }
  }, [api, commitProjects]);

  const openProject = useCallback(
    async (projectId) => {
      const pendingSave = saveEntriesRef.current.get(projectId);
      if (pendingSave?.dirty) {
        return projectsRef.current.find((project) => project.id === projectId) ?? null;
      }

      try {
        const project = await api.getProject(projectId);
        commitProjects((currentProjects) =>
          currentProjects.map((current) => (current.id === projectId ? project : current)),
        );
        return project;
      } catch (error) {
        setStatusMessage(error.message);
        return null;
      }
    },
    [api, commitProjects],
  );

  const updateProject = useCallback(
    (projectId, changes) => {
      let snapshot = null;
      commitProjects((currentProjects) =>
        currentProjects.map((project) => {
          if (project.id !== projectId) return project;
          const title = typeof changes.title === 'string' ? changes.title : project.title;
          const content = typeof changes.content === 'string' ? changes.content : project.content;
          if (title === project.title && content === project.content) return project;
          snapshot = { ...project, title, content, updated_at: new Date().toISOString() };
          return snapshot;
        }),
      );
      if (!snapshot) return;

      const entry = saveEntriesRef.current.get(projectId) ?? {
        revision: 0,
        timer: null,
        inFlight: null,
        requested: false,
        dirty: false,
        cancelled: false,
      };
      entry.revision += 1;
      entry.snapshot = snapshot;
      entry.requested = true;
      entry.dirty = true;
      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = setTimeout(() => flushProject(projectId), saveDelay);
      saveEntriesRef.current.set(projectId, entry);
      setStatusMessage('Unsaved edits — saving soon…');
    },
    [commitProjects, flushProject, saveDelay],
  );

  const deleteProject = useCallback(
    async (projectId) => {
      if (deletionLocksRef.current.has(projectId)) return false;
      deletionLocksRef.current.add(projectId);
      setIsDeleting(true);
      setStatusMessage('Deleting from SQLite…');

      const entry = saveEntriesRef.current.get(projectId);
      if (entry) {
        entry.cancelled = true;
        if (entry.timer) clearTimeout(entry.timer);
        if (entry.inFlight) await entry.inFlight.catch(() => undefined);
      }

      try {
        await api.deleteProject(projectId);
        saveEntriesRef.current.delete(projectId);
        commitProjects((currentProjects) =>
          currentProjects.filter((project) => project.id !== projectId),
        );
        setStatusMessage('Saved in SQLite');
        return true;
      } catch (error) {
        if (entry) {
          entry.cancelled = false;
          saveEntriesRef.current.set(projectId, entry);
        }
        setStatusMessage(error.message);
        return false;
      } finally {
        deletionLocksRef.current.delete(projectId);
        setIsDeleting(deletionLocksRef.current.size > 0);
      }
    },
    [api, commitProjects],
  );

  return {
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
  };
}

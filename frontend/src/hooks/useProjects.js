import { useCallback, useEffect, useRef, useState } from 'react';
import { mockProjects } from '../data/mockProjects';
import { loadProjects, saveProjects } from '../services/projectStorage';

function createProjectId() {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useProjects() {
  const [initialLoad] = useState(() => loadProjects(mockProjects));
  const [projects, setProjects] = useState(initialLoad.projects);
  const [storageStatus, setStorageStatus] = useState(initialLoad.status);
  const [isCreating, setIsCreating] = useState(false);
  const projectsRef = useRef(initialLoad.projects);
  const creationLockRef = useRef(false);
  const creationTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (creationTimerRef.current) clearTimeout(creationTimerRef.current);
    },
    [],
  );

  const commitProjects = useCallback((updater) => {
    const currentProjects = projectsRef.current;
    const nextProjects = updater(currentProjects);

    if (nextProjects === currentProjects) return currentProjects;

    projectsRef.current = nextProjects;
    setProjects(nextProjects);
    setStorageStatus(saveProjects(nextProjects) ? 'saved' : 'unavailable');
    return nextProjects;
  }, []);

  const createProject = useCallback(() => {
    if (creationLockRef.current) return null;

    creationLockRef.current = true;
    setIsCreating(true);

    const timestamp = new Date().toISOString();
    const project = {
      id: createProjectId(),
      title: 'Untitled Draft',
      content: '',
      created_at: timestamp,
      updated_at: timestamp,
    };

    commitProjects((currentProjects) => [project, ...currentProjects]);

    creationTimerRef.current = setTimeout(() => {
      creationLockRef.current = false;
      setIsCreating(false);
    }, 350);

    return project.id;
  }, [commitProjects]);

  const updateProject = useCallback(
    (projectId, changes) => {
      commitProjects((currentProjects) => {
        let didChange = false;
        const nextProjects = currentProjects.map((project) => {
          if (project.id !== projectId) return project;

          const title = typeof changes.title === 'string' ? changes.title : project.title;
          const content = typeof changes.content === 'string' ? changes.content : project.content;
          if (title === project.title && content === project.content) return project;

          didChange = true;
          return { ...project, title, content, updated_at: new Date().toISOString() };
        });

        return didChange ? nextProjects : currentProjects;
      });
    },
    [commitProjects],
  );

  const deleteProject = useCallback(
    (projectId) => {
      commitProjects((currentProjects) => {
        const nextProjects = currentProjects.filter((project) => project.id !== projectId);
        return nextProjects.length === currentProjects.length ? currentProjects : nextProjects;
      });
    },
    [commitProjects],
  );

  return {
    projects,
    storageStatus,
    isCreating,
    createProject,
    updateProject,
    deleteProject,
  };
}

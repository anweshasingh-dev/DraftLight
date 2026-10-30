export const PROJECTS_STORAGE_KEY = 'draftlight.projects.v1';
const LEGACY_PROJECTS_STORAGE_KEY = ['ghost', 'writer.projects.v1'].join('');

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function isValidTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isValidProject(project) {
  return (
    project !== null &&
    typeof project === 'object' &&
    typeof project.id === 'string' &&
    project.id.length > 0 &&
    typeof project.title === 'string' &&
    typeof project.content === 'string' &&
    isValidTimestamp(project.created_at) &&
    isValidTimestamp(project.updated_at)
  );
}

function isValidProjectCollection(projects) {
  if (!Array.isArray(projects) || !projects.every(isValidProject)) return false;
  return new Set(projects.map((project) => project.id)).size === projects.length;
}

export function loadProjects(seedProjects) {
  const storage = getBrowserStorage();

  if (!storage) {
    return { projects: seedProjects.map((project) => ({ ...project })), status: 'unavailable' };
  }

  try {
    let storedValue = storage.getItem(PROJECTS_STORAGE_KEY);

    if (storedValue === null) {
      storedValue = storage.getItem(LEGACY_PROJECTS_STORAGE_KEY);
    }

    if (storedValue === null) {
      return { projects: seedProjects.map((project) => ({ ...project })), status: 'ready' };
    }

    const projects = JSON.parse(storedValue);
    if (!isValidProjectCollection(projects)) {
      return { projects: [], status: 'invalid' };
    }

    if (storage.getItem(PROJECTS_STORAGE_KEY) === null) {
      storage.setItem(PROJECTS_STORAGE_KEY, storedValue);
      storage.removeItem?.(LEGACY_PROJECTS_STORAGE_KEY);
    }

    return { projects, status: 'ready' };
  } catch {
    return { projects: [], status: 'invalid' };
  }
}

export function saveProjects(projects) {
  const storage = getBrowserStorage();
  if (!storage || !isValidProjectCollection(projects)) return false;

  try {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

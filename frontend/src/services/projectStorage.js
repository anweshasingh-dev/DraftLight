import { isProject } from './projectApi';

export const PROJECTS_STORAGE_KEY = 'draftlight.projects.v1';
export const PROJECTS_MIGRATION_KEY = 'draftlight.projects.sqlite-migration.v1';
const LEGACY_PROJECTS_STORAGE_KEY = ['ghost', 'writer.projects.v1'].join('');
const MIGRATION_MARKER = 'complete';

export function getBrowserStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function isValidProjectCollection(projects) {
  if (!Array.isArray(projects) || !projects.every(isProject)) return false;
  return new Set(projects.map((project) => project.id)).size === projects.length;
}

export function readLegacyProjects(storage = getBrowserStorage()) {
  if (!storage) return { status: 'unavailable', projects: [] };

  try {
    const primaryValue = storage.getItem(PROJECTS_STORAGE_KEY);
    const sourceKey =
      primaryValue === null ? LEGACY_PROJECTS_STORAGE_KEY : PROJECTS_STORAGE_KEY;
    const storedValue = primaryValue ?? storage.getItem(LEGACY_PROJECTS_STORAGE_KEY);

    if (storedValue === null) return { status: 'none', projects: [] };

    const projects = JSON.parse(storedValue);
    if (!isValidProjectCollection(projects)) {
      return { status: 'invalid', projects: [], sourceKey };
    }

    return {
      status: 'ready',
      projects: projects.map((project) => ({ ...project })),
      sourceKey,
    };
  } catch {
    return { status: 'invalid', projects: [] };
  }
}

export function hasCompletedMigration(storage = getBrowserStorage()) {
  if (!storage) return false;
  try {
    return storage.getItem(PROJECTS_MIGRATION_KEY) === MIGRATION_MARKER;
  } catch {
    return false;
  }
}

export function markMigrationComplete(storage = getBrowserStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(PROJECTS_MIGRATION_KEY, MIGRATION_MARKER);
    return true;
  } catch {
    return false;
  }
}

export function projectsMatch(first, second) {
  return (
    first.id === second.id &&
    first.title === second.title &&
    first.content === second.content &&
    first.created_at === second.created_at &&
    first.updated_at === second.updated_at
  );
}

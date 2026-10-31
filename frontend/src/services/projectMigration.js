import * as projectApi from './projectApi';
import {
  hasCompletedMigration,
  markMigrationComplete,
  projectsMatch,
  readLegacyProjects,
} from './projectStorage';

export class ProjectMigrationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProjectMigrationError';
  }
}

function browserProjectsAlreadyStored(legacyProjects, backendProjects) {
  const backendById = new Map(backendProjects.map((project) => [project.id, project]));
  return legacyProjects.every((project) => {
    const storedProject = backendById.get(project.id);
    return storedProject && projectsMatch(project, storedProject);
  });
}

export async function loadProjectsWithMigration({
  api = projectApi,
  storage,
} = {}) {
  const backendProjects = await api.listProjects();

  if (hasCompletedMigration(storage)) {
    return { projects: backendProjects, notice: null };
  }

  const legacy = readLegacyProjects(storage);
  if (legacy.status === 'none' || legacy.status === 'unavailable') {
    markMigrationComplete(storage);
    return { projects: backendProjects, notice: null };
  }

  if (legacy.status === 'invalid') {
    throw new ProjectMigrationError(
      'Saved browser projects could not be read. They remain untouched; fix or export the browser data before retrying.',
    );
  }

  if (browserProjectsAlreadyStored(legacy.projects, backendProjects)) {
    markMigrationComplete(storage);
    return { projects: backendProjects, notice: null };
  }

  if (backendProjects.length > 0) {
    return {
      projects: backendProjects,
      notice:
        'SQLite already contains projects. Existing browser projects were kept locally and were not overwritten or imported.',
    };
  }

  try {
    const migration = await api.importProjects(legacy.projects);
    markMigrationComplete(storage);
    return {
      projects: migration.projects,
      notice:
        migration.status === 'imported'
          ? 'Browser projects were copied safely into SQLite.'
          : null,
    };
  } catch (error) {
    throw new ProjectMigrationError(
      `${error.message} Browser projects remain untouched and migration is safe to retry.`,
    );
  }
}

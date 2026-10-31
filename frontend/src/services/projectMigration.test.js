import { describe, expect, it, vi } from 'vitest';
import { loadProjectsWithMigration, ProjectMigrationError } from './projectMigration';
import { PROJECTS_MIGRATION_KEY, PROJECTS_STORAGE_KEY } from './projectStorage';

const legacyProject = {
  id: 'legacy-1',
  title: 'Browser draft',
  content: 'Keep this',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
};

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    value: (key) => values.get(key) ?? null,
  };
}

function migrationApi(overrides = {}) {
  return {
    listProjects: vi.fn().mockResolvedValue([]),
    importProjects: vi.fn().mockResolvedValue({
      status: 'imported',
      projects: [legacyProject],
    }),
    ...overrides,
  };
}

describe('legacy project migration', () => {
  it('imports browser projects and writes the marker only after success', async () => {
    const storage = memoryStorage({
      [PROJECTS_STORAGE_KEY]: JSON.stringify([legacyProject]),
    });
    const api = migrationApi();

    const result = await loadProjectsWithMigration({ api, storage });

    expect(api.importProjects).toHaveBeenCalledWith([legacyProject]);
    expect(result.projects).toEqual([legacyProject]);
    expect(storage.value(PROJECTS_MIGRATION_KEY)).toBe('complete');
    expect(storage.value(PROJECTS_STORAGE_KEY)).toBe(JSON.stringify([legacyProject]));
  });

  it('preserves local data and remains retryable after a failed import', async () => {
    const serialized = JSON.stringify([legacyProject]);
    const storage = memoryStorage({ [PROJECTS_STORAGE_KEY]: serialized });
    const api = migrationApi({
      importProjects: vi
        .fn()
        .mockRejectedValueOnce(new Error('Import interrupted.'))
        .mockResolvedValueOnce({ status: 'already_imported', projects: [legacyProject] }),
    });

    await expect(loadProjectsWithMigration({ api, storage })).rejects.toBeInstanceOf(
      ProjectMigrationError,
    );
    expect(storage.value(PROJECTS_MIGRATION_KEY)).toBeNull();
    expect(storage.value(PROJECTS_STORAGE_KEY)).toBe(serialized);

    await expect(loadProjectsWithMigration({ api, storage })).resolves.toMatchObject({
      projects: [legacyProject],
    });
    expect(api.importProjects).toHaveBeenCalledTimes(2);
  });

  it('does not repeat migration after the marker is present', async () => {
    const storage = memoryStorage({
      [PROJECTS_STORAGE_KEY]: JSON.stringify([legacyProject]),
      [PROJECTS_MIGRATION_KEY]: 'complete',
    });
    const api = migrationApi({ listProjects: vi.fn().mockResolvedValue([legacyProject]) });

    await loadProjectsWithMigration({ api, storage });

    expect(api.importProjects).not.toHaveBeenCalled();
  });

  it('does not overwrite a non-empty database with different browser projects', async () => {
    const sqliteProject = { ...legacyProject, id: 'sqlite-1', title: 'SQLite project' };
    const storage = memoryStorage({
      [PROJECTS_STORAGE_KEY]: JSON.stringify([legacyProject]),
    });
    const api = migrationApi({ listProjects: vi.fn().mockResolvedValue([sqliteProject]) });

    const result = await loadProjectsWithMigration({ api, storage });

    expect(result.projects).toEqual([sqliteProject]);
    expect(result.notice).toContain('kept locally');
    expect(api.importProjects).not.toHaveBeenCalled();
    expect(storage.value(PROJECTS_MIGRATION_KEY)).toBeNull();
  });

  it('rejects malformed browser data without deleting it', async () => {
    const storage = memoryStorage({ [PROJECTS_STORAGE_KEY]: '{broken json' });

    await expect(
      loadProjectsWithMigration({ api: migrationApi(), storage }),
    ).rejects.toThrow('remain untouched');
    expect(storage.value(PROJECTS_STORAGE_KEY)).toBe('{broken json');
  });

  it('loads the SQLite library on refresh without importing again', async () => {
    const storage = memoryStorage({ [PROJECTS_MIGRATION_KEY]: 'complete' });
    const api = migrationApi({ listProjects: vi.fn().mockResolvedValue([legacyProject]) });

    const firstRefresh = await loadProjectsWithMigration({ api, storage });
    const secondRefresh = await loadProjectsWithMigration({ api, storage });

    expect(firstRefresh.projects).toEqual([legacyProject]);
    expect(secondRefresh.projects).toEqual([legacyProject]);
    expect(api.listProjects).toHaveBeenCalledTimes(2);
    expect(api.importProjects).not.toHaveBeenCalled();
  });
});

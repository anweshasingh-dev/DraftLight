import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProjects } from './useProjects';

const project = {
  id: 'project-1',
  title: 'A draft',
  content: 'Opening line',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function mockApi(overrides = {}) {
  return {
    getProject: vi.fn().mockResolvedValue(project),
    createProject: vi.fn().mockResolvedValue(project),
    updateProject: vi.fn().mockResolvedValue(project),
    deleteProject: vi.fn().mockResolvedValue(project.id),
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useProjects', () => {
  it('exposes a loading state until the API library resolves', async () => {
    const loading = deferred();
    const api = mockApi();
    const loadProjectLibrary = vi.fn(() => loading.promise);
    const { result } = renderHook(() =>
      useProjects({ api, loadProjectLibrary }),
    );

    expect(result.current.loadStatus).toBe('loading');

    await act(async () => {
      loading.resolve({ projects: [project], notice: null });
      await loading.promise;
    });

    expect(result.current.loadStatus).toBe('ready');
    expect(result.current.projects).toEqual([project]);
  });

  it('creates, updates, and deletes projects through the API', async () => {
    const created = { ...project, id: 'created-project', title: 'Untitled Draft', content: '' };
    const updated = { ...created, content: 'New content', updated_at: '2026-10-03T10:00:00Z' };
    const api = mockApi({
      createProject: vi.fn().mockResolvedValue(created),
      updateProject: vi.fn().mockResolvedValue(updated),
      deleteProject: vi.fn().mockResolvedValue(created.id),
    });
    const loadProjectLibrary = vi.fn().mockResolvedValue({ projects: [], notice: null });
    const { result } = renderHook(() =>
      useProjects({ api, loadProjectLibrary, saveDelay: 0 }),
    );
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    await act(async () => {
      await result.current.createProject();
    });
    expect(result.current.projects).toEqual([created]);

    act(() => result.current.updateProject(created.id, { content: 'New content' }));
    await waitFor(() => expect(api.updateProject).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.projects).toEqual([updated]));

    await act(async () => {
      await result.current.deleteProject(created.id);
    });
    expect(api.deleteProject).toHaveBeenCalledWith(created.id);
    expect(result.current.projects).toEqual([]);
  });

  it('reports loading failures and allows retry', async () => {
    const api = mockApi();
    const loadProjectLibrary = vi
      .fn()
      .mockRejectedValueOnce(new Error('Backend unavailable.'))
      .mockResolvedValueOnce({ projects: [project], notice: null });
    const { result } = renderHook(() =>
      useProjects({ api, loadProjectLibrary }),
    );

    await waitFor(() => expect(result.current.loadStatus).toBe('error'));
    expect(result.current.statusMessage).toContain('Backend unavailable');

    await act(async () => {
      await result.current.reloadProjects();
    });
    expect(result.current.loadStatus).toBe('ready');
    expect(result.current.projects).toEqual([project]);
  });

  it('keeps optimistic edits in memory when saving fails', async () => {
    const api = mockApi({ updateProject: vi.fn().mockRejectedValue(new Error('Save failed.')) });
    const loadProjectLibrary = vi.fn().mockResolvedValue({ projects: [project], notice: null });
    const { result } = renderHook(() =>
      useProjects({ api, loadProjectLibrary, saveDelay: 0 }),
    );
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    act(() => result.current.updateProject(project.id, { content: 'Unsaved but safe' }));

    await waitFor(() => expect(api.updateProject).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.statusMessage).toContain('Unsaved edits remain'));
    expect(result.current.projects[0].content).toBe('Unsaved but safe');
  });

  it('coalesces edits made during a save and persists the newest snapshot', async () => {
    const firstSave = deferred();
    const latestProject = {
      ...project,
      content: 'Newest content',
      updated_at: '2026-10-03T10:00:00Z',
    };
    const api = mockApi({
      updateProject: vi
        .fn()
        .mockImplementationOnce(() => firstSave.promise)
        .mockResolvedValueOnce(latestProject),
    });
    const loadProjectLibrary = vi.fn().mockResolvedValue({ projects: [project], notice: null });
    const { result } = renderHook(() =>
      useProjects({ api, loadProjectLibrary, saveDelay: 0 }),
    );
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    act(() => result.current.updateProject(project.id, { content: 'First content' }));
    await waitFor(() => expect(api.updateProject).toHaveBeenCalledTimes(1));
    act(() => result.current.updateProject(project.id, { content: 'Newest content' }));
    firstSave.resolve({ ...project, content: 'First content' });

    await waitFor(() => expect(api.updateProject).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.projects[0]).toEqual(latestProject));
    expect(api.updateProject.mock.calls[1][1].content).toBe('Newest content');
  });

  it('does not pretend failed creates or deletes succeeded', async () => {
    const api = mockApi({
      createProject: vi.fn().mockRejectedValue(new Error('Create failed.')),
      deleteProject: vi.fn().mockRejectedValue(new Error('Delete failed.')),
    });
    const loadProjectLibrary = vi.fn().mockResolvedValue({ projects: [project], notice: null });
    const { result } = renderHook(() => useProjects({ api, loadProjectLibrary }));
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    await act(async () => {
      await expect(result.current.createProject()).resolves.toBeNull();
    });
    expect(result.current.projects).toEqual([project]);
    expect(result.current.statusMessage).toContain('Create failed');

    await act(async () => {
      await expect(result.current.deleteProject(project.id)).resolves.toBe(false);
    });
    expect(result.current.projects).toEqual([project]);
    expect(result.current.statusMessage).toContain('Delete failed');
  });

  it('prevents duplicate create submissions while one is in flight', async () => {
    const creation = deferred();
    const api = mockApi({ createProject: vi.fn(() => creation.promise) });
    const loadProjectLibrary = vi.fn().mockResolvedValue({ projects: [], notice: null });
    const { result } = renderHook(() => useProjects({ api, loadProjectLibrary }));
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    let firstRequest;
    await act(async () => {
      firstRequest = result.current.createProject();
      await expect(result.current.createProject()).resolves.toBeNull();
      creation.resolve(project);
      await firstRequest;
    });

    expect(api.createProject).toHaveBeenCalledTimes(1);
  });
});

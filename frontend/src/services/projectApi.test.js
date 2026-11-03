import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ProjectApiError,
  analyzeProject,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from './projectApi';

const project = {
  id: 'project-1',
  title: 'A draft',
  content: 'Opening line',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
};

const analysis = {
  where_you_left_off: 'The plan has a goal and a partial checklist.',
  unfinished: ['The launch date is undecided.'],
  next_steps: [
    { title: 'Choose a date', description: 'Resolve the timing.', action: 'List two dates.' },
    { title: 'Assign review', description: 'Name an owner.', action: 'Choose one reviewer.' },
    { title: 'Finish the list', description: 'Add missing tasks.', action: 'Write three tasks.' },
  ],
};

function response(data, { ok = true, status = 200 } = {}) {
  return { ok, status, json: vi.fn().mockResolvedValue(data) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('project API service', () => {
  it('loads and validates projects with a relative API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({ success: true, data: { projects: [project] } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(listProjects()).resolves.toEqual([project]);
    expect(fetchMock).toHaveBeenCalledWith('/api/projects', {});
  });

  it('supports individual fetch, create, update, and delete operations', async () => {
    const updated = { ...project, title: 'Renamed' };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, data: { project } }))
      .mockResolvedValueOnce(response({ success: true, data: { project } }, { status: 201 }))
      .mockResolvedValueOnce(response({ success: true, data: { project: updated } }))
      .mockResolvedValueOnce(response({ success: true, data: { id: project.id } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getProject(project.id)).resolves.toEqual(project);
    await expect(createProject({ title: project.title, content: project.content })).resolves.toEqual(
      project,
    );
    await expect(updateProject(project.id, { title: 'Renamed' })).resolves.toEqual(updated);
    await expect(deleteProject(project.id)).resolves.toBe(project.id);

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/projects/project-1',
      '/api/projects',
      '/api/projects/project-1',
      '/api/projects/project-1',
    ]);
    expect(fetchMock.mock.calls.map(([, options]) => options?.method)).toEqual([
      undefined,
      'POST',
      'PUT',
      'DELETE',
    ]);
  });

  it('returns understandable network and server errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));
    await expect(listProjects()).rejects.toThrow('Make sure Flask is running');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(
          { success: false, error: 'sqlite internals that should stay private' },
          { ok: false, status: 500 },
        ),
      ),
    );
    await expect(listProjects()).rejects.toThrow('Your work remains in this session');
  });

  it('rejects an invalid successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response({ success: true, data: { projects: [{}] } })),
    );

    await expect(listProjects()).rejects.toBeInstanceOf(ProjectApiError);
  });

  it('requests and validates a project analysis', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({ success: true, data: { analysis } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await expect(analyzeProject(project.id, { signal: controller.signal })).resolves.toEqual(
      analysis,
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/project-1/analyze', {
      method: 'POST',
      signal: controller.signal,
    });
  });

  it('keeps safe local-analysis errors and rejects malformed analyses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        response(
          { success: false, error: 'Draftlight could not reach Ollama. Start Ollama locally.' },
          { ok: false, status: 503 },
        ),
      ).mockResolvedValueOnce(
        response({ success: true, data: { analysis: { next_steps: [] } } }),
      ),
    );

    await expect(analyzeProject(project.id)).rejects.toThrow('could not reach Ollama');
    await expect(analyzeProject(project.id)).rejects.toThrow('invalid analysis');
  });
});

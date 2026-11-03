import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useProjects } from './hooks/useProjects';


vi.mock('./hooks/useProjects', () => ({
  useProjects: vi.fn(),
}));

const project = {
  id: 'project-1',
  title: 'Launch plan',
  content: 'A working project draft.',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
};

function renderApp(overrides = {}) {
  const actions = {
    reloadProjects: vi.fn(),
    createProject: vi.fn().mockResolvedValue('created-project'),
    openProject: vi.fn().mockResolvedValue(project),
    updateProject: vi.fn(),
    deleteProject: vi.fn().mockResolvedValue(true),
  };

  useProjects.mockReturnValue({
    projects: [project],
    loadStatus: 'ready',
    statusMessage: 'Saved in SQLite',
    isCreating: false,
    isDeleting: false,
    ...actions,
    ...overrides,
  });

  render(<App />);
  return actions;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('App project interactions', () => {
  it('renders one editor and one companion for the selected project', async () => {
    renderApp();

    expect(await screen.findByLabelText('Writing editor')).not.toBeNull();
    expect(screen.getAllByLabelText('Writing editor')).toHaveLength(1);
    expect(screen.getAllByLabelText('Local AI continuation companion')).toHaveLength(1);
  });

  it('creates a project from the library action', async () => {
    const actions = renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'New project' }));

    await waitFor(() => expect(actions.createProject).toHaveBeenCalledTimes(1));
  });

  it('sends title and content edits to the selected project', async () => {
    const actions = renderApp();
    const title = await screen.findByLabelText('Project title');
    const content = screen.getByLabelText('Project content');

    fireEvent.change(title, { target: { value: 'Renamed plan' } });
    fireEvent.change(content, { target: { value: 'Updated project context' } });

    expect(actions.updateProject).toHaveBeenNthCalledWith(1, project.id, {
      title: 'Renamed plan',
    });
    expect(actions.updateProject).toHaveBeenNthCalledWith(2, project.id, {
      content: 'Updated project context',
    });
  });

  it('opens confirmation and deletes the selected project', async () => {
    const actions = renderApp();
    await screen.findByLabelText('Project title');

    fireEvent.click(
      screen.getByRole('button', { name: `Project actions for ${project.title}` }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(screen.getByRole('alertdialog')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => expect(actions.deleteProject).toHaveBeenCalledWith(project.id));
  });
});

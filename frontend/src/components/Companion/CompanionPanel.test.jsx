import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CompanionPanel from './CompanionPanel';


const project = {
  id: 'project-1',
  title: 'Launch plan',
  content: 'Goal: launch the project. The checklist is still partial.',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
};

const analysis = {
  where_you_left_off: 'The launch goal is clear and the checklist has started.',
  unfinished: ['The remaining launch tasks have not been listed.'],
  next_steps: [
    {
      title: 'Complete the checklist',
      description: 'Turn the partial list into a usable sequence.',
      action: 'Write the next three launch tasks.',
    },
    {
      title: 'Choose an owner',
      description: 'Clarify who will review the launch.',
      action: 'Name one reviewer.',
    },
    {
      title: 'Set a date',
      description: 'Resolve the open timing decision.',
      action: 'List two possible dates.',
    },
  ],
};

afterEach(cleanup);

describe('CompanionPanel', () => {
  it('displays a validated analysis without changing project content', async () => {
    const analyzeProject = vi.fn().mockResolvedValue(analysis);
    const originalContent = project.content;
    render(<CompanionPanel project={project} analyzeProject={analyzeProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Analyze my project' }));

    await screen.findByRole('heading', { name: 'Where you left off' });
    expect(screen.getByText(analysis.where_you_left_off)).not.toBeNull();
    expect(screen.getByRole('heading', { name: "What's unfinished" })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'What you could do next' })).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(analyzeProject).toHaveBeenCalledWith(project.id, { signal: expect.any(Object) });
    expect(project.content).toBe(originalContent);
  });

  it('shows an understandable request failure and allows retry', async () => {
    const analyzeProject = vi
      .fn()
      .mockRejectedValueOnce(new Error('Draftlight could not reach Ollama. Start Ollama locally.'))
      .mockResolvedValueOnce(analysis);
    render(<CompanionPanel project={project} analyzeProject={analyzeProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Analyze my project' }));

    expect((await screen.findByRole('alert')).textContent).toContain('could not reach Ollama');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(analyzeProject).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(analysis.where_you_left_off)).not.toBeNull();
  });

  it('offers cancellation while local inference is running', () => {
    const analyzeProject = vi.fn((_projectId, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
    );
    render(<CompanionPanel project={project} analyzeProject={analyzeProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Analyze my project' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Analyze my project' })).not.toBeNull();
  });

  it('waits for the latest project edits to be saved before analysis', () => {
    const analyzeProject = vi.fn();
    render(
      <CompanionPanel
        project={project}
        isProjectSaved={false}
        analyzeProject={analyzeProject}
      />,
    );

    const button = screen.getByRole('button', { name: 'Analyze my project' });
    expect(button.disabled).toBe(true);
    expect(screen.getByText(/latest edits to finish saving/i)).not.toBeNull();
    fireEvent.click(button);
    expect(analyzeProject).not.toHaveBeenCalled();
  });
});

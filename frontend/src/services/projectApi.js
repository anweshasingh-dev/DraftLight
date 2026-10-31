const PROJECTS_PATH = '/api/projects';

export class ProjectApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ProjectApiError';
    this.status = status;
  }
}

export function isProject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    typeof value.created_at === 'string' &&
    Number.isFinite(Date.parse(value.created_at)) &&
    typeof value.updated_at === 'string' &&
    Number.isFinite(Date.parse(value.updated_at))
  );
}

function readableError(status, payload) {
  if (status >= 500) {
    return 'Draftlight could not complete that request. Your work remains in this session.';
  }

  if (typeof payload?.error === 'string' && payload.error) return payload.error;
  if (status === 404) return 'That project no longer exists.';
  return 'Draftlight could not complete that request.';
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new ProjectApiError(
      'Draftlight could not reach the local backend. Make sure Flask is running.',
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ProjectApiError('The backend returned an unreadable response.', response.status);
  }

  if (!response.ok || payload?.success !== true) {
    throw new ProjectApiError(readableError(response.status, payload), response.status);
  }

  if (payload.data === null || typeof payload.data !== 'object') {
    throw new ProjectApiError('The backend returned an invalid response.', response.status);
  }

  return payload.data;
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function requireProject(project) {
  if (!isProject(project)) {
    throw new ProjectApiError('The backend returned an invalid project.');
  }
  return project;
}

function requireProjects(projects) {
  if (!Array.isArray(projects) || !projects.every(isProject)) {
    throw new ProjectApiError('The backend returned an invalid project library.');
  }
  return projects;
}

export async function listProjects() {
  const data = await request(PROJECTS_PATH);
  return requireProjects(data.projects);
}

export async function getProject(projectId) {
  const data = await request(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}`);
  return requireProject(data.project);
}

export async function createProject(fields = {}) {
  const data = await request(PROJECTS_PATH, jsonOptions('POST', fields));
  return requireProject(data.project);
}

export async function updateProject(projectId, changes) {
  const data = await request(
    `${PROJECTS_PATH}/${encodeURIComponent(projectId)}`,
    jsonOptions('PUT', changes),
  );
  return requireProject(data.project);
}

export async function deleteProject(projectId) {
  const data = await request(`${PROJECTS_PATH}/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
  if (data.id !== projectId) {
    throw new ProjectApiError('The backend returned an invalid deletion response.');
  }
  return data.id;
}

export async function importProjects(projects) {
  const data = await request(
    `${PROJECTS_PATH}/import`,
    jsonOptions('POST', { projects }),
  );
  const migration = data.migration;
  if (
    migration === null ||
    typeof migration !== 'object' ||
    !['imported', 'already_imported'].includes(migration.status)
  ) {
    throw new ProjectApiError('The backend returned an invalid migration response.');
  }
  return {
    status: migration.status,
    projects: requireProjects(migration.projects),
  };
}

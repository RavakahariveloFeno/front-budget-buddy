import { buildAuthHeaders, getRequiredUserId } from './authApi';

const GANTT_API_URL = `${import.meta.env.VITE_API_URL}/gantt`;

export interface GanttProject {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  startDate: string;
  endDate?: string | null;
  progress: number;
  userId: string;
  activityId: string;
}

export interface GanttTask {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  startDate: string;
  endDate: string;
  progress: number;
  type: 'task' | 'milestone' | 'project';
  dependencies: string[];
  userId: string;
  activityId: string;
}

export async function getGanttProjects(activityId?: string): Promise<GanttProject[]> {
  const userId = getRequiredUserId();
  const url = new URL(`${GANTT_API_URL}/projects`);
  url.searchParams.set('userId', userId);
  if (activityId) url.searchParams.set('activityId', activityId);
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttProject[];
}

export async function createGanttProject(payload: Omit<GanttProject, 'id'>): Promise<GanttProject> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/projects`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...payload, userId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttProject;
}

export async function updateGanttProject(id: string, payload: Partial<GanttProject>): Promise<GanttProject> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...payload, userId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttProject;
}

export async function deleteGanttProject(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/projects/${id}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export async function getGanttTasks(activityId?: string, projectId?: string): Promise<GanttTask[]> {
  const userId = getRequiredUserId();
  const url = new URL(`${GANTT_API_URL}/tasks`);
  url.searchParams.set('userId', userId);
  if (activityId) url.searchParams.set('activityId', activityId);
  if (projectId) url.searchParams.set('projectId', projectId);
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttTask[];
}

export async function createGanttTask(payload: Omit<GanttTask, 'id'>): Promise<GanttTask> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/tasks`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...payload, userId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttTask;
}

export async function updateGanttTask(id: string, payload: Partial<GanttTask>): Promise<GanttTask> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...payload, userId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttTask;
}

export async function deleteGanttTask(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/tasks/${id}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

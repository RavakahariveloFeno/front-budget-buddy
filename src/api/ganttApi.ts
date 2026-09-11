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

export interface GanttKanbanCard {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  color?: string | null;
  position: number;
  userId: string;
  activityId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GanttKanbanColumn {
  id: string;
  name: string;
  color?: string;
  order?: number;
}

export interface GanttKanbanBoard {
  id?: string | null;
  columns: GanttKanbanColumn[];
  enabledColumnIds: string[];
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

export async function getKanbanBoard(activityId: string): Promise<GanttKanbanBoard> {
  const userId = getRequiredUserId();
  const url = new URL(`${GANTT_API_URL}/kanban/board`);
  url.searchParams.set('userId', userId);
  url.searchParams.set('activityId', activityId);
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as GanttKanbanBoard;
  return {
    id: data?.id ?? null,
    columns: Array.isArray(data?.columns) && data.columns.length > 0 ? data.columns : defaultKanbanColumns(),
    enabledColumnIds: Array.isArray(data?.enabledColumnIds) && data.enabledColumnIds.length > 0 ? data.enabledColumnIds : defaultKanbanColumns().map((column) => column.id),
  };
}

export function defaultKanbanColumns(): GanttKanbanColumn[] {
  return [
    { id: 'todo', name: 'À faire', color: '#94a3b8', order: 0 },
    { id: 'doing', name: 'En cours', color: '#f59e0b', order: 1 },
    { id: 'done', name: 'Terminé', color: '#22c55e', order: 2 },
  ];
}

export async function saveKanbanBoard(activityId: string, board: GanttKanbanBoard): Promise<GanttKanbanBoard> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/kanban/board`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...board, userId, activityId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttKanbanBoard;
}

export async function getKanbanCards(activityId?: string): Promise<GanttKanbanCard[]> {
  const userId = getRequiredUserId();
  const url = new URL(`${GANTT_API_URL}/kanban/cards`);
  url.searchParams.set('userId', userId);
  if (activityId) url.searchParams.set('activityId', activityId);
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttKanbanCard[];
}

export async function createKanbanCard(payload: Omit<GanttKanbanCard, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<GanttKanbanCard> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/kanban/cards`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...payload, userId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttKanbanCard;
}

export async function updateKanbanCard(id: string, payload: Partial<GanttKanbanCard>): Promise<GanttKanbanCard> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/kanban/cards/${id}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ ...payload, userId }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as GanttKanbanCard;
}

export async function deleteKanbanCard(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${GANTT_API_URL}/kanban/cards/${id}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

import type { Activity, ActivityType } from "@/data/staticData";

const ACTIVITY_API_URL = "http://localhost:3001/activity";
export const TEMP_ACTIVITY_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface ActivityPayload {
  name: string;
  type: ActivityType;
  description?: string;
  startDate: string;
}

function isValidActivityType(type: unknown): type is ActivityType {
  return type === "SALARY" || type === "BUSINESS" || type === "FREELANCE" || type === "OTHER";
}

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
}

function mapActivity(item: unknown): Activity | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  if (!isValidActivityType(record.type)) {
    return null;
  }

  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    type: record.type,
    startDate: String(record.startDate ?? ""),
    userId: String(record.userId ?? ""),
    ...(record.description ? { description: String(record.description) } : {}),
  };
}

export async function getActivities(): Promise<Activity[]> {
  const response = await fetch(ACTIVITY_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): Activity | null => mapActivity(item))
    .filter((item): item is Activity => Boolean(item && item.id && item.name && item.startDate && item.userId));
}

export async function createActivity(payload: ActivityPayload): Promise<Activity> {
  const response = await fetch(ACTIVITY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      type: payload.type,
      description: payload.description || undefined,
      startDate: toIsoDate(payload.startDate),
      userId: TEMP_ACTIVITY_USER_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const activity = mapActivity(data);
  if (!activity) {
    throw new Error("Invalid activity response");
  }

  return activity;
}

export async function updateActivity(id: string, payload: ActivityPayload): Promise<Activity> {
  const body = JSON.stringify({
    name: payload.name,
    type: payload.type,
    description: payload.description || undefined,
    startDate: toIsoDate(payload.startDate),
    userId: TEMP_ACTIVITY_USER_ID,
  });
  let response = await fetch(`${ACTIVITY_API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${ACTIVITY_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const activity = mapActivity(data);
  if (!activity) {
    throw new Error("Invalid activity response");
  }

  return activity;
}

export async function deleteActivity(id: string): Promise<void> {
  const response = await fetch(`${ACTIVITY_API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

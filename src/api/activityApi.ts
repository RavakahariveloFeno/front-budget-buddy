import type { Activity, ActivityType } from "@/data/staticData";

const ACTIVITY_API_URL = "http://localhost:3001/activity";
const STATISTICS_API_URL = "http://localhost:3001/statistics";
export const TEMP_ACTIVITY_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface ActivityPayload {
  name: string;
  type: ActivityType;
  description?: string;
  startDate: string;
}

export interface ActivityStats {
  activityId: string;
  income: number;
  expense: number;
  sentInvestment: number;
  receivedInvestment: number;
  remainingLoan: number;
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

function mapActivityStats(item: unknown): ActivityStats | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const activityId = String(record.activityId ?? "");
  const income = Number(record.income ?? 0);
  const expense = Number(record.expense ?? 0);
  const sentInvestment = Number(record.sentInvestment ?? 0);
  const receivedInvestment = Number(record.receivedInvestment ?? 0);
  const remainingLoan = Number(record.remainingLoan ?? 0);

  if (!activityId) {
    return null;
  }

  return {
    activityId,
    income: Number.isFinite(income) ? income : 0,
    expense: Number.isFinite(expense) ? expense : 0,
    sentInvestment: Number.isFinite(sentInvestment) ? sentInvestment : 0,
    receivedInvestment: Number.isFinite(receivedInvestment) ? receivedInvestment : 0,
    remainingLoan: Number.isFinite(remainingLoan) ? remainingLoan : 0,
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

export async function getActivityStatsByUser(userId: string = TEMP_ACTIVITY_USER_ID): Promise<ActivityStats[]> {
  const response = await fetch(`${STATISTICS_API_URL}/activity/user/${userId}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): ActivityStats | null => mapActivityStats(item))
    .filter((item): item is ActivityStats => Boolean(item));
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

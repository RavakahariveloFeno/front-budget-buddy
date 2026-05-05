import { buildAuthHeaders } from "./authApi";

const NOTIFICATION_API_URL = `${import.meta.env.VITE_API_URL}/notifications`;

export interface NotificationState {
  readIds: string[];
  seenMap: Record<string, number>;
}

export interface CalendarNotificationPayload {
  title: string;
  note?: string;
  date?: string;
  mode?: "REMINDER" | "EVENT";
  reminderMinutes?: number;
  email?: string;
  discordWebhook?: string;
}

export interface CalendarNotificationResult {
  success: boolean;
  emailSent: boolean;
  webhookSent: boolean;
}

function mapState(data: unknown): NotificationState {
  if (!data || typeof data !== "object") {
    return { readIds: [], seenMap: {} };
  }

  const record = data as Record<string, unknown>;
  const readIds = Array.isArray(record.readIds)
    ? Array.from(new Set(record.readIds.filter((item): item is string => typeof item === "string" && item.length > 0)))
    : [];

  const seenMapInput = record.seenMap;
  const seenMap =
    seenMapInput && typeof seenMapInput === "object" && !Array.isArray(seenMapInput)
      ? Object.fromEntries(
          Object.entries(seenMapInput as Record<string, unknown>).filter(
            (entry): entry is [string, number] => typeof entry[0] === "string" && Number.isFinite(entry[1]),
          ),
        )
      : {};

  return { readIds, seenMap };
}

export async function getNotificationState(): Promise<NotificationState> {
  const response = await fetch(`${NOTIFICATION_API_URL}/state`, {
    headers: { ...buildAuthHeaders(), "x-bb-silent-loading": "1" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  return mapState(data);
}

export async function updateNotificationState(payload: NotificationState): Promise<NotificationState> {
  const response = await fetch(`${NOTIFICATION_API_URL}/state`, {
    method: "PUT",
    headers: { ...buildAuthHeaders(true), "x-bb-silent-loading": "1" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  return mapState(data);
}

export async function sendCalendarNotification(
  payload: CalendarNotificationPayload,
): Promise<CalendarNotificationResult> {
  const response = await fetch(`${NOTIFICATION_API_URL}/calendar`, {
    method: "POST",
    headers: { ...buildAuthHeaders(true), "x-bb-silent-loading": "1" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== "object") {
    return { success: false, emailSent: false, webhookSent: false };
  }

  const record = data as Record<string, unknown>;
  return {
    success: Boolean(record.success),
    emailSent: Boolean(record.emailSent),
    webhookSent: Boolean(record.webhookSent),
  };
}

import { buildAuthHeaders, getRequiredUserId } from "./authApi";
import type { CalendarEvent, EventRecurrence } from "@/stores/calendarStore";

const CALENDAR_API_URL = `${import.meta.env.VITE_API_URL}/calendar`;

export type CalendarEventCreatePayload = Omit<
  CalendarEvent,
  "id" | "notified" | "triggered" | "reminderSentAt" | "seriesId"
> & {
  id?: never;
  notified?: boolean;
  triggered?: boolean;
  reminderSentAt?: string;
  seriesId?: never;
  recurrence?: EventRecurrence;
};

export type CalendarEventUpdatePayload = Partial<
  Omit<CalendarEvent, "id" | "activityId">
>;

export async function getCalendarEvents(activityId?: string): Promise<CalendarEvent[]> {
  const userId = getRequiredUserId();
  const qs = new URLSearchParams({ userId });
  if (activityId) {
    qs.set("activityId", activityId);
  }
  const response = await fetch(`${CALENDAR_API_URL}/events?${qs.toString()}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data: unknown = await response.json();
  return Array.isArray(data) ? (data as CalendarEvent[]) : [];
}

export async function createCalendarEvent(payload: CalendarEventCreatePayload): Promise<CalendarEvent[]> {
  const userId = getRequiredUserId();
  const response = await fetch(`${CALENDAR_API_URL}/events`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ userId, ...payload }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = (await response.json()) as CalendarEvent | CalendarEvent[];
  return Array.isArray(data) ? data : [data];
}

export async function updateCalendarEvent(id: string, patch: CalendarEventUpdatePayload): Promise<CalendarEvent> {
  const userId = getRequiredUserId();
  const response = await fetch(`${CALENDAR_API_URL}/events/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ userId, ...patch }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as CalendarEvent;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const qs = new URLSearchParams({ userId });
  const response = await fetch(`${CALENDAR_API_URL}/events/${id}?${qs.toString()}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}


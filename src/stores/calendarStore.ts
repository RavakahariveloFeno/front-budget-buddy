import { create } from "zustand";

export type AutomationType = "NONE" | "INCOME" | "EXPENSE";

export interface CalendarEvent {
  id: string;
  title: string;
  note?: string;
  start: string; // ISO
  end: string; // ISO
  notify: boolean;
  reminderMinutes?: number;
  reminderSentAt?: string;
  notificationTargets?: {
    email?: string;
    discordWebhook?: string;
  };
  notified?: boolean;
  triggered?: boolean;
  activityId: string;
  automation: {
    type: AutomationType;
    amount?: number;
    description?: string;
    categoryId?: string;
  };
}

interface CalendarStore {
  events: CalendarEvent[];
  setAllEvents: (events: CalendarEvent[]) => void;
  setEventsForActivity: (activityId: string, events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  markNotified: (id: string) => void;
  markTriggered: (id: string) => void;
  getEventsByActivity: (activityId: string) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  setAllEvents: (events) => set({ events }),
  setEventsForActivity: (activityId, events) =>
    set((s) => {
      const other = s.events.filter((e) => e.activityId !== activityId);
      return { events: [...other, ...events] };
    }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  updateEvent: (id, patch) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
  markNotified: (id) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, notified: true } : e)) })),
  markTriggered: (id) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, triggered: true } : e)) })),
  getEventsByActivity: (activityId) => get().events.filter((e) => e.activityId === activityId),
}));

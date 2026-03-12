import { create } from "zustand";
import type { ActivityModuleLink } from "@/data/staticData";

interface ModuleStore {
  links: ActivityModuleLink[];
  setLinks: (activityId: string, moduleIds: string[]) => void;
  getModuleIds: (activityId: string) => string[];
  getActivityIds: (moduleId: string) => string[];
  reset: () => void;
}

// Simple in-memory store (static data for now)
export const useModuleStore = create<ModuleStore>((set, get) => ({
  links: [],
  setLinks: (activityId, moduleIds) =>
    set((state) => {
      const otherLinks = state.links.filter((l) => l.activityId !== activityId);
      const newLinks = moduleIds.map((moduleId) => ({ activityId, moduleId }));
      return { links: [...otherLinks, ...newLinks] };
    }),
  getModuleIds: (activityId) =>
    get()
      .links.filter((l) => l.activityId === activityId)
      .map((l) => l.moduleId),
  getActivityIds: (moduleId) =>
    get()
      .links.filter((l) => l.moduleId === moduleId)
      .map((l) => l.activityId),
  reset: () => set({ links: [] }),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

// IDs des modules qui ne sont pas connus du backend et doivent etre persistes localement.
export const LOCAL_ONLY_MODULE_IDS = new Set<string>([]);

interface LocalModuleLinksStore {
  // activityId -> moduleIds (only local-only ones)
  linksByActivity: Record<string, string[]>;
  setLinks: (activityId: string, moduleIds: string[]) => void;
  getLinks: (activityId: string) => string[];
}

export const useLocalModuleLinksStore = create<LocalModuleLinksStore>()(
  persist(
    (set, get) => ({
      linksByActivity: {},
      setLinks: (activityId, moduleIds) => {
        const filtered = moduleIds.filter((id) => LOCAL_ONLY_MODULE_IDS.has(id));
        set((s) => ({ linksByActivity: { ...s.linksByActivity, [activityId]: filtered } }));
      },
      getLinks: (activityId) => get().linksByActivity[activityId] ?? [],
    }),
    { name: "pilgo:local-module-links" },
  ),
);

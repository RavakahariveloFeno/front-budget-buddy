import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ActivityFilterStore {
  selectedActivityId: string | null;
  setSelectedActivityId: (activityId: string | null) => void;
  clearSelectedActivityId: () => void;
}

export const useActivityFilterStore = create<ActivityFilterStore>()(
  persist(
    (set) => ({
      selectedActivityId: null,
      setSelectedActivityId: (activityId) => set({ selectedActivityId: activityId || null }),
      clearSelectedActivityId: () => set({ selectedActivityId: null }),
    }),
    {
      name: "bb:selected-activity",
      partialize: (state) => ({ selectedActivityId: state.selectedActivityId }),
    },
  ),
);


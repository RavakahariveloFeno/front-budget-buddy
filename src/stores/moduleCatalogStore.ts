import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PREDEFINED_MODULES } from "@/data/staticData";

export type ModuleCatalogStatus = "FREE" | "PAID" | "COMING_SOON" | "SOON";

const ALWAYS_AVAILABLE_MODULE_IDS = new Set(["mod-tresorerie"]);

interface ModuleCatalogStore {
  statusByModuleId: Record<string, ModuleCatalogStatus>;
  priceByModuleId: Record<string, string>;
  setModuleStatus: (moduleId: string, status: ModuleCatalogStatus) => void;
  setModulePrice: (moduleId: string, price: string) => void;
  getModuleStatus: (moduleId: string) => ModuleCatalogStatus;
  getModulePrice: (moduleId: string) => string;
}

function buildDefaultStatuses(): Record<string, ModuleCatalogStatus> {
  return PREDEFINED_MODULES.reduce<Record<string, ModuleCatalogStatus>>((acc, module) => {
    acc[module.id] = "FREE";
    return acc;
  }, {});
}

function buildDefaultPrices(): Record<string, string> {
  return PREDEFINED_MODULES.reduce<Record<string, string>>((acc, module) => {
    acc[module.id] = "10$";
    return acc;
  }, {});
}

export function isModuleBlockedByStatus(status: ModuleCatalogStatus): boolean {
  return status === "COMING_SOON" || status === "SOON";
}

export function getModuleStatusLabel(status: ModuleCatalogStatus, price?: string): string {
  switch (status) {
    case "COMING_SOON":
      return "A venir";
    case "SOON":
      return "A bientot";
    case "PAID":
      return (price && price.trim()) || "Payant";
    case "FREE":
    default:
      return "Gratuit";
  }
}

export const useModuleCatalogStore = create<ModuleCatalogStore>()(
  persist(
    (set, get) => ({
      statusByModuleId: buildDefaultStatuses(),
      priceByModuleId: buildDefaultPrices(),
      setModuleStatus: (moduleId, status) =>
        set((state) => ({
          statusByModuleId: {
            ...state.statusByModuleId,
            [moduleId]: ALWAYS_AVAILABLE_MODULE_IDS.has(moduleId) ? "FREE" : status,
          },
        })),
      setModulePrice: (moduleId, price) =>
        set((state) => ({
          priceByModuleId: {
            ...state.priceByModuleId,
            [moduleId]: price.trim() || "10$",
          },
        })),
      getModuleStatus: (moduleId) => ALWAYS_AVAILABLE_MODULE_IDS.has(moduleId) ? "FREE" : get().statusByModuleId[moduleId] ?? "FREE",
      getModulePrice: (moduleId) => get().priceByModuleId[moduleId] ?? "10$",
    }),
    {
      name: "bb:module-catalog-status",
      partialize: (state) => ({
        statusByModuleId: state.statusByModuleId,
        priceByModuleId: state.priceByModuleId,
      }),
    },
  ),
);

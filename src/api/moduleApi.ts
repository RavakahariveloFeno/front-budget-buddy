import { buildAuthHeaders, getRequiredUserId } from "./authApi";
import { LOCAL_ONLY_MODULE_IDS, useLocalModuleLinksStore } from "@/stores/localModuleLinksStore";

const ACTIVITY_API_URL = `${import.meta.env.VITE_API_URL}/activity`;

export type BackendModuleType = "SALE_MANAGEMENT" | "PAYROLL" | "ACCOUNTING" | "CASH_MANAGEMENT";

// Mapping entre les IDs de PREDEFINED_MODULES et les enums backend
const MODULE_ID_TO_TYPE: Record<string, BackendModuleType> = {
  "mod-vente": "SALE_MANAGEMENT",
  "mod-paie": "PAYROLL",
  "mod-comptabilite-generale": "ACCOUNTING",
  "mod-comptabilite-analytique": "ACCOUNTING",
  "mod-comptabilite-fiscale": "ACCOUNTING",
  "mod-comptabilite-client": "ACCOUNTING",
  "mod-comptabilite-fournisseur": "ACCOUNTING",
  "mod-comptabilite-immobilisations": "ACCOUNTING",
  "mod-tresorerie": "CASH_MANAGEMENT",
};

const MODULE_TYPE_TO_IDS: Record<BackendModuleType, string[]> = {
  SALE_MANAGEMENT: ["mod-vente"],
  PAYROLL: ["mod-paie"],
  ACCOUNTING: [
    "mod-comptabilite-generale",
    "mod-comptabilite-analytique",
    "mod-comptabilite-fiscale",
    "mod-comptabilite-client",
    "mod-comptabilite-fournisseur",
    "mod-comptabilite-immobilisations",
  ],
  CASH_MANAGEMENT: ["mod-tresorerie"],
};

export function mapModuleIdsToTypes(ids: string[]): BackendModuleType[] {
  const types: BackendModuleType[] = [];
  for (const id of ids) {
    const t = MODULE_ID_TO_TYPE[id];
    if (t && !types.includes(t)) {
      types.push(t);
    }
  }
  return types;
}

export function mapModuleTypesToIds(types: BackendModuleType[]): string[] {
  const ids: string[] = [];
  for (const t of types) {
    const mappedIds = MODULE_TYPE_TO_IDS[t] ?? [];
    for (const id of mappedIds) {
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
  }
  return ids;
}

export async function getActivityModules(activityId: string): Promise<string[]> {
  const userId = getRequiredUserId();
  const response = await fetch(`${ACTIVITY_API_URL}/${activityId}/modules?userId=${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data: unknown = await response.json();
  const remoteIds = Array.isArray(data)
    ? mapModuleTypesToIds(
        data
          .map((item) => String(item ?? ""))
          .filter((v): v is BackendModuleType =>
            v === "SALE_MANAGEMENT" || v === "PAYROLL" || v === "ACCOUNTING" || v === "CASH_MANAGEMENT",
          ),
      )
    : [];
  const localIds = useLocalModuleLinksStore.getState().getLinks(activityId);
  return [...remoteIds, ...localIds.filter((id) => !remoteIds.includes(id))];
}

export async function setActivityModules(activityId: string, moduleIds: string[]): Promise<void> {
  const userId = getRequiredUserId();
  const remoteIds = moduleIds.filter((id) => !LOCAL_ONLY_MODULE_IDS.has(id));
  const localIds = moduleIds.filter((id) => LOCAL_ONLY_MODULE_IDS.has(id));
  useLocalModuleLinksStore.getState().setLinks(activityId, localIds);
  const modules = mapModuleIdsToTypes(remoteIds);
  const response = await fetch(`${ACTIVITY_API_URL}/${activityId}/modules`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      userId,
      modules,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}



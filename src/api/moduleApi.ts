import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const ACTIVITY_API_URL = `${import.meta.env.VITE_API_URL}/activity`;

export type BackendModuleType = "SALE_MANAGEMENT" | "PAYROLL" | "ACCOUNTING" | "BUDGET_MANAGEMENT" | "CASH_MANAGEMENT";

// Mapping entre les IDs de PREDEFINED_MODULES et les enums backend
const MODULE_ID_TO_TYPE: Record<string, BackendModuleType> = {
  "mod-vente": "SALE_MANAGEMENT",
  "mod-paie": "PAYROLL",
  "mod-comptabilite": "ACCOUNTING",
  "mod-budget": "BUDGET_MANAGEMENT",
  "mod-tresorerie": "CASH_MANAGEMENT",
};

const MODULE_TYPE_TO_ID: Record<BackendModuleType, string> = {
  SALE_MANAGEMENT: "mod-vente",
  PAYROLL: "mod-paie",
  ACCOUNTING: "mod-comptabilite",
  BUDGET_MANAGEMENT: "mod-budget",
  CASH_MANAGEMENT: "mod-tresorerie",
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
    const id = MODULE_TYPE_TO_ID[t];
    if (id && !ids.includes(id)) {
      ids.push(id);
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
  if (!Array.isArray(data)) {
    return [];
  }
  const types = data
    .map((item) => String(item ?? ""))
    .filter((v): v is BackendModuleType =>
      v === "SALE_MANAGEMENT" || v === "PAYROLL" || v === "ACCOUNTING" || v === "BUDGET_MANAGEMENT" || v === "CASH_MANAGEMENT",
    );
  return mapModuleTypesToIds(types);
}

export async function setActivityModules(activityId: string, moduleIds: string[]): Promise<void> {
  const userId = getRequiredUserId();
  const modules = mapModuleIdsToTypes(moduleIds);
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


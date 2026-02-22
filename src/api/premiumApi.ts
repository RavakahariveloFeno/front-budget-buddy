import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const PREMIUM_API_URL = "http://localhost:3001/premium";
const PREMIUM_STORAGE_KEY = "bb_manual_premium";
const PREMIUM_EVENT_NAME = "bb-premium-changed";

function parsePremium(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
}

export function isPremiumEnabled(): boolean {
  return parsePremium(localStorage.getItem(PREMIUM_STORAGE_KEY));
}

export function setPremiumEnabled(enabled: boolean): void {
  localStorage.setItem(PREMIUM_STORAGE_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new CustomEvent(PREMIUM_EVENT_NAME, { detail: { enabled } }));
}

export function subscribePremiumChange(listener: (enabled: boolean) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ enabled?: boolean }>;
    const enabled = typeof customEvent.detail?.enabled === "boolean" ? customEvent.detail.enabled : isPremiumEnabled();
    listener(enabled);
  };

  window.addEventListener(PREMIUM_EVENT_NAME, handler);
  return () => window.removeEventListener(PREMIUM_EVENT_NAME, handler);
}

export interface ActivityPremiumModule {
  id: string;
  module: "SALES_MANAGEMENT";
  isEnabled: boolean;
  activityId: string;
  activity?: {
    id: string;
    name: string;
  };
}

function mapActivityPremiumModule(item: unknown): ActivityPremiumModule | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  if (record.module !== "SALES_MANAGEMENT") {
    return null;
  }

  const activity =
    record.activity && typeof record.activity === "object"
      ? {
          id: String((record.activity as Record<string, unknown>).id ?? ""),
          name: String((record.activity as Record<string, unknown>).name ?? ""),
        }
      : undefined;

  return {
    id: String(record.id ?? ""),
    module: "SALES_MANAGEMENT",
    isEnabled: Boolean(record.isEnabled),
    activityId: String(record.activityId ?? ""),
    ...(activity && activity.id ? { activity } : {}),
  };
}

export async function getActivityPremiumModules(): Promise<ActivityPremiumModule[]> {
  const userId = getRequiredUserId();
  const response = await fetch(`${PREMIUM_API_URL}/modules/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => mapActivityPremiumModule(item))
    .filter((item): item is ActivityPremiumModule => Boolean(item && item.id && item.activityId));
}

export async function setActivitySalesModuleEnabled(activityId: string, enabled: boolean): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${PREMIUM_API_URL}/module/${enabled ? "enable" : "disable"}`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      userId,
      activityId,
      module: "SALES_MANAGEMENT",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

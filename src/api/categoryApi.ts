import type { Category } from "@/data/staticData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const CATEGORY_API_URL = `${import.meta.env.VITE_API_URL}/category`;
const STATISTICS_API_URL = `${import.meta.env.VITE_API_URL}/statistics`;

export interface CategoryPayload {
  name: string;
  icon?: string;
  color?: string;
  activityId: string;
}

export interface CategoryStatItem {
  categoryId: string;
  total: number;
  count: number;
}

export interface CategoryStatistics {
  totalCategories: number;
  totalExpenses: number;
  totalTransactions: number;
  maxCategoryTotal: number;
  items: CategoryStatItem[];
}

function mapCategory(item: unknown): Category | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const activityModule = record.activityModule && typeof record.activityModule === "object"
    ? (record.activityModule as Record<string, unknown>)
    : null;
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    userId: String(record.userId ?? ""),
    ...(record.icon ? { icon: String(record.icon) } : {}),
    ...(record.color ? { color: String(record.color) } : {}),
    ...(record.activityModuleId ? { activityModuleId: String(record.activityModuleId) } : {}),
    ...(activityModule?.activityId ? { activityId: String(activityModule.activityId) } : {}),
  };
}

function mapCategoryStatItem(item: unknown): CategoryStatItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const categoryId = String(record.categoryId ?? "");
  const total = Number(record.total ?? 0);
  const count = Number(record.count ?? 0);

  if (!categoryId) {
    return null;
  }

  return {
    categoryId,
    total: Number.isFinite(total) ? total : 0,
    count: Number.isFinite(count) ? count : 0,
  };
}

function mapCategoryStatistics(item: unknown): CategoryStatistics | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;

  const items = Array.isArray(record.items)
    ? record.items
        .map((entry) => mapCategoryStatItem(entry))
        .filter((entry): entry is CategoryStatItem => Boolean(entry))
    : [];

  return {
    totalCategories: Number(record.totalCategories ?? 0),
    totalExpenses: Number(record.totalExpenses ?? 0),
    totalTransactions: Number(record.totalTransactions ?? 0),
    maxCategoryTotal: Number(record.maxCategoryTotal ?? 0),
    items,
  };
}

export async function getCategories(): Promise<Category[]> {
  const userId = getRequiredUserId();
  const response = await fetch(`${CATEGORY_API_URL}/user/${userId}`, {
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
    .map((item): Category | null => mapCategory(item))
    .filter((item): item is Category => Boolean(item && item.id && item.name && item.userId));
}

export async function getCategoryStatistics(userId: string = getRequiredUserId()): Promise<CategoryStatistics> {
  const response = await fetch(`${STATISTICS_API_URL}/categories/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const statistics = mapCategoryStatistics(data);
  if (!statistics) {
    throw new Error("Invalid category statistics response");
  }

  return statistics;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const userId = getRequiredUserId();
  const response = await fetch(CATEGORY_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name: payload.name,
      icon: payload.icon || undefined,
      color: payload.color || undefined,
      activityId: payload.activityId,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const category = mapCategory(data);
  if (!category) {
    throw new Error("Invalid category response");
  }

  return category;
}

export async function updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
  const userId = getRequiredUserId();
  const body = JSON.stringify({
    name: payload.name,
    icon: payload.icon || undefined,
    color: payload.color || undefined,
    activityId: payload.activityId,
    userId,
  });
  let response = await fetch(`${CATEGORY_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${CATEGORY_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body,
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const category = mapCategory(data);
  if (!category) {
    throw new Error("Invalid category response");
  }

  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${CATEGORY_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

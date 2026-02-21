import type { Category } from "@/data/staticData";

const CATEGORY_API_URL = "http://localhost:3001/category";
export const TEMP_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface CategoryPayload {
  name: string;
  icon?: string;
  color?: string;
}

function mapCategory(item: unknown): Category | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    userId: String(record.userId ?? ""),
    ...(record.icon ? { icon: String(record.icon) } : {}),
    ...(record.color ? { color: String(record.color) } : {}),
  };
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(CATEGORY_API_URL);
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

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const response = await fetch(CATEGORY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      icon: payload.icon || undefined,
      color: payload.color || undefined,
      userId: TEMP_USER_ID,
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
  const body = JSON.stringify({
    name: payload.name,
    icon: payload.icon || undefined,
    color: payload.color || undefined,
    userId: TEMP_USER_ID,
  });
  let response = await fetch(`${CATEGORY_API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${CATEGORY_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
  const response = await fetch(`${CATEGORY_API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

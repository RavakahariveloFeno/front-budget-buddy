import { buildAuthHeaders } from "./authApi";

const SUPERADMIN_API_URL = `${import.meta.env.VITE_API_URL}/superadmin`;

export type SuperAdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isDisabled: boolean;
  disabledAt: string | null;
  isSuperAdmin: boolean;
};

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  const text = await response.text().catch(() => "");
  throw new Error(text.trim() || `HTTP ${response.status}`);
}

function mapUser(item: unknown): SuperAdminUser | null {
  if (!item || typeof item !== "object") {
    return null;
  }
  const record = item as Record<string, unknown>;
  const createdAt = typeof record.createdAt === "string" ? record.createdAt : "";
  if (!createdAt) {
    return null;
  }

  return {
    id: String(record.id ?? ""),
    firstName: String(record.firstName ?? ""),
    lastName: String(record.lastName ?? ""),
    email: String(record.email ?? ""),
    createdAt,
    isDisabled: Boolean(record.isDisabled),
    disabledAt: record.disabledAt ? String(record.disabledAt) : null,
    isSuperAdmin: Boolean(record.isSuperAdmin),
  };
}

export async function getSuperAdminUsers(): Promise<SuperAdminUser[]> {
  const response = await fetch(`${SUPERADMIN_API_URL}/users`, {
    headers: buildAuthHeaders(),
  });
  await assertOk(response);

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapUser).filter((item): item is SuperAdminUser => Boolean(item?.id && item.email));
}

export async function setSuperAdminUserDisabled(userId: string, isDisabled: boolean): Promise<SuperAdminUser> {
  const response = await fetch(`${SUPERADMIN_API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ isDisabled }),
  });
  await assertOk(response);

  const data: unknown = await response.json();
  const mapped = mapUser(data);
  if (!mapped) {
    throw new Error("Invalid response");
  }
  return mapped;
}

export async function deleteSuperAdminUser(userId: string): Promise<void> {
  const response = await fetch(`${SUPERADMIN_API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  await assertOk(response);
}


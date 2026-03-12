import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const PROFILE_API_URL = "http://localhost:3001/profile";

export type ProfileRole = "admin" | "manager" | "user";

export interface ManagedProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ProfileRole;
  activities: string[];
  moduleLinks: string[];
  menuAccess: string[];
}

export interface ManagedProfilePayloadBase {
  firstName: string;
  lastName: string;
  email: string;
  role: ProfileRole;
  activities: string[];
  moduleLinks: string[];
  menuAccess: string[];
}

export interface CreateManagedProfilePayload extends ManagedProfilePayloadBase {
  password: string;
}

export interface UpdateManagedProfilePayload extends ManagedProfilePayloadBase {
  password?: string;
}

function mapRole(value: unknown): ProfileRole {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "admin" || normalized === "manager" || normalized === "user") {
    return normalized;
  }
  return "user";
}

function mapManagedProfile(item: unknown): ManagedProfile | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  const firstName = String(record.firstName ?? "");
  const lastName = String(record.lastName ?? "");
  const email = String(record.email ?? "");
  if (!id || !firstName || !lastName || !email) {
    return null;
  }

  const activities = Array.isArray(record.activities) ? record.activities.map((item) => String(item ?? "")).filter(Boolean) : [];
  const moduleLinks = Array.isArray(record.moduleLinks) ? record.moduleLinks.map((item) => String(item ?? "")).filter(Boolean) : [];
  const menuAccess = Array.isArray(record.menuAccess) ? record.menuAccess.map((item) => String(item ?? "")).filter(Boolean) : [];

  return {
    id,
    firstName,
    lastName,
    email,
    role: mapRole(record.role),
    activities,
    moduleLinks,
    menuAccess,
  };
}

export async function getManagedProfiles(): Promise<ManagedProfile[]> {
  const userId = getRequiredUserId();
  const response = await fetch(`${PROFILE_API_URL}/user/${userId}`, {
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
    .map((item): ManagedProfile | null => mapManagedProfile(item))
    .filter((item): item is ManagedProfile => Boolean(item));
}

export async function createManagedProfile(payload: CreateManagedProfilePayload): Promise<ManagedProfile> {
  const userId = getRequiredUserId();
  const response = await fetch(PROFILE_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      userId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      activities: payload.activities,
      moduleLinks: payload.moduleLinks,
      menuAccess: payload.menuAccess,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const profile = mapManagedProfile(data);
  if (!profile) {
    throw new Error("Invalid profile response");
  }
  return profile;
}

export async function updateManagedProfile(id: string, payload: UpdateManagedProfilePayload): Promise<ManagedProfile> {
  const userId = getRequiredUserId();
  const password = payload.password;
  const response = await fetch(`${PROFILE_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      userId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      ...(password ? { password } : {}),
      role: payload.role,
      activities: payload.activities,
      moduleLinks: payload.moduleLinks,
      menuAccess: payload.menuAccess,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const profile = mapManagedProfile(data);
  if (!profile) {
    throw new Error("Invalid profile response");
  }
  return profile;
}

export async function deleteManagedProfile(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${PROFILE_API_URL}/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function getManagedProfile(id: string): Promise<ManagedProfile> {
  const userId = getRequiredUserId();
  const response = await fetch(`${PROFILE_API_URL}/${id}?userId=${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const profile = mapManagedProfile(data);
  if (!profile) {
    throw new Error("Invalid profile response");
  }
  return profile;
}

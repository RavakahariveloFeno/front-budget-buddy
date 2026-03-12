const AUTH_API_URL = "http://localhost:3001/auth";
const TOKEN_STORAGE_KEY = "bb_access_token";
const USER_PROFILE_STORAGE_KEY = "bb_user_profile";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileId?: string;
  role?: string;
}

interface LoginResponse {
  access_token?: string;
}

interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

type JwtPayload = {
  sub?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  exp?: number;
  profileId?: string;
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function saveSessionToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getSessionToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_PROFILE_STORAGE_KEY);
}

function readCachedUserProfile(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.id || !parsed.email || !parsed.firstName || !parsed.lastName) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      ...(parsed.profileId ? { profileId: parsed.profileId } : {}),
      ...(parsed.role ? { role: parsed.role } : {}),
    };
  } catch {
    return null;
  }
}

function writeCachedUserProfile(profile: AuthUser): void {
  sessionStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function getCurrentUser(): AuthUser | null {
  const cachedUser = readCachedUserProfile();
  if (cachedUser) {
    return cachedUser;
  }

  const token = getSessionToken();
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.email || !payload.firstName || !payload.lastName) {
    return null;
  }

  const user: AuthUser = {
    id: payload.sub,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    ...(payload.profileId ? { profileId: payload.profileId } : {}),
    ...(payload.role ? { role: payload.role } : {}),
  };
  writeCachedUserProfile(user);
  return user;
}

export function updateCachedCurrentUserProfile(payload: Pick<AuthUser, "firstName" | "lastName">): void {
  const current = getCurrentUser();
  if (!current) {
    return;
  }

  writeCachedUserProfile({
    ...current,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });
}

export function getCurrentUserId(): string | null {
  return getCurrentUser()?.id ?? null;
}

export function getRequiredUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("Missing authenticated user id");
  }
  return userId;
}

export function buildAuthHeaders(contentType = false): HeadersInit {
  const token = getSessionToken();
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function isSessionAuthenticated(): boolean {
  const token = getSessionToken();
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.sub) {
    return false;
  }

  if (typeof payload.exp === "number") {
    const nowEpoch = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowEpoch) {
      return false;
    }
  }

  return true;
}

export async function signUp(payload: SignupPayload): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function signIn(payload: LoginPayload): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: LoginResponse = await response.json();
  const token = data.access_token;
  if (!token || typeof token !== "string") {
    throw new Error("Missing access token");
  }

  sessionStorage.removeItem(USER_PROFILE_STORAGE_KEY);
  saveSessionToken(token);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/password`, {
    method: "PUT",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

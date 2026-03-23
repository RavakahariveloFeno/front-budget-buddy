const AUTH_API_URL = `${import.meta.env.VITE_API_URL}/auth`;
const TOKEN_STORAGE_KEY = "bb_access_token";
const USER_PROFILE_STORAGE_KEY = "bb_user_profile";
const SUPERADMIN_ACTING_USER_STORAGE_KEY = "bb_superadmin_acting_user_id";

function tryGetLocalStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function tryGetSessionStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function getStoredItem(key: string): string | null {
  const local = tryGetLocalStorage();
  const session = tryGetSessionStorage();

  const fromLocal = local?.getItem(key) ?? null;
  if (fromLocal) {
    return fromLocal;
  }

  const fromSession = session?.getItem(key) ?? null;
  if (fromSession && local) {
    local.setItem(key, fromSession);
    session?.removeItem(key);
  }

  return fromSession;
}

function setStoredItem(key: string, value: string): void {
  const local = tryGetLocalStorage();
  const session = tryGetSessionStorage();

  local?.setItem(key, value);
  session?.removeItem(key);
}

function removeStoredItem(key: string): void {
  tryGetLocalStorage()?.removeItem(key);
  tryGetSessionStorage()?.removeItem(key);
}

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

interface VerifyEmailPayload {
  email: string;
  code: string;
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

async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as any;
    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length) {
      return String(message[0]);
    }
  } catch {
    // ignore
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // ignore
  }

  return `HTTP ${response.status}`;
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  const message = await readApiErrorMessage(response);
  throw new Error(message);
}

export function saveSessionToken(token: string): void {
  setStoredItem(TOKEN_STORAGE_KEY, token);
}

export function getSessionToken(): string | null {
  return getStoredItem(TOKEN_STORAGE_KEY);
}

export function clearSessionToken(): void {
  removeStoredItem(TOKEN_STORAGE_KEY);
  removeStoredItem(USER_PROFILE_STORAGE_KEY);
  removeStoredItem(SUPERADMIN_ACTING_USER_STORAGE_KEY);
  try {
    (window as unknown as { __bbAccountDisabledNotified?: boolean }).__bbAccountDisabledNotified = false;
  } catch {
    // ignore
  }
}

function readCachedUserProfile(): AuthUser | null {
  const raw = getStoredItem(USER_PROFILE_STORAGE_KEY);
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
  setStoredItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
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

export function isSuperAdmin(): boolean {
  return getCurrentUser()?.role === "SUPERADMIN";
}

export function getSuperAdminActingUserId(): string | null {
  if (!isSuperAdmin()) {
    return null;
  }
  return getStoredItem(SUPERADMIN_ACTING_USER_STORAGE_KEY);
}

export function setSuperAdminActingUserId(userId: string | null): void {
  if (!isSuperAdmin()) {
    removeStoredItem(SUPERADMIN_ACTING_USER_STORAGE_KEY);
    return;
  }

  if (!userId || !userId.trim()) {
    removeStoredItem(SUPERADMIN_ACTING_USER_STORAGE_KEY);
    return;
  }

  setStoredItem(SUPERADMIN_ACTING_USER_STORAGE_KEY, userId.trim());
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
  const current = getCurrentUser();
  if (!current) {
    return null;
  }

  const actingUserId = getSuperAdminActingUserId();
  if (actingUserId) {
    return actingUserId;
  }

  return current.id;
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
  const actingUserId = getSuperAdminActingUserId();
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(actingUserId ? { "x-bb-acting-user-id": actingUserId } : {}),
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
      clearSessionToken();
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

  await assertOk(response);
}

export async function signIn(payload: LoginPayload): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOk(response);

  const data: LoginResponse = await response.json();
  const token = data.access_token;
  if (!token || typeof token !== "string") {
    throw new Error("Missing access token");
  }

  removeStoredItem(USER_PROFILE_STORAGE_KEY);
  removeStoredItem(SUPERADMIN_ACTING_USER_STORAGE_KEY);
  saveSessionToken(token);
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOk(response);
}

export async function resendVerificationCode(email: string): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  await assertOk(response);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  await assertOk(response);
}

export async function resetPassword(payload: { email: string; code: string; newPassword: string }): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await assertOk(response);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/password`, {
    method: "PUT",
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  await assertOk(response);
}

import { buildAuthHeaders, getRequiredUserId } from './authApi';

const BALANCE_API_URL = `${import.meta.env.VITE_API_URL}/dashboard/balances`;
export type PaymentType = 'CARD' | 'CASH' | 'MOBILE';
export type PaymentKey = 'card' | 'cash' | 'mobile';

export interface PaymentBalanceBreakdown {
  total: number;
  available: number;
  unavailable: number;
}

export interface BalanceReservation {
  id: string;
  amount: number;
  paymentType: PaymentType;
  description: string;
  activityId?: string | null;
  activityName?: string | null;
  createdAt: string;
}

export interface BalanceOverview {
  global: Record<PaymentKey, PaymentBalanceBreakdown>;
  activities: Array<{
    activityId: string;
    name: string;
    balances: Record<PaymentKey, PaymentBalanceBreakdown>;
  }>;
  reservations: BalanceReservation[];
}

export interface BalanceReservationPayload {
  amount: number;
  paymentType: PaymentType;
  description: string;
  activityId?: string | null;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    if (Array.isArray(data.message) && data.message.length) return String(data.message[0]);
  } catch {
    // Keep a readable fallback for non-JSON errors.
  }
  return `HTTP ${response.status}`;
}

export async function getBalanceOverview(userId = getRequiredUserId()): Promise<BalanceOverview> {
  const response = await fetch(`${BALANCE_API_URL}/user/${encodeURIComponent(userId)}`, {

    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as BalanceOverview;
}

export async function createBalanceReservation(
  payload: BalanceReservationPayload,
  userId = getRequiredUserId(),
): Promise<void> {
  const response = await fetch(`${BALANCE_API_URL}/user/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function updateBalanceReservation(
  id: string,
  payload: BalanceReservationPayload,
  userId = getRequiredUserId(),
): Promise<void> {
  const response = await fetch(`${BALANCE_API_URL}/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function deleteBalanceReservation(
  id: string,
  userId = getRequiredUserId(),
): Promise<void> {
  const response = await fetch(`${BALANCE_API_URL}/${encodeURIComponent(id)}/user/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response));
}
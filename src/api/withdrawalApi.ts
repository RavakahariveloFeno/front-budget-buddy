import { buildAuthHeaders, getRequiredUserId } from "./authApi";
import type { PaymentType, Withdrawal } from "@/data/staticData";

const WITHDRAWAL_API_URL = `${import.meta.env.VITE_API_URL}/withdrawal`;

export interface WithdrawalPayload {
  amount: number;
  date: string;
  description?: string;
  activityId: string;
  paymentType?: PaymentType;
  cashFee?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface WithdrawalQueryParams {
  userId?: string;
  activityId?: string;
  page?: number;
  limit?: number;
}

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
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

  return `HTTP ${response.status}`;
}

function mapWithdrawal(item: unknown): Withdrawal | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  const amount = Number(record.amount ?? 0);
  const date = String(record.date ?? "");
  const activityId = String(record.activityId ?? "");
  const userId = String(record.userId ?? "");

  if (!id || !Number.isFinite(amount) || !date || !activityId || !userId) {
    return null;
  }

  return {
    id,
    amount,
    date,
    activityId,
    userId,
    ...(record.createdAt ? { createdAt: String(record.createdAt) } : {}),
    ...(
      record.paymentType && (["CASH", "CARD", "MOBILE"] as PaymentType[]).includes(String(record.paymentType) as PaymentType)
        ? { paymentType: String(record.paymentType) as PaymentType }
        : { paymentType: "CARD" as PaymentType }
    ),
    ...(Number.isFinite(Number(record.cashFee ?? NaN)) ? { cashFee: Number(record.cashFee) } : {}),
    ...(record.description ? { description: String(record.description) } : {}),
  };
}

export async function createWithdrawal(payload: WithdrawalPayload): Promise<Withdrawal> {
  const userId = getRequiredUserId();
  const response = await fetch(WITHDRAWAL_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      date: toIsoDate(payload.date),
      description: payload.description || undefined,
      activityId: payload.activityId,
      paymentType: payload.paymentType,
      cashFee: payload.cashFee ?? undefined,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const withdrawal = mapWithdrawal(data);
  if (!withdrawal) {
    throw new Error("Invalid withdrawal response");
  }

  return withdrawal;
}

export function getWithdrawals(params: WithdrawalQueryParams & { page: number; limit: number }): Promise<PaginatedResult<Withdrawal>>;
export function getWithdrawals(userId?: string): Promise<Withdrawal[]>;
export async function getWithdrawals(paramsOrUserId?: string | WithdrawalQueryParams): Promise<Withdrawal[] | PaginatedResult<Withdrawal>> {
  const params = typeof paramsOrUserId === "object" ? paramsOrUserId : undefined;
  const userId = params?.userId ?? (typeof paramsOrUserId === "string" ? paramsOrUserId : getRequiredUserId());
  const query = new URLSearchParams();
  if (params?.activityId) {
    query.set("activityId", params.activityId);
  }
  if (params?.page) {
    query.set("page", String(params.page));
  }
  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const response = await fetch(`${WITHDRAWAL_API_URL}/user/${encodeURIComponent(userId)}${query.toString() ? `?${query.toString()}` : ""}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const rawItems: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as any).items)
      ? ((data as any).items as unknown[])
      : [];
  const items = rawItems.map((item) => mapWithdrawal(item)).filter((item): item is Withdrawal => Boolean(item));

  if (params?.page || params?.limit) {
    const record = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
    const total = Number(record.total ?? items.length);
    const page = Number(record.page ?? params.page ?? 1);
    const limit = Number(record.limit ?? params.limit ?? items.length);

    return {
      items,
      total: Number.isFinite(total) ? total : items.length,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : items.length,
    };
  }

  return items;
}

export async function updateWithdrawal(id: string, payload: WithdrawalPayload): Promise<Withdrawal> {
  const userId = getRequiredUserId();
  const body = JSON.stringify({
    amount: payload.amount,
    date: toIsoDate(payload.date),
    description: payload.description || undefined,
    activityId: payload.activityId,
    paymentType: payload.paymentType,
    cashFee: payload.cashFee ?? undefined,
    userId,
  });

  let response = await fetch(`${WITHDRAWAL_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${WITHDRAWAL_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body,
    });
  }

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const withdrawal = mapWithdrawal(data);
  if (!withdrawal) {
    throw new Error("Invalid withdrawal response");
  }

  return withdrawal;
}

export async function deleteWithdrawal(id: string): Promise<void> {
  const response = await fetch(`${WITHDRAWAL_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}


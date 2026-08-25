import type { Investment } from "@/data/staticData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";
import type { PaymentType } from "@/data/staticData";

const INVESTMENT_API_URL = `${import.meta.env.VITE_API_URL}/investment`;

export interface InvestmentPayload {
  amount: number;
  paymentType?: PaymentType;
  date: string;
  note?: string;
  fromActivityId: string;
  toActivityId: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface InvestmentQueryParams {
  userId?: string;
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

function mapInvestment(item: unknown): Investment | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const paymentType = record.paymentType === "CASH" || record.paymentType === "CARD" || record.paymentType === "MOBILE" ? (record.paymentType as PaymentType) : undefined;
  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    fromActivityId: String(record.fromActivityId ?? ""),
    toActivityId: String(record.toActivityId ?? ""),
    ...(paymentType ? { paymentType } : {}),
    ...(record.note ? { note: String(record.note) } : {}),
  };
}

export function getInvestments(params: InvestmentQueryParams & { page: number; limit: number }): Promise<PaginatedResult<Investment>>;
export function getInvestments(params?: InvestmentQueryParams): Promise<Investment[]>;
export async function getInvestments(params?: InvestmentQueryParams): Promise<Investment[] | PaginatedResult<Investment>> {
  const userId = params?.userId ?? getRequiredUserId();
  const query = new URLSearchParams();
  if (params?.page) {
    query.set("page", String(params.page));
  }
  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const response = await fetch(`${INVESTMENT_API_URL}/user/${encodeURIComponent(userId)}${query.toString() ? `?${query.toString()}` : ""}`, {
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

  const items = rawItems
    .map((item): Investment | null => mapInvestment(item))
    .filter((item): item is Investment => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.fromActivityId && item.toActivityId));

  if (params?.page || params?.limit) {
    const record = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
    const total = Number(record.total ?? items.length);
    const page = Number(record.page ?? params?.page ?? 1);
    const limit = Number(record.limit ?? params?.limit ?? items.length);

    return {
      items,
      total: Number.isFinite(total) ? total : items.length,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : items.length,
    };
  }

  return items;
}

export async function createInvestment(payload: InvestmentPayload): Promise<Investment> {
  const response = await fetch(INVESTMENT_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      date: toIsoDate(payload.date),
      note: payload.note || undefined,
      fromActivityId: payload.fromActivityId,
      toActivityId: payload.toActivityId
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const investment = mapInvestment(data);
  if (!investment) {
    throw new Error("Invalid investment response");
  }

  return investment;
}

export async function updateInvestment(id: string, payload: InvestmentPayload): Promise<Investment> {
  const body = JSON.stringify({
    amount: payload.amount,
    paymentType: payload.paymentType,
    date: toIsoDate(payload.date),
    note: payload.note || undefined,
    fromActivityId: payload.fromActivityId,
    toActivityId: payload.toActivityId
  });
  let response = await fetch(`${INVESTMENT_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${INVESTMENT_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body,
    });
  }

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const investment = mapInvestment(data);
  if (!investment) {
    throw new Error("Invalid investment response");
  }

  return investment;
}

export async function deleteInvestment(id: string): Promise<void> {
  const response = await fetch(`${INVESTMENT_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

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

export async function getInvestments(): Promise<Investment[]> {
  const userId = getRequiredUserId();
  const response = await fetch(`${INVESTMENT_API_URL}/user/${userId}`, {
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
    .map((item): Investment | null => mapInvestment(item))
    .filter((item): item is Investment => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.fromActivityId && item.toActivityId));
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

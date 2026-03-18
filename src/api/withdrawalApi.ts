import { buildAuthHeaders, getRequiredUserId } from "./authApi";
import type { Withdrawal } from "@/data/staticData";

const WITHDRAWAL_API_URL = `${import.meta.env.VITE_API_URL}/withdrawal`;

export interface WithdrawalPayload {
  amount: number;
  date: string;
  description?: string;
  activityId: string;
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

export async function getWithdrawals(userId: string = getRequiredUserId()): Promise<Withdrawal[]> {
  const response = await fetch(`${WITHDRAWAL_API_URL}/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => mapWithdrawal(item)).filter((item): item is Withdrawal => Boolean(item));
}


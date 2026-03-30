import type { Income, PaymentType } from "@/data/staticData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const INCOME_API_URL = `${import.meta.env.VITE_API_URL}/income`;
const STATISTICS_API_URL = `${import.meta.env.VITE_API_URL}/statistics`;

export interface IncomePayload {
  amount: number;
  paymentType?: PaymentType;
  cashFee?: number;
  date: string;
  description?: string;
  activityId?: string;
}

export type IncomeRecurrenceFrequency = "DAY" | "WEEK" | "MONTH";

export interface RecurringIncomePayload {
  amount: number;
  paymentType?: PaymentType;
  cashFee?: number;
  startDate: string;
  endDate?: string;
  frequency: IncomeRecurrenceFrequency;
  description?: string;
  activityId?: string;
}

export interface RecurringIncome {
  id: string;
  amount: number;
  paymentType?: PaymentType;
  cashFee?: number;
  startDate: string;
  endDate?: string;
  frequency: IncomeRecurrenceFrequency;
  description?: string;
  activityId?: string;
  isActive: boolean;
  userId: string;
}

export interface UpdateRecurringIncomePayload {
  amount?: number;
  paymentType?: PaymentType;
  cashFee?: number;
  startDate?: string;
  endDate?: string;
  frequency?: IncomeRecurrenceFrequency;
  description?: string;
  activityId?: string;
  isActive?: boolean;
}

export interface IncomeMonthlyPoint {
  month: string;
  revenus: number;
}

export interface IncomeStatistics {
  year: number;
  totalIncome: number;
  cardTotal: number;
  cashTotal: number;
  mobileTotal: number;
  monthlyData: IncomeMonthlyPoint[];
}

function isValidPaymentType(type: unknown): type is PaymentType {
  return type === "CASH" || type === "CARD" || type === "MOBILE";
}

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
}

function mapIncome(item: unknown): Income | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const rawPaymentType = record.paymentType;
  const paymentType =
    rawPaymentType === null || rawPaymentType === undefined
      ? "CARD"
      : isValidPaymentType(rawPaymentType)
        ? rawPaymentType
        : undefined;

  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    userId: String(record.userId ?? ""),
    ...(Number.isFinite(Number(record.cashFee ?? NaN)) ? { cashFee: Number(record.cashFee) } : {}),
    ...(record.createdAt ? { createdAt: String(record.createdAt) } : {}),
    ...(paymentType ? { paymentType } : {}),
    ...(record.description ? { description: String(record.description) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
    ...(record.recurringIncomeId ? { recurringIncomeId: String(record.recurringIncomeId) } : {}),
  };
}

function mapRecurringIncome(item: unknown): RecurringIncome | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  const amount = Number(record.amount ?? 0);
  const startDate = String(record.startDate ?? "");
  const frequency = String(record.frequency ?? "") as IncomeRecurrenceFrequency;
  const rawPaymentType = record.paymentType;
  const paymentType =
    rawPaymentType === null || rawPaymentType === undefined
      ? "CARD"
      : isValidPaymentType(rawPaymentType)
        ? rawPaymentType
        : undefined;

  if (!id || !Number.isFinite(amount) || !startDate || !["DAY", "WEEK", "MONTH"].includes(frequency)) {
    return null;
  }

  return {
    id,
    amount,
    startDate,
    frequency,
    isActive: Boolean(record.isActive),
    userId: String(record.userId ?? ""),
    ...(Number.isFinite(Number(record.cashFee ?? NaN)) ? { cashFee: Number(record.cashFee) } : {}),
    ...(paymentType ? { paymentType } : {}),
    ...(record.endDate ? { endDate: String(record.endDate) } : {}),
    ...(record.description ? { description: String(record.description) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
  };
}

function mapIncomeStatistics(item: unknown): IncomeStatistics | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const monthlyData = Array.isArray(record.monthlyData)
    ? record.monthlyData
        .map((point) => {
          if (!point || typeof point !== "object") {
            return null;
          }
          const pointRecord = point as Record<string, unknown>;
          const month = String(pointRecord.month ?? "");
          const revenus = Number(pointRecord.revenus ?? 0);
          if (!month) {
            return null;
          }
          return {
            month,
            revenus: Number.isFinite(revenus) ? revenus : 0,
          };
        })
        .filter((point): point is IncomeMonthlyPoint => Boolean(point))
    : [];

  return {
    year: Number(record.year ?? new Date().getFullYear()),
    totalIncome: Number(record.totalIncome ?? 0),
    cardTotal: Number(record.cardTotal ?? 0),
    cashTotal: Number(record.cashTotal ?? 0),
    mobileTotal: Number(record.mobileTotal ?? 0),
    monthlyData,
  };
}

export async function getIncomes(params?: { userId?: string; activityId?: string }): Promise<Income[]> {
  const userId = params?.userId ?? getRequiredUserId();
  const activityId = params?.activityId;
  const url = activityId
    ? `${INCOME_API_URL}/activity/${encodeURIComponent(activityId)}?userId=${encodeURIComponent(userId)}`
    : `${INCOME_API_URL}/user/${userId}`;

  const response = await fetch(url, {
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
    .map((item): Income | null => mapIncome(item))
    .filter((item): item is Income => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.userId));

  const sortKey = (income: Income) => {
    const createdAtTime = income.createdAt ? new Date(income.createdAt).getTime() : Number.NaN;
    if (Number.isFinite(createdAtTime)) {
      return createdAtTime;
    }

    const dateTime = new Date(income.date).getTime();
    return Number.isFinite(dateTime) ? dateTime : 0;
  };

  return items.sort((a, b) => sortKey(b) - sortKey(a));
}

export async function getIncomeStatistics(params?: { userId?: string; year?: number; activityId?: string }): Promise<IncomeStatistics> {
  const userId = params?.userId ?? getRequiredUserId();
  const query = new URLSearchParams();
  if (typeof params?.year === "number") {
    query.set("year", String(params.year));
  }
  if (params?.activityId) {
    query.set("activityId", params.activityId);
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await fetch(`${STATISTICS_API_URL}/incomes/user/${userId}${suffix}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const statistics = mapIncomeStatistics(data);
  if (!statistics) {
    throw new Error("Invalid income statistics response");
  }

  return statistics;
}

export async function createIncome(payload: IncomePayload): Promise<Income> {
  const userId = getRequiredUserId();
  const response = await fetch(INCOME_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      cashFee: payload.cashFee ?? undefined,
      date: toIsoDate(payload.date),
      description: payload.description || undefined,
      activityId: payload.activityId || undefined,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const income = mapIncome(data);
  if (!income) {
    throw new Error("Invalid income response");
  }

  return income;
}

export async function createRecurringIncome(payload: RecurringIncomePayload): Promise<{ createdOccurrences: number }> {
  const userId = getRequiredUserId();
  const response = await fetch(`${INCOME_API_URL}/recurring`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      cashFee: payload.cashFee ?? undefined,
      startDate: toIsoDate(payload.startDate),
      endDate: payload.endDate ? toIsoDate(payload.endDate) : undefined,
      frequency: payload.frequency,
      description: payload.description || undefined,
      activityId: payload.activityId || undefined,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const createdOccurrences = Number(record.createdOccurrences ?? 0);

  return {
    createdOccurrences: Number.isFinite(createdOccurrences) ? createdOccurrences : 0,
  };
}

export async function getRecurringIncomes(userId: string = getRequiredUserId()): Promise<RecurringIncome[]> {
  const response = await fetch(`${INCOME_API_URL}/recurring/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => mapRecurringIncome(item)).filter((item): item is RecurringIncome => Boolean(item));
}

export async function updateRecurringIncome(id: string, payload: UpdateRecurringIncomePayload): Promise<RecurringIncome> {
  const userId = getRequiredUserId();
  const response = await fetch(`${INCOME_API_URL}/recurring/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType || null,
      cashFee: payload.cashFee ?? null,
      startDate: payload.startDate ? toIsoDate(payload.startDate) : undefined,
      endDate: payload.endDate ? toIsoDate(payload.endDate) : undefined,
      frequency: payload.frequency,
      description: payload.description || null,
      activityId: payload.activityId || null,
      isActive: payload.isActive,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const recurring = mapRecurringIncome(data);
  if (!recurring) {
    throw new Error("Invalid recurring income response");
  }

  return recurring;
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${INCOME_API_URL}/recurring/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function updateIncome(id: string, payload: IncomePayload): Promise<Income> {
  const userId = getRequiredUserId();
  const body = JSON.stringify({
    amount: payload.amount,
    paymentType: payload.paymentType,
    cashFee: payload.cashFee ?? undefined,
    date: toIsoDate(payload.date),
    description: payload.description || undefined,
    activityId: payload.activityId || undefined,
    userId,
  });
  let response = await fetch(`${INCOME_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${INCOME_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body,
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const income = mapIncome(data);
  if (!income) {
    throw new Error("Invalid income response");
  }

  return income;
}

export async function deleteIncome(id: string): Promise<void> {
  const response = await fetch(`${INCOME_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

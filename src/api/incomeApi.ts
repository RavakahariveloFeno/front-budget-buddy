import type { Income, PaymentType } from "@/data/staticData";

const INCOME_API_URL = "http://localhost:3001/income";
const STATISTICS_API_URL = "http://localhost:3001/statistics";
const TEMP_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface IncomePayload {
  amount: number;
  paymentType?: PaymentType;
  date: string;
  description?: string;
  activityId?: string;
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
  monthlyData: IncomeMonthlyPoint[];
}

function isValidPaymentType(type: unknown): type is PaymentType {
  return type === "CASH" || type === "CARD";
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
  const paymentType = isValidPaymentType(rawPaymentType) ? rawPaymentType : undefined;

  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    userId: String(record.userId ?? ""),
    ...(paymentType ? { paymentType } : {}),
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
    monthlyData,
  };
}

export async function getIncomes(): Promise<Income[]> {
  const response = await fetch(INCOME_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): Income | null => mapIncome(item))
    .filter((item): item is Income => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.userId));
}

export async function getIncomeStatistics(userId: string = TEMP_USER_ID, year?: number): Promise<IncomeStatistics> {
  const suffix = typeof year === "number" ? `?year=${year}` : "";
  const response = await fetch(`${STATISTICS_API_URL}/incomes/user/${userId}${suffix}`);
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
  const response = await fetch(INCOME_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      date: toIsoDate(payload.date),
      description: payload.description || undefined,
      activityId: payload.activityId || undefined,
      userId: TEMP_USER_ID,
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

export async function updateIncome(id: string, payload: IncomePayload): Promise<Income> {
  const body = JSON.stringify({
    amount: payload.amount,
    paymentType: payload.paymentType,
    date: toIsoDate(payload.date),
    description: payload.description || undefined,
    activityId: payload.activityId || undefined,
    userId: TEMP_USER_ID,
  });
  let response = await fetch(`${INCOME_API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${INCOME_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
  const response = await fetch(`${INCOME_API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

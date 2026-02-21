import type { Budget, BudgetPeriod } from "@/data/staticData";

const BUDGET_API_URL = "http://localhost:3001/budget";
export const TEMP_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface BudgetPayload {
  amount: number;
  period: BudgetPeriod;
  startDate: string;
}

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
}

function isValidBudgetPeriod(period: unknown): period is BudgetPeriod {
  return period === "DAY" || period === "WEEK" || period === "MONTH";
}

function mapBudget(item: unknown): Budget | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  if (!isValidBudgetPeriod(record.period)) {
    return null;
  }

  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    period: record.period,
    startDate: String(record.startDate ?? ""),
    userId: String(record.userId ?? ""),
  };
}

export async function getBudgets(): Promise<Budget[]> {
  const response = await fetch(BUDGET_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): Budget | null => mapBudget(item))
    .filter((item): item is Budget => Boolean(item && item.id && Number.isFinite(item.amount) && item.startDate && item.userId));
}

export async function createBudget(payload: BudgetPayload): Promise<Budget> {
  const response = await fetch(BUDGET_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      period: payload.period,
      startDate: toIsoDate(payload.startDate),
      userId: TEMP_USER_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const budget = mapBudget(data);
  if (!budget) {
    throw new Error("Invalid budget response");
  }

  return budget;
}

export async function updateBudget(id: string, payload: BudgetPayload): Promise<Budget> {
  const body = JSON.stringify({
    amount: payload.amount,
    period: payload.period,
    startDate: toIsoDate(payload.startDate),
    userId: TEMP_USER_ID,
  });
  let response = await fetch(`${BUDGET_API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${BUDGET_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const budget = mapBudget(data);
  if (!budget) {
    throw new Error("Invalid budget response");
  }

  return budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const response = await fetch(`${BUDGET_API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

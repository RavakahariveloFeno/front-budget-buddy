import type { Budget, BudgetPeriod } from "@/data/staticData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const BUDGET_API_URL = "http://localhost:3001/budget";
const STATISTICS_API_URL = "http://localhost:3001/statistics";

export interface BudgetPayload {
  amount: number;
  period: BudgetPeriod;
  startDate: string;
}

export interface BudgetStatistics {
  spentByPeriod: {
    DAY: number;
    WEEK: number;
    MONTH: number;
  };
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

function mapBudgetStatistics(item: unknown): BudgetStatistics | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const spentByPeriod = record.spentByPeriod;

  if (!spentByPeriod || typeof spentByPeriod !== "object") {
    return null;
  }

  const periodRecord = spentByPeriod as Record<string, unknown>;
  return {
    spentByPeriod: {
      DAY: Number(periodRecord.DAY ?? 0),
      WEEK: Number(periodRecord.WEEK ?? 0),
      MONTH: Number(periodRecord.MONTH ?? 0),
    },
  };
}

export async function getBudgets(): Promise<Budget[]> {
  const userId = getRequiredUserId();
  const response = await fetch(BUDGET_API_URL, {
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
    .map((item): Budget | null => mapBudget(item))
    .filter((item): item is Budget => Boolean(item && item.id && Number.isFinite(item.amount) && item.startDate && item.userId))
    .filter((item) => item.userId === userId);
}

export async function getBudgetStatistics(userId: string = getRequiredUserId()): Promise<BudgetStatistics> {
  const response = await fetch(`${STATISTICS_API_URL}/budgets/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const statistics = mapBudgetStatistics(data);
  if (!statistics) {
    throw new Error("Invalid budget statistics response");
  }

  return statistics;
}

export async function createBudget(payload: BudgetPayload): Promise<Budget> {
  const userId = getRequiredUserId();
  const response = await fetch(BUDGET_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      period: payload.period,
      startDate: toIsoDate(payload.startDate),
      userId,
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
  const userId = getRequiredUserId();
  const body = JSON.stringify({
    amount: payload.amount,
    period: payload.period,
    startDate: toIsoDate(payload.startDate),
    userId,
  });
  let response = await fetch(`${BUDGET_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${BUDGET_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
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
  const response = await fetch(`${BUDGET_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

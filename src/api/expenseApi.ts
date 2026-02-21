import type { Expense } from "@/data/staticData";

const EXPENSE_API_URL = "http://localhost:3001/expense";
export const TEMP_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface ExpensePayload {
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
  activityId?: string;
}

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
}

function mapExpense(item: unknown): Expense | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    userId: String(record.userId ?? ""),
    ...(record.description ? { description: String(record.description) } : {}),
    ...(record.categoryId ? { categoryId: String(record.categoryId) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(EXPENSE_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): Expense | null => mapExpense(item))
    .filter((item): item is Expense => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.userId));
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const response = await fetch(EXPENSE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      date: toIsoDate(payload.date),
      description: payload.description || undefined,
      categoryId: payload.categoryId || undefined,
      activityId: payload.activityId || undefined,
      userId: TEMP_USER_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const expense = mapExpense(data);
  if (!expense) {
    throw new Error("Invalid expense response");
  }

  return expense;
}

export async function updateExpense(id: string, payload: ExpensePayload): Promise<Expense> {
  const body = JSON.stringify({
    amount: payload.amount,
    date: toIsoDate(payload.date),
    description: payload.description || undefined,
    categoryId: payload.categoryId || undefined,
    activityId: payload.activityId || undefined,
    userId: TEMP_USER_ID,
  });
  let response = await fetch(`${EXPENSE_API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${EXPENSE_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const expense = mapExpense(data);
  if (!expense) {
    throw new Error("Invalid expense response");
  }

  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`${EXPENSE_API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

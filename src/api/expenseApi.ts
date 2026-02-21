import type { Expense } from "@/data/staticData";

const EXPENSE_API_URL = "http://localhost:3001/expense";
const STATISTICS_API_URL = "http://localhost:3001/statistics";
export const TEMP_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface ExpensePayload {
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
  activityId?: string;
}

export type ExpenseRecurrenceFrequency = "DAY" | "WEEK" | "MONTH";

export interface RecurringExpensePayload {
  amount: number;
  startDate: string;
  endDate?: string;
  frequency: ExpenseRecurrenceFrequency;
  description?: string;
  categoryId?: string;
  activityId?: string;
}

export interface ExpenseCategoryStat {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  value: number;
  count: number;
}

export interface ExpenseStatistics {
  totalExpenses: number;
  transactionCount: number;
  topCategory: ExpenseCategoryStat | null;
  expensesByCategory: ExpenseCategoryStat[];
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

function mapExpenseCategoryStat(item: unknown): ExpenseCategoryStat | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  const name = String(record.name ?? "");
  const value = Number(record.value ?? 0);
  const count = Number(record.count ?? 0);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    ...(record.icon ? { icon: String(record.icon) } : {}),
    ...(record.color ? { color: String(record.color) } : {}),
    value: Number.isFinite(value) ? value : 0,
    count: Number.isFinite(count) ? count : 0,
  };
}

function mapExpenseStatistics(item: unknown): ExpenseStatistics | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const totalExpenses = Number(record.totalExpenses ?? 0);
  const transactionCount = Number(record.transactionCount ?? 0);
  const topCategory = mapExpenseCategoryStat(record.topCategory);

  const expensesByCategory = Array.isArray(record.expensesByCategory)
    ? record.expensesByCategory
        .map((entry) => mapExpenseCategoryStat(entry))
        .filter((entry): entry is ExpenseCategoryStat => Boolean(entry))
    : [];

  return {
    totalExpenses: Number.isFinite(totalExpenses) ? totalExpenses : 0,
    transactionCount: Number.isFinite(transactionCount) ? transactionCount : 0,
    topCategory,
    expensesByCategory,
  };
}

export async function getExpenses(userId: string = TEMP_USER_ID): Promise<Expense[]> {
  const response = await fetch(`${EXPENSE_API_URL}/user/${userId}`);
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

export async function getExpenseStatistics(userId: string = TEMP_USER_ID): Promise<ExpenseStatistics> {
  const response = await fetch(`${STATISTICS_API_URL}/expenses/user/${userId}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const statistics = mapExpenseStatistics(data);
  if (!statistics) {
    throw new Error("Invalid expense statistics response");
  }

  return statistics;
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

export async function createRecurringExpense(payload: RecurringExpensePayload): Promise<{ createdOccurrences: number }> {
  const response = await fetch(`${EXPENSE_API_URL}/recurring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      startDate: toIsoDate(payload.startDate),
      endDate: payload.endDate ? toIsoDate(payload.endDate) : undefined,
      frequency: payload.frequency,
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
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const createdOccurrences = Number(record.createdOccurrences ?? 0);

  return {
    createdOccurrences: Number.isFinite(createdOccurrences) ? createdOccurrences : 0,
  };
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

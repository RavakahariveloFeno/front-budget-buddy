import type { Expense } from "@/data/staticData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";
import type { PaymentType } from "@/data/staticData";

const EXPENSE_API_URL = `${import.meta.env.VITE_API_URL}/expense`;
const STATISTICS_API_URL = `${import.meta.env.VITE_API_URL}/statistics`;

export interface ExpensePayload {
  amount: number;
  paymentType?: PaymentType;
  date: string;
  description?: string;
  categoryId?: string;
  activityId?: string;
}

export type ExpenseRecurrenceFrequency = "DAY" | "WEEK" | "MONTH";

export interface RecurringExpensePayload {
  amount: number;
  paymentType?: PaymentType;
  startDate: string;
  endDate?: string;
  frequency: ExpenseRecurrenceFrequency;
  description?: string;
  categoryId?: string;
  activityId?: string;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  paymentType?: PaymentType;
  startDate: string;
  endDate?: string;
  frequency: ExpenseRecurrenceFrequency;
  description?: string;
  categoryId?: string;
  activityId?: string;
  isActive: boolean;
  userId: string;
}

export interface UpdateRecurringExpensePayload {
  amount?: number;
  paymentType?: PaymentType;
  startDate?: string;
  endDate?: string;
  frequency?: ExpenseRecurrenceFrequency;
  description?: string;
  categoryId?: string;
  activityId?: string;
  isActive?: boolean;
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

function mapExpense(item: unknown): Expense | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const paymentType = record.paymentType === "CASH" || record.paymentType === "CARD" ? (record.paymentType as PaymentType) : undefined;
  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    userId: String(record.userId ?? ""),
    ...(paymentType ? { paymentType } : {}),
    ...(record.description ? { description: String(record.description) } : {}),
    ...(record.categoryId ? { categoryId: String(record.categoryId) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
    ...(record.recurringExpenseId ? { recurringExpenseId: String(record.recurringExpenseId) } : {}),
  };
}

function mapRecurringExpense(item: unknown): RecurringExpense | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  const amount = Number(record.amount ?? 0);
  const startDate = String(record.startDate ?? "");
  const frequency = String(record.frequency ?? "") as ExpenseRecurrenceFrequency;
  const paymentType = record.paymentType === "CASH" || record.paymentType === "CARD" ? (record.paymentType as PaymentType) : undefined;

  if (!id || !Number.isFinite(amount) || !startDate || !["DAY", "WEEK", "MONTH"].includes(frequency)) {
    return null;
  }

  return {
    id,
    amount,
    ...(paymentType ? { paymentType } : {}),
    startDate,
    frequency,
    isActive: Boolean(record.isActive),
    userId: String(record.userId ?? ""),
    ...(record.endDate ? { endDate: String(record.endDate) } : {}),
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

export async function getExpenses(userId: string = getRequiredUserId()): Promise<Expense[]> {
  const response = await fetch(`${EXPENSE_API_URL}/user/${userId}`, {
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
    .map((item): Expense | null => mapExpense(item))
    .filter((item): item is Expense => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.userId));
}

export async function getExpenseStatistics(userId: string = getRequiredUserId()): Promise<ExpenseStatistics> {
  const response = await fetch(`${STATISTICS_API_URL}/expenses/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
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
  const userId = getRequiredUserId();
  const response = await fetch(EXPENSE_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      date: toIsoDate(payload.date),
      description: payload.description || undefined,
      categoryId: payload.categoryId || undefined,
      activityId: payload.activityId || undefined,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const expense = mapExpense(data);
  if (!expense) {
    throw new Error("Invalid expense response");
  }

  return expense;
}

export async function createRecurringExpense(payload: RecurringExpensePayload): Promise<{ createdOccurrences: number }> {
  const userId = getRequiredUserId();
  const response = await fetch(`${EXPENSE_API_URL}/recurring`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      startDate: toIsoDate(payload.startDate),
      endDate: payload.endDate ? toIsoDate(payload.endDate) : undefined,
      frequency: payload.frequency,
      description: payload.description || undefined,
      categoryId: payload.categoryId || undefined,
      activityId: payload.activityId || undefined,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const createdOccurrences = Number(record.createdOccurrences ?? 0);

  return {
    createdOccurrences: Number.isFinite(createdOccurrences) ? createdOccurrences : 0,
  };
}

export async function getRecurringExpenses(userId: string = getRequiredUserId()): Promise<RecurringExpense[]> {
  const response = await fetch(`${EXPENSE_API_URL}/recurring/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => mapRecurringExpense(item)).filter((item): item is RecurringExpense => Boolean(item));
}

export async function updateRecurringExpense(id: string, payload: UpdateRecurringExpensePayload): Promise<RecurringExpense> {
  const userId = getRequiredUserId();
  const response = await fetch(`${EXPENSE_API_URL}/recurring/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      paymentType: payload.paymentType,
      startDate: payload.startDate ? toIsoDate(payload.startDate) : undefined,
      endDate: payload.endDate ? toIsoDate(payload.endDate) : undefined,
      frequency: payload.frequency,
      description: payload.description || null,
      categoryId: payload.categoryId || null,
      activityId: payload.activityId || null,
      isActive: payload.isActive,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const recurring = mapRecurringExpense(data);
  if (!recurring) {
    throw new Error("Invalid recurring expense response");
  }

  return recurring;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${EXPENSE_API_URL}/recurring/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function updateExpense(id: string, payload: ExpensePayload): Promise<Expense> {
  const userId = getRequiredUserId();
  const body = JSON.stringify({
    amount: payload.amount,
    paymentType: payload.paymentType,
    date: toIsoDate(payload.date),
    description: payload.description || undefined,
    categoryId: payload.categoryId || undefined,
    activityId: payload.activityId || undefined,
    userId,
  });
  let response = await fetch(`${EXPENSE_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${EXPENSE_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body,
    });
  }

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const expense = mapExpense(data);
  if (!expense) {
    throw new Error("Invalid expense response");
  }

  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`${EXPENSE_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

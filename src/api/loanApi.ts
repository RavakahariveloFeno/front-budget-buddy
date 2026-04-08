import type { Loan, LoanDirection, LoanPayment, LoanStatus, LoanType, PaymentType } from "@/data/staticData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const LOAN_API_URL = `${import.meta.env.VITE_API_URL}/loan`;
const LOAN_OPS_API_URL = `${import.meta.env.VITE_API_URL}/loans`;
const STATISTICS_API_URL = `${import.meta.env.VITE_API_URL}/statistics`;

export interface LoanPayload {
  totalAmount: number;
  remainingAmount: number;
  paymentType?: PaymentType;
  direction?: LoanDirection;
  type: LoanType;
  lenderName: string;
  description?: string;
  interestRate?: number;
  startDate: string;
  endDate?: string;
  activityId?: string;
  status?: LoanStatus;
}

export interface LoanPaymentHistory {
  loanId: string;
  paymentCount: number;
  totalPaid: number;
  payments: LoanPayment[];
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

function isValidLoanType(type: unknown): type is LoanType {
  return type === "BANK" || type === "FRIEND" || type === "COMPANY" || type === "OTHER";
}

function isValidLoanStatus(status: unknown): status is LoanStatus {
  return status === "ACTIVE" || status === "PAID";
}

function isValidLoanDirection(direction: unknown): direction is LoanDirection {
  return direction === "BORROWED" || direction === "LENT";
}

function mapLoanPayment(item: unknown): LoanPayment | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const paymentType = record.paymentType === "CASH" || record.paymentType === "CARD" || record.paymentType === "MOBILE" ? (record.paymentType as PaymentType) : undefined;
  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    loanId: String(record.loanId ?? ""),
    ...(paymentType ? { paymentType } : {}),
    ...(record.note ? { note: String(record.note) } : {}),
  };
}

function mapLoan(item: unknown): Loan | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  if (!isValidLoanType(record.type)) {
    return null;
  }

  const rawStatus = record.status;
  const status: LoanStatus = isValidLoanStatus(rawStatus) ? rawStatus : Number(record.remainingAmount ?? 0) <= 0 ? "PAID" : "ACTIVE";
  const paymentType = record.paymentType === "CASH" || record.paymentType === "CARD" || record.paymentType === "MOBILE" ? (record.paymentType as PaymentType) : undefined;
  const direction: LoanDirection = isValidLoanDirection(record.direction) ? (record.direction as LoanDirection) : "BORROWED";
  const paymentsRaw = Array.isArray(record.payments) ? record.payments : [];
  const payments = paymentsRaw.map((payment): LoanPayment | null => mapLoanPayment(payment)).filter((payment): payment is LoanPayment => Boolean(payment && payment.id && Number.isFinite(payment.amount) && payment.date && payment.loanId));

  return {
    id: String(record.id ?? ""),
    totalAmount: Number(record.totalAmount ?? 0),
    remainingAmount: Number(record.remainingAmount ?? 0),
    settledOutsideSystem: Boolean(record.settledOutsideSystem),
    ...(paymentType ? { paymentType } : {}),
    direction,
    type: record.type,
    lenderName: String(record.lenderName ?? ""),
    ...(record.description ? { description: String(record.description) } : {}),
    startDate: String(record.startDate ?? ""),
    status,
    userId: String(record.userId ?? ""),
    payments,
    ...(record.interestRate !== undefined && record.interestRate !== null ? { interestRate: Number(record.interestRate) } : {}),
    ...(record.endDate ? { endDate: String(record.endDate) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
  };
}

function mapLoanPaymentHistory(item: unknown): LoanPaymentHistory | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const loanId = String(record.loanId ?? "");
  const paymentCount = Number(record.paymentCount ?? 0);
  const totalPaid = Number(record.totalPaid ?? 0);
  const paymentsRaw = Array.isArray(record.payments) ? record.payments : [];
  const payments = paymentsRaw.map((payment): LoanPayment | null => mapLoanPayment(payment)).filter((payment): payment is LoanPayment => Boolean(payment && payment.id && Number.isFinite(payment.amount) && payment.date && payment.loanId));

  if (!loanId) {
    return null;
  }

  return {
    loanId,
    paymentCount: Number.isFinite(paymentCount) ? paymentCount : 0,
    totalPaid: Number.isFinite(totalPaid) ? totalPaid : 0,
    payments,
  };
}

export async function getLoans(): Promise<Loan[]> {
  const userId = getRequiredUserId();
  const response = await fetch(LOAN_API_URL, {
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
    .map((item): Loan | null => mapLoan(item))
    .filter((item): item is Loan => Boolean(item && item.id && Number.isFinite(item.totalAmount) && Number.isFinite(item.remainingAmount) && item.lenderName && item.startDate && item.userId))
    .filter((item) => item.userId === userId);
}

export async function getLoanPaymentHistory(userId: string = getRequiredUserId()): Promise<LoanPaymentHistory[]> {
  const response = await fetch(`${STATISTICS_API_URL}/loans/payments/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.items)) {
    return [];
  }

  return record.items
    .map((item): LoanPaymentHistory | null => mapLoanPaymentHistory(item))
    .filter((item): item is LoanPaymentHistory => Boolean(item));
}

function buildLoanBody(payload: LoanPayload): string {
  const userId = getRequiredUserId();
  return JSON.stringify({
    totalAmount: payload.totalAmount,
    remainingAmount: payload.remainingAmount,
    paymentType: payload.paymentType,
    direction: payload.direction,
    type: payload.type,
    lenderName: payload.lenderName,
    description: payload.description || undefined,
    interestRate: payload.interestRate ?? undefined,
    startDate: toIsoDate(payload.startDate),
    endDate: payload.endDate ? toIsoDate(payload.endDate) : undefined,
    status: payload.status ?? (payload.remainingAmount <= 0 ? "PAID" : "ACTIVE"),
    activityId: payload.activityId || undefined,
    userId,
  });
}

export async function createLoan(payload: LoanPayload): Promise<Loan> {
  const response = await fetch(LOAN_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: buildLoanBody(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const loan = mapLoan(data);
  if (!loan) {
    throw new Error("Invalid loan response");
  }

  return loan;
}

export async function updateLoan(id: string, payload: LoanPayload): Promise<Loan> {
  const body = buildLoanBody(payload);
  let response = await fetch(`${LOAN_API_URL}/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${LOAN_API_URL}/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(true),
      body,
    });
  }

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const loan = mapLoan(data);
  if (!loan) {
    throw new Error("Invalid loan response");
  }

  return loan;
}

export async function deleteLoan(id: string): Promise<void> {
  const response = await fetch(`${LOAN_API_URL}/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function markLoanAsAlreadyRepaid(id: string): Promise<Loan> {
  const response = await fetch(`${LOAN_OPS_API_URL}/${id}/mark-already-repaid`, {
    method: "POST",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const loan = mapLoan(data);
  if (!loan) {
    throw new Error("Invalid loan response");
  }

  return loan;
}

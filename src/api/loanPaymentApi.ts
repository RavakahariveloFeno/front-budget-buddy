import type { LoanPayment } from "@/data/staticData";
import { buildAuthHeaders } from "./authApi";

const LOAN_PAYMENT_API_URL = "http://localhost:3001/loan-payment";

export interface LoanPaymentPayload {
  amount: number;
  date: string;
  note?: string;
  loanId: string;
}

function toIsoDate(date: string): string {
  return new Date(date).toISOString();
}

function mapLoanPayment(item: unknown): LoanPayment | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    loanId: String(record.loanId ?? ""),
    ...(record.note ? { note: String(record.note) } : {}),
  };
}

export async function getLoanPayments(): Promise<LoanPayment[]> {
  const response = await fetch(LOAN_PAYMENT_API_URL, {
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
    .map((item): LoanPayment | null => mapLoanPayment(item))
    .filter((item): item is LoanPayment => Boolean(item && item.id && Number.isFinite(item.amount) && item.date && item.loanId));
}

export async function createLoanPayment(payload: LoanPaymentPayload): Promise<LoanPayment> {
  const response = await fetch(LOAN_PAYMENT_API_URL, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      amount: payload.amount,
      date: toIsoDate(payload.date),
      note: payload.note || undefined,
      loanId: payload.loanId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const payment = mapLoanPayment(data);
  if (!payment) {
    throw new Error("Invalid loan payment response");
  }

  return payment;
}

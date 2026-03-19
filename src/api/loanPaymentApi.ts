import type { LoanPayment, PaymentType } from "@/data/staticData";
import { buildAuthHeaders } from "./authApi";

const LOAN_PAYMENT_API_URL = `${import.meta.env.VITE_API_URL}/loan-payment`;

export interface LoanPaymentPayload {
  amount: number;
  paymentType?: PaymentType;
  date: string;
  note?: string;
  loanId: string;
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

function mapLoanPayment(item: unknown): LoanPayment | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const paymentType = record.paymentType === "CASH" || record.paymentType === "CARD" ? (record.paymentType as PaymentType) : undefined;
  return {
    id: String(record.id ?? ""),
    amount: Number(record.amount ?? 0),
    date: String(record.date ?? ""),
    loanId: String(record.loanId ?? ""),
    ...(paymentType ? { paymentType } : {}),
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
      paymentType: payload.paymentType,
      date: toIsoDate(payload.date),
      note: payload.note || undefined,
      loanId: payload.loanId,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }

  const data: unknown = await response.json();
  const payment = mapLoanPayment(data);
  if (!payment) {
    throw new Error("Invalid loan payment response");
  }

  return payment;
}

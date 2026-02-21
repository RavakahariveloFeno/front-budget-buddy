export type ActivityType = "SALARY" | "BUSINESS" | "FREELANCE" | "OTHER";
export type PaymentType = "CASH" | "CARD";
export type BudgetPeriod = "DAY" | "WEEK" | "MONTH";
export type LoanType = "BANK" | "FRIEND" | "COMPANY" | "OTHER";
export type LoanStatus = "ACTIVE" | "PAID";

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  description?: string;
  startDate: string;
  userId: string;
}

export interface Investment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  fromActivityId: string;
  toActivityId: string;
}

export interface Income {
  id: string;
  amount: number;
  paymentType?: PaymentType;
  date: string;
  description?: string;
  activityId?: string;
  recurringIncomeId?: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  userId: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
  activityId?: string;
  recurringExpenseId?: string;
  userId: string;
}

export interface Budget {
  id: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  userId: string;
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  loanId: string;
}

export interface Loan {
  id: string;
  totalAmount: number;
  remainingAmount: number;
  type: LoanType;
  lenderName: string;
  interestRate?: number;
  startDate: string;
  endDate?: string;
  status: LoanStatus;
  activityId?: string;
  userId: string;
  payments: LoanPayment[];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

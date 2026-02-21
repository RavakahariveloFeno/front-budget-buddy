// Static data matching the Prisma schema

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

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  loanId: string;
}

// ── Seed Data ──────────────────────────────────────────────

export const currentUser = {
  id: "user-1",
  firstName: "Alexandre",
  lastName: "Martin",
  email: "alexandre.martin@email.com",
};

export const activities: Activity[] = [
  { id: "act-1", name: "Emploi CDI - TechCorp", type: "SALARY", description: "Développeur senior", startDate: "2022-01-01", userId: "user-1" },
  { id: "act-2", name: "Studio Pixel", type: "BUSINESS", description: "Agence de design", startDate: "2021-06-15", userId: "user-1" },
  { id: "act-3", name: "Consulting IT", type: "FREELANCE", description: "Missions freelance", startDate: "2023-03-01", userId: "user-1" },
  { id: "act-4", name: "Revenus divers", type: "OTHER", description: "Locations et ventes", startDate: "2022-09-01", userId: "user-1" },
];

export const investments: Investment[] = [
  { id: "inv-1", amount: 5000, date: "2024-02-10", note: "Apport initial", fromActivityId: "act-1", toActivityId: "act-2" },
  { id: "inv-2", amount: 3500, date: "2024-05-20", note: "Développement studio", fromActivityId: "act-1", toActivityId: "act-2" },
  { id: "inv-3", amount: 2000, date: "2024-08-14", note: "Équipement freelance", fromActivityId: "act-2", toActivityId: "act-3" },
  { id: "inv-4", amount: 1200, date: "2024-11-03", note: "Matériel", fromActivityId: "act-1", toActivityId: "act-4" },
];

export const incomes: Income[] = [
  { id: "inc-1", amount: 3800, paymentType: "CARD", date: "2025-01-05", description: "Salaire janvier", activityId: "act-1", userId: "user-1" },
  { id: "inc-2", amount: 1200, paymentType: "CARD", date: "2025-01-12", description: "Facture client A", activityId: "act-2", userId: "user-1" },
  { id: "inc-3", amount: 650, paymentType: "CASH", date: "2025-01-18", description: "Mission audit", activityId: "act-3", userId: "user-1" },
  { id: "inc-4", amount: 3800, paymentType: "CARD", date: "2025-02-05", description: "Salaire février", activityId: "act-1", userId: "user-1" },
  { id: "inc-5", amount: 2100, paymentType: "CARD", date: "2025-02-15", description: "Facture client B", activityId: "act-2", userId: "user-1" },
  { id: "inc-6", amount: 400, paymentType: "CASH", date: "2025-02-22", description: "Vente équipement", activityId: "act-4", userId: "user-1" },
  { id: "inc-7", amount: 3800, paymentType: "CARD", date: "2025-03-05", description: "Salaire mars", activityId: "act-1", userId: "user-1" },
  { id: "inc-8", amount: 1850, paymentType: "CARD", date: "2025-03-20", description: "Facture client C", activityId: "act-2", userId: "user-1" },
  { id: "inc-9", amount: 900, paymentType: "CARD", date: "2025-04-10", description: "Mission dev", activityId: "act-3", userId: "user-1" },
  { id: "inc-10", amount: 3800, paymentType: "CARD", date: "2025-04-05", description: "Salaire avril", activityId: "act-1", userId: "user-1" },
  { id: "inc-11", amount: 500, paymentType: "CASH", date: "2025-04-18", description: "Location matériel", activityId: "act-4", userId: "user-1" },
  { id: "inc-12", amount: 3800, paymentType: "CARD", date: "2025-05-05", description: "Salaire mai", activityId: "act-1", userId: "user-1" },
];

export const categories: Category[] = [
  { id: "cat-1", name: "Alimentation", icon: "🛒", color: "#10b981", userId: "user-1" },
  { id: "cat-2", name: "Logement", icon: "🏠", color: "#3b82f6", userId: "user-1" },
  { id: "cat-3", name: "Transport", icon: "🚗", color: "#f59e0b", userId: "user-1" },
  { id: "cat-4", name: "Santé", icon: "🏥", color: "#ef4444", userId: "user-1" },
  { id: "cat-5", name: "Loisirs", icon: "🎮", color: "#8b5cf6", userId: "user-1" },
  { id: "cat-6", name: "Vêtements", icon: "👗", color: "#ec4899", userId: "user-1" },
  { id: "cat-7", name: "Technologie", icon: "💻", color: "#06b6d4", userId: "user-1" },
  { id: "cat-8", name: "Restaurants", icon: "🍽️", color: "#f97316", userId: "user-1" },
];

export const expenses: Expense[] = [
  { id: "exp-1", amount: 850, date: "2025-01-03", description: "Loyer janvier", categoryId: "cat-2", activityId: "act-1", userId: "user-1" },
  { id: "exp-2", amount: 180, date: "2025-01-07", description: "Courses semaine", categoryId: "cat-1", userId: "user-1" },
  { id: "exp-3", amount: 95, date: "2025-01-10", description: "Essence + péage", categoryId: "cat-3", userId: "user-1" },
  { id: "exp-4", amount: 45, date: "2025-01-14", description: "Resto client", categoryId: "cat-8", activityId: "act-2", userId: "user-1" },
  { id: "exp-5", amount: 850, date: "2025-02-03", description: "Loyer février", categoryId: "cat-2", userId: "user-1" },
  { id: "exp-6", amount: 230, date: "2025-02-08", description: "Courses + épicerie", categoryId: "cat-1", userId: "user-1" },
  { id: "exp-7", amount: 120, date: "2025-02-12", description: "Netflix + Spotify", categoryId: "cat-5", userId: "user-1" },
  { id: "exp-8", amount: 350, date: "2025-02-18", description: "Clavier mécanique", categoryId: "cat-7", activityId: "act-3", userId: "user-1" },
  { id: "exp-9", amount: 850, date: "2025-03-03", description: "Loyer mars", categoryId: "cat-2", userId: "user-1" },
  { id: "exp-10", amount: 190, date: "2025-03-09", description: "Courses semaine", categoryId: "cat-1", userId: "user-1" },
  { id: "exp-11", amount: 85, date: "2025-03-15", description: "Pharmacie", categoryId: "cat-4", userId: "user-1" },
  { id: "exp-12", amount: 200, date: "2025-03-22", description: "Vêtements printemps", categoryId: "cat-6", userId: "user-1" },
  { id: "exp-13", amount: 850, date: "2025-04-03", description: "Loyer avril", categoryId: "cat-2", userId: "user-1" },
  { id: "exp-14", amount: 160, date: "2025-04-08", description: "Courses semaine", categoryId: "cat-1", userId: "user-1" },
  { id: "exp-15", amount: 75, date: "2025-04-14", description: "Transport commun", categoryId: "cat-3", userId: "user-1" },
  { id: "exp-16", amount: 650, date: "2025-04-20", description: "Casque audio", categoryId: "cat-7", userId: "user-1" },
  { id: "exp-17", amount: 850, date: "2025-05-03", description: "Loyer mai", categoryId: "cat-2", userId: "user-1" },
  { id: "exp-18", amount: 175, date: "2025-05-10", description: "Courses semaine", categoryId: "cat-1", userId: "user-1" },
];

export const budgets: Budget[] = [
  { id: "bud-1", amount: 300, period: "MONTH", startDate: "2025-01-01", userId: "user-1" },
  { id: "bud-2", amount: 50, period: "WEEK", startDate: "2025-01-01", userId: "user-1" },
  { id: "bud-3", amount: 15, period: "DAY", startDate: "2025-01-01", userId: "user-1" },
];

export const loans: Loan[] = [
  {
    id: "loan-1",
    totalAmount: 15000,
    remainingAmount: 9200,
    type: "BANK",
    lenderName: "Crédit Agricole",
    interestRate: 3.5,
    startDate: "2023-06-01",
    endDate: "2028-06-01",
    status: "ACTIVE",
    activityId: "act-2",
    userId: "user-1",
    payments: [
      { id: "pay-1", amount: 280, date: "2024-11-01", note: "Mensualité novembre", loanId: "loan-1" },
      { id: "pay-2", amount: 280, date: "2024-12-01", note: "Mensualité décembre", loanId: "loan-1" },
      { id: "pay-3", amount: 280, date: "2025-01-01", note: "Mensualité janvier", loanId: "loan-1" },
      { id: "pay-4", amount: 280, date: "2025-02-01", note: "Mensualité février", loanId: "loan-1" },
      { id: "pay-5", amount: 280, date: "2025-03-01", note: "Mensualité mars", loanId: "loan-1" },
    ],
  },
  {
    id: "loan-2",
    totalAmount: 3000,
    remainingAmount: 1500,
    type: "FRIEND",
    lenderName: "Thomas Dupont",
    interestRate: 0,
    startDate: "2024-03-15",
    endDate: "2025-09-15",
    status: "ACTIVE",
    userId: "user-1",
    payments: [
      { id: "pay-6", amount: 500, date: "2024-06-01", note: "Premier remboursement", loanId: "loan-2" },
      { id: "pay-7", amount: 500, date: "2024-09-01", note: "Deuxième remboursement", loanId: "loan-2" },
      { id: "pay-8", amount: 500, date: "2025-01-01", note: "Troisième remboursement", loanId: "loan-2" },
    ],
  },
  {
    id: "loan-3",
    totalAmount: 8000,
    remainingAmount: 0,
    type: "COMPANY",
    lenderName: "BNP Paribas",
    interestRate: 4.2,
    startDate: "2022-01-01",
    endDate: "2024-12-31",
    status: "PAID",
    userId: "user-1",
    payments: [
      { id: "pay-9", amount: 8000, date: "2024-12-01", note: "Remboursement total", loanId: "loan-3" },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────

export function getActivityById(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Aggregates ─────────────────────────────────────────────

export const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
export const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
export const totalLoans = loans.filter((l) => l.status === "ACTIVE").reduce((s, l) => s + l.remainingAmount, 0);
export const totalInvestments = investments.reduce((s, i) => s + i.amount, 0);
export const balance = totalIncome - totalExpenses;

// Monthly chart data
export const monthlyData = [
  { month: "Jan", revenus: 5650, dépenses: 1170 },
  { month: "Fév", revenus: 6300, dépenses: 1550 },
  { month: "Mar", revenus: 6550, dépenses: 1325 },
  { month: "Avr", revenus: 5200, dépenses: 1735 },
  { month: "Mai", revenus: 3975, dépenses: 1025 },
];

// Expenses by category
export const expensesByCategory = categories.map((cat) => ({
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
  value: expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0),
})).filter((c) => c.value > 0);

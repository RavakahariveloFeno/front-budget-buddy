import { buildAuthHeaders, getRequiredUserId } from "./authApi";
const STATISTICS_API_URL = `${import.meta.env.VITE_API_URL}/statistics`;

export interface DashboardStats {
  totals: {
    income: number;
    expense: number;
    activeLoans: number;
    toRecoverLoans: number;
    investments: number;
    balance: number;
    activeLoanCount: number;
    toRecoverLoanCount: number;
  };
  paymentBalances: {
    card: number;
    cash: number;
  };
  monthlyData: Array<{
    month: string;
    revenus: number;
    depenses: number;
  }>;
  expensesByCategory: Array<{
    id: string;
    name: string;
    icon?: string;
    color?: string;
    value: number;
  }>;
  recentTransactions: Array<{
    id: string;
    kind: "income" | "expense";
    amount: number;
    date: string;
    description?: string;
    activityName?: string;
    categoryName?: string;
    categoryIcon?: string;
  }>;
  activeLoans: Array<{
    id: string;
    lenderName: string;
    totalAmount: number;
    remainingAmount: number;
  }>;
  toRecoverLoans: Array<{
    id: string;
    lenderName: string;
    totalAmount: number;
    remainingAmount: number;
  }>;
  activities: Array<{
    activityId: string;
    name: string;
    type: string;
    income: number;
    expense: number;
    sentInvestment: number;
    receivedInvestment: number;
    netAvailable: number;
    cardBalance: number;
    cashBalance: number;
  }>;
}

function mapDashboardStats(item: unknown): DashboardStats | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const totals = record.totals as Record<string, unknown> | undefined;
  if (!totals || typeof totals !== "object") {
    return null;
  }

  const monthlyData = Array.isArray(record.monthlyData)
    ? record.monthlyData
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          return {
            month: String(row.month ?? ""),
            revenus: Number(row.revenus ?? 0),
            depenses: Number(row.depenses ?? 0),
          };
        })
        .filter((entry): entry is DashboardStats["monthlyData"][number] => Boolean(entry && entry.month))
    : [];

  const expensesByCategory = Array.isArray(record.expensesByCategory)
    ? record.expensesByCategory
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          return {
            id: String(row.id ?? ""),
            name: String(row.name ?? ""),
            value: Number(row.value ?? 0),
            ...(row.icon ? { icon: String(row.icon) } : {}),
            ...(row.color ? { color: String(row.color) } : {}),
          };
        })
        .filter((entry): entry is DashboardStats["expensesByCategory"][number] => Boolean(entry && entry.id && entry.name))
    : [];

  const recentTransactions = Array.isArray(record.recentTransactions)
    ? record.recentTransactions
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          const kind = row.kind === "income" || row.kind === "expense" ? row.kind : null;
          if (!kind) return null;
          return {
            id: String(row.id ?? ""),
            kind,
            amount: Number(row.amount ?? 0),
            date: String(row.date ?? ""),
            ...(row.description ? { description: String(row.description) } : {}),
            ...(row.activityName ? { activityName: String(row.activityName) } : {}),
            ...(row.categoryName ? { categoryName: String(row.categoryName) } : {}),
            ...(row.categoryIcon ? { categoryIcon: String(row.categoryIcon) } : {}),
          };
        })
        .filter((entry): entry is DashboardStats["recentTransactions"][number] => Boolean(entry && entry.id && entry.date))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const activeLoans = Array.isArray(record.activeLoans)
    ? record.activeLoans
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          return {
            id: String(row.id ?? ""),
            lenderName: String(row.lenderName ?? ""),
            totalAmount: Number(row.totalAmount ?? 0),
            remainingAmount: Number(row.remainingAmount ?? 0),
          };
        })
        .filter((entry): entry is DashboardStats["activeLoans"][number] => Boolean(entry && entry.id && entry.lenderName))
    : [];

  const toRecoverLoans = Array.isArray(record.toRecoverLoans)
    ? record.toRecoverLoans
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          return {
            id: String(row.id ?? ""),
            lenderName: String(row.lenderName ?? ""),
            totalAmount: Number(row.totalAmount ?? 0),
            remainingAmount: Number(row.remainingAmount ?? 0),
          };
        })
        .filter((entry): entry is DashboardStats["toRecoverLoans"][number] => Boolean(entry && entry.id && entry.lenderName))
    : [];

  const activities = Array.isArray(record.activities)
    ? record.activities
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          return {
            activityId: String(row.activityId ?? ""),
            name: String(row.name ?? ""),
            type: String(row.type ?? ""),
            income: Number(row.income ?? 0),
            expense: Number(row.expense ?? 0),
            sentInvestment: Number(row.sentInvestment ?? 0),
            receivedInvestment: Number(row.receivedInvestment ?? 0),
            netAvailable: Number(row.netAvailable ?? 0),
            cardBalance: Number(row.cardBalance ?? 0),
            cashBalance: Number(row.cashBalance ?? 0),
          };
        })
        .filter((entry): entry is DashboardStats["activities"][number] => Boolean(entry && entry.activityId && entry.name))
    : [];

  const paymentBalancesRaw = record.paymentBalances as Record<string, unknown> | undefined;
  const paymentBalances = paymentBalancesRaw && typeof paymentBalancesRaw === "object"
    ? {
        card: Number(paymentBalancesRaw.card ?? 0),
        cash: Number(paymentBalancesRaw.cash ?? 0),
      }
    : { card: 0, cash: 0 };

  return {
    totals: {
      income: Number(totals.income ?? 0),
      expense: Number(totals.expense ?? 0),
      activeLoans: Number(totals.activeLoans ?? 0),
      toRecoverLoans: Number(totals.toRecoverLoans ?? 0),
      investments: Number(totals.investments ?? 0),
      balance: Number(totals.balance ?? 0),
      activeLoanCount: Number(totals.activeLoanCount ?? 0),
      toRecoverLoanCount: Number(totals.toRecoverLoanCount ?? 0),
    },
    paymentBalances: {
      card: Number.isFinite(paymentBalances.card) ? paymentBalances.card : 0,
      cash: Number.isFinite(paymentBalances.cash) ? paymentBalances.cash : 0,
    },
    monthlyData,
    expensesByCategory,
    recentTransactions,
    activeLoans,
    toRecoverLoans,
    activities,
  };
}

export async function getDashboardStats(userId: string = getRequiredUserId()): Promise<DashboardStats> {
  const response = await fetch(`${STATISTICS_API_URL}/dashboard/user/${userId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const stats = mapDashboardStats(data);
  if (!stats) {
    throw new Error("Invalid dashboard statistics response");
  }
  return stats;
}

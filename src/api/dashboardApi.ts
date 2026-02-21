const STATISTICS_API_URL = "http://localhost:3001/statistics";
const TEMP_USER_ID = "ad687a0d-bf8d-4ef0-9cb2-d0fee40cd960";

export interface DashboardStats {
  totals: {
    income: number;
    expense: number;
    activeLoans: number;
    investments: number;
    balance: number;
    activeLoanCount: number;
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
  activities: Array<{
    activityId: string;
    name: string;
    type: string;
    income: number;
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
          };
        })
        .filter((entry): entry is DashboardStats["activities"][number] => Boolean(entry && entry.activityId && entry.name))
    : [];

  return {
    totals: {
      income: Number(totals.income ?? 0),
      expense: Number(totals.expense ?? 0),
      activeLoans: Number(totals.activeLoans ?? 0),
      investments: Number(totals.investments ?? 0),
      balance: Number(totals.balance ?? 0),
      activeLoanCount: Number(totals.activeLoanCount ?? 0),
    },
    monthlyData,
    expensesByCategory,
    recentTransactions,
    activeLoans,
    activities,
  };
}

export async function getDashboardStats(userId: string = TEMP_USER_ID): Promise<DashboardStats> {
  const response = await fetch(`${STATISTICS_API_URL}/dashboard/user/${userId}`);
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

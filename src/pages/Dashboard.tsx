import { useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  HandCoins,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Header from "@/components/layout/Header";
import { getDashboardStats, type DashboardStats } from "@/api/dashboardApi";
import { getInvestments } from "@/api/investmentApi";
import { getLoans } from "@/api/loanApi";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Investment, Loan } from "@/data/staticData";
import { compareByMostRecent } from "@/lib/recent-sort";
import { useActivityFilterStore } from "@/stores/activityFilterStore";

/* ─────────────────────────────── helpers ─────────────────────────────── */

function CircularProgress({
  value,
  color,
  size = 64,
  strokeWidth = 5,
}: {
  value: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        stroke="hsl(var(--border))"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        stroke={color}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

/* ─────────────────────────────── StatCard ─────────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  hint,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  variant: "income" | "expense" | "loan" | "invest" | "default";
  hint?: string;
  delay?: number;
}) {
  const variantClass = {
    income: "stat-card-income",
    expense: "stat-card-expense",
    loan: "stat-card-loan",
    invest: "stat-card-invest",
    default: "",
  }[variant];

  const iconColors = {
    income: "hsl(var(--primary))",
    expense: "hsl(var(--destructive))",
    loan: "hsl(var(--warning))",
    invest: "hsl(var(--purple))",
    default: "hsl(var(--accent))",
  }[variant];

  const iconBg = {
    income: "hsl(var(--primary-dim))",
    expense: "hsl(var(--destructive-dim))",
    loan: "hsl(var(--warning-dim))",
    invest: "hsl(var(--purple-dim))",
    default: "hsl(var(--secondary))",
  }[variant];

  const accentColor = {
    income: "hsl(var(--primary))",
    expense: "hsl(var(--destructive))",
    loan: "hsl(var(--warning))",
    invest: "hsl(var(--purple))",
    default: "hsl(var(--accent))",
  }[variant];

  return (
    <div
      className={`stat-card ${variantClass} animate-fade-in group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* subtle left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full opacity-60"
        style={{ background: accentColor }}
      />

      <div className="mb-4 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: iconBg }}
        >
          <Icon size={18} style={{ color: iconColors }} />
        </div>
      </div>
      <p className="mb-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </p>
      <p className="text-2xl font-display font-bold" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────── constants ─────────────────────────────── */

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const CustomTooltipStyle = {
  contentStyle: {
    background: "hsl(225, 27%, 12%)",
    border: "1px solid hsl(224, 22%, 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(213, 31%, 93%)",
  },
};

const EMPTY_DASHBOARD: DashboardStats = {
  totals: {
    income: 0,
    expense: 0,
    activeLoans: 0,
    toRecoverLoans: 0,
    investments: 0,
    balance: 0,
    activeLoanCount: 0,
    toRecoverLoanCount: 0,
  },
  paymentBalances: {
    card: 0,
    cash: 0,
    mobile: 0,
  },
  monthlyData: [],
  expensesByCategory: [],
  recentTransactions: [],
  activeLoans: [],
  toRecoverLoans: [],
  activities: [],
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  SALARY: "badge-income",
  BUSINESS: "badge-purple",
  FREELANCE: "badge-info",
  OTHER: "badge-warning",
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  SALARY: "Salaire",
  BUSINESS: "Business",
  FREELANCE: "Freelance",
  OTHER: "Autre",
};

/* ─────────────────────────────── Dashboard ─────────────────────────────── */

export default function Dashboard() {
  const selectedActivityId = useActivityFilterStore((state) => state.selectedActivityId);
  const [dashboard, setDashboard] = useState<DashboardStats>(EMPTY_DASHBOARD);
  const [investmentList, setInvestmentList] = useState<Investment[]>([]);
  const [loanList, setLoanList] = useState<Loan[]>([]);

  const recentTransactions = useMemo(
    () =>
      [...dashboard.recentTransactions]
        .sort(compareByMostRecent(["createdAt", "date"]))
        .slice(0, 6),
    [dashboard.recentTransactions],
  );

  type RecentAction =
    | {
        id: string;
        kind: "income";
        amount: number;
        date: string;
        createdAt?: string;
        description?: string;
        activityName?: string;
        categoryName?: string;
        categoryIcon?: string;
      }
    | {
        id: string;
        kind: "expense";
        amount: number;
        date: string;
        createdAt?: string;
        description?: string;
        activityName?: string;
        categoryName?: string;
        categoryIcon?: string;
      }
    | {
        id: string;
        kind: "loan";
        amount: number;
        date: string;
        createdAt?: string;
        direction?: string;
        lenderName: string;
        activityName?: string;
      }
    | {
        id: string;
        kind: "investment";
        amount: number;
        date: string;
        createdAt?: string;
        fromActivityId: string;
        toActivityId: string;
        fromActivityName?: string;
        toActivityName?: string;
      };

  const activityNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const activity of dashboard.activities) {
      map.set(activity.activityId, activity.name);
    }
    return map;
  }, [dashboard.activities]);

  const recentActions = useMemo(() => {
    const filteredInvestments = selectedActivityId
      ? investmentList.filter(
          (investment) =>
            investment.fromActivityId === selectedActivityId ||
            investment.toActivityId === selectedActivityId,
        )
      : investmentList;

    const filteredLoans = selectedActivityId
      ? loanList.filter((loan) => loan.activityId === selectedActivityId)
      : loanList;

    const loanActions: RecentAction[] = filteredLoans.map((loan) => ({
      id: loan.id,
      kind: "loan",
      amount: loan.totalAmount,
      date: loan.startDate,
      direction: loan.direction,
      lenderName: loan.lenderName,
      ...(loan.activityId ? { activityName: activityNameById.get(loan.activityId) } : {}),
    }));

    const investmentActions: RecentAction[] = filteredInvestments.map((investment) => ({
      id: investment.id,
      kind: "investment",
      amount: investment.amount,
      date: investment.date,
      fromActivityId: investment.fromActivityId,
      toActivityId: investment.toActivityId,
      fromActivityName: activityNameById.get(investment.fromActivityId),
      toActivityName: activityNameById.get(investment.toActivityId),
    }));

    const transactionActions: RecentAction[] = recentTransactions.map((tx) => ({
      id: tx.id,
      kind: tx.kind,
      amount: tx.amount,
      date: tx.date,
      ...(tx.createdAt ? { createdAt: tx.createdAt } : {}),
      ...(tx.description ? { description: tx.description } : {}),
      ...(tx.activityName ? { activityName: tx.activityName } : {}),
      ...(tx.categoryName ? { categoryName: tx.categoryName } : {}),
      ...(tx.categoryIcon ? { categoryIcon: tx.categoryIcon } : {}),
    }));

    const merged: RecentAction[] = [
      ...transactionActions,
      ...loanActions,
      ...investmentActions,
    ];

    return merged.sort(compareByMostRecent<RecentAction>(["createdAt", "date"])).slice(0, 6);
  }, [activityNameById, investmentList, loanList, recentTransactions, selectedActivityId]);

  const activeLoans = useMemo(
    () =>
      [...dashboard.activeLoans]
        .sort(compareByMostRecent(["createdAt", "startDate", "date"]))
        .slice(0, 4),
    [dashboard.activeLoans],
  );

  const toRecoverLoans = useMemo(
    () =>
      [...dashboard.toRecoverLoans]
        .sort(compareByMostRecent(["createdAt", "startDate", "date"]))
        .slice(0, 4),
    [dashboard.toRecoverLoans],
  );

  const insights = useMemo(() => {
    const savingsRate =
      dashboard.totals.income > 0
        ? Math.round((dashboard.totals.balance / dashboard.totals.income) * 100)
        : 0;
    const expenseRatio =
      dashboard.totals.income > 0
        ? Math.round((dashboard.totals.expense / dashboard.totals.income) * 100)
        : 0;
    const cashShare =
      dashboard.paymentBalances.card + dashboard.paymentBalances.cash + dashboard.paymentBalances.mobile > 0
        ? Math.round(
          (dashboard.paymentBalances.cash /
            (dashboard.paymentBalances.card + dashboard.paymentBalances.cash + dashboard.paymentBalances.mobile)) *
          100,
        )
        : 0;

    return [
      { label: "Taux d'epargne", value: `${savingsRate}%`, rawValue: savingsRate, icon: Sparkles },
      { label: "Poids des depenses", value: `${expenseRatio}%`, rawValue: expenseRatio, icon: Target },
      { label: "Part en especes", value: `${cashShare}%`, rawValue: cashShare, icon: Banknote },
    ];
  }, [dashboard]);

  /* Expense ratio (income vs expense) for the hero bar */
  const expenseBarWidth = useMemo(() => {
    const total = dashboard.totals.income + dashboard.totals.expense;
    if (total === 0) return { income: 50, expense: 50 };
    return {
      income: Math.round((dashboard.totals.income / total) * 100),
      expense: Math.round((dashboard.totals.expense / total) * 100),
    };
  }, [dashboard.totals.income, dashboard.totals.expense]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [stats, investments, loans] = await Promise.all([
          getDashboardStats({ activityId: selectedActivityId ?? undefined }),
          getInvestments(),
          getLoans(),
        ]);

        setDashboard(stats);
        setInvestmentList(investments);
        setLoanList(loans);
      } catch (error) {
        console.error("Impossible de charger les statistiques dashboard depuis l'API.", error);
        setDashboard(EMPTY_DASHBOARD);
        setInvestmentList([]);
        setLoanList([]);
      }
    };

    loadDashboard();
  }, [selectedActivityId]);

  return (
    <div className="animate-fade-in">
      <Header title="Tableau de bord" subtitle="Vue d'ensemble de vos finances" />

      <div className="space-y-6 p-6">

        {/* ── Hero + Stat Cards ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">

          {/* Hero balance */}
          <section
            className="relative overflow-hidden rounded-2xl border p-6 animate-fade-in"
            style={{
              background:
                "radial-gradient(circle at top left, hsl(158 64% 52% / 0.16), transparent 32%), linear-gradient(135deg, hsl(225, 27%, 12%), hsl(222, 24%, 16%))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <div
              className="absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl"
              style={{ background: "hsl(var(--primary) / 0.16)" }}
            />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-6">

                {/* TOP: solde */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Solde net disponible
                  </p>

                  <p className="text-5xl font-bold mt-2">
                    {formatCurrency(dashboard.totals.balance)}
                  </p>

                  <div className="mt-4 flex gap-4 text-sm">
                    <span className="badge-income">
                      + {formatCurrency(dashboard.totals.income)}
                    </span>
                    <span className="badge-expense">
                      - {formatCurrency(dashboard.totals.expense)}
                    </span>
                  </div>
                </div>

                {/* MIDDLE: proportion revenus / dépenses */}
                <div className="space-y-2">
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${expenseBarWidth.income}%`,
                        background: "var(--gradient-primary)",
                      }}
                    />
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${expenseBarWidth.expense}%`,
                        background: "var(--gradient-danger)",
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>💵 Revenus {expenseBarWidth.income}%</span>
                    <span>💸 Dépenses {expenseBarWidth.expense}%</span>
                  </div>
                </div>

                {/* BOTTOM: répartition paiement (REMPLACE le pie chart) */}
                <div className="grid grid-cols-3 gap-4">

                  {/* CASH */}
                  <div className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Cash</span>
                      <span className="text-lg">💵</span>
                    </div>

                    <p className="text-lg font-semibold mt-2">
                      {formatCurrency(dashboard.paymentBalances.cash)}
                    </p>

                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(dashboard.paymentBalances.cash /
                            (dashboard.paymentBalances.cash +
                              dashboard.paymentBalances.card +
                              dashboard.paymentBalances.mobile || 1)) *
                            100
                            }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* CARD */}
                  <div className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Carte</span>
                      <span className="text-lg">💳</span>
                    </div>

                    <p className="text-lg font-semibold mt-2">
                      {formatCurrency(dashboard.paymentBalances.card)}
                    </p>

                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(dashboard.paymentBalances.card /
                            (dashboard.paymentBalances.cash +
                              dashboard.paymentBalances.card +
                              dashboard.paymentBalances.mobile || 1)) *
                            100
                            }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* MOBILE */}
                  <div className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Mobile</span>
                      <span className="text-lg">📱</span>
                    </div>

                    <p className="text-lg font-semibold mt-2">
                      {formatCurrency(dashboard.paymentBalances.mobile)}
                    </p>

                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-violet-500"
                        style={{
                          width: `${(dashboard.paymentBalances.mobile /
                            (dashboard.paymentBalances.cash +
                              dashboard.paymentBalances.card +
                              dashboard.paymentBalances.mobile || 1)) *
                            100
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight chips */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {insights.map((item, index) => (
                  <div
                    key={item.label}
                    className="rounded-xl border px-4 py-3 animate-fade-in transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                    style={{
                      animationDelay: `${120 + index * 60}ms`,
                      animationFillMode: "both",
                      borderColor: "hsl(var(--border))",
                      background: "hsl(var(--background) / 0.2)",
                    }}
                  >
                    <div
                      className="mb-2 flex items-center gap-2 text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </div>
                    <p
                      className="text-lg font-display font-semibold"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stat cards 2×2 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Revenus totaux"
              value={formatCurrency(dashboard.totals.income)}
              icon={TrendingUp}
              variant="income"
              hint="Encaissements cumules"
              delay={40}
            />
            <StatCard
              label="Depenses totales"
              value={formatCurrency(dashboard.totals.expense)}
              icon={TrendingDown}
              variant="expense"
              hint="Sorties cumulees"
              delay={90}
            />
            <StatCard
              label="Prets en cours"
              value={formatCurrency(dashboard.totals.activeLoans)}
              icon={CreditCard}
              variant="loan"
              hint={`${dashboard.totals.activeLoanCount} prets actifs`}
              delay={140}
            />
            <StatCard
              label="A recuperer"
              value={formatCurrency(dashboard.totals.toRecoverLoans)}
              icon={HandCoins}
              variant="invest"
              hint={`${dashboard.totals.toRecoverLoanCount} prets accordes`}
              delay={190}
            />
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Area chart — Revenus vs Dépenses */}
          <div className="stat-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <p
                className="font-display font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Revenus &amp; Dépenses
              </p>
              <span className="badge-info">Tendance mensuelle</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dashboard.monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(158,64%,52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(158,64%,52%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(351,75%,58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(351,75%,58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,22%,18%)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "dataMax"]}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  {...CustomTooltipStyle}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="revenus"
                  name="Revenus"
                  stroke="hsl(158,64%,52%)"
                  fill="url(#colorRev)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="depenses"
                  name="Depenses"
                  stroke="hsl(351,75%,58%)"
                  fill="url(#colorDep)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart — Dépenses par catégorie */}
          <div className="stat-card">
            <div className="mb-4 flex items-center justify-between">
              <p
                className="font-display font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Dépenses par catégorie
              </p>
              <span className="badge-warning">
                {dashboard.expensesByCategory.length} postes
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dashboard.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {dashboard.expensesByCategory.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  {...CustomTooltipStyle}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Category list with % share */}
            <div className="mt-3 space-y-2">
              {dashboard.expensesByCategory.slice(0, 5).map((category, index) => {
                const total = dashboard.totals.expense;
                const pct =
                  total > 0 ? Math.round((category.value / total) * 100) : 0;
                return (
                  <div key={category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            background:
                              category.color ||
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          {category.icon || ""} {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px]"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {pct}%
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: "hsl(var(--foreground))" }}
                        >
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    </div>
                    {/* mini progress bar per category */}
                    <div
                      className="h-1 overflow-hidden rounded-full"
                      style={{ background: "hsl(var(--border))" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background:
                            category.color ||
                            CHART_COLORS[index % CHART_COLORS.length],
                          opacity: 0.75,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Transactions + Loans ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">

          {/* Recent transactions */}
          <div className="stat-card">
            <div className="mb-4 flex items-center justify-between">
              <p
                className="font-display font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Transactions récentes
              </p>
              <span className="badge-info">{recentActions.length} lignes</span>
            </div>
            <div className="space-y-2">
              {recentActions.length ? (
                recentActions.map((tx, index) => {
                  const isIncome = tx.kind === "income";
                  const isExpense = tx.kind === "expense";
                  const isLoan = tx.kind === "loan";
                  const isInvestment = tx.kind === "investment";

                  let investmentSign = "";
                  if (tx.kind === "investment" && selectedActivityId) {
                    if (tx.toActivityId === selectedActivityId) {
                      investmentSign = "+";
                    } else if (tx.fromActivityId === selectedActivityId) {
                      investmentSign = "-";
                    }
                  }

                  const isPositive =
                    isIncome ||
                    (isLoan && tx.direction !== "LENT") ||
                    (isInvestment && investmentSign === "+");
                  const isNegative =
                    isExpense ||
                    (isLoan && tx.direction === "LENT") ||
                    (isInvestment && investmentSign === "-");

                  const accentColor = isPositive
                    ? "hsl(var(--primary) / 0.6)"
                    : isNegative
                      ? "hsl(var(--destructive) / 0.6)"
                      : "hsl(var(--purple) / 0.6)";

                  const pillBg = isPositive
                    ? "hsl(var(--primary-dim))"
                    : isNegative
                      ? "hsl(var(--destructive-dim))"
                      : "hsl(var(--purple-dim))";

                  const pillFg = isPositive
                    ? "hsl(var(--primary))"
                    : isNegative
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--purple))";

                  const iconBg = pillBg;

                  let title = "";
                  let subtitle = "";
                  if (tx.kind === "income") {
                    title = tx.description || "Revenu";
                    subtitle = `${formatDate(tx.date)} · ${tx.activityName || tx.categoryName || "-"}`;
                  } else if (tx.kind === "expense") {
                    title = tx.description || "Depense";
                    subtitle = `${formatDate(tx.date)} · ${tx.activityName || tx.categoryName || "-"}`;
                  } else if (tx.kind === "loan") {
                    title = `${tx.direction === "LENT" ? "Prêt accordé" : "Emprunt"} · ${tx.lenderName}`;
                    subtitle = `${formatDate(tx.date)} · ${tx.activityName || "-"}`;
                  } else {
                    title = `Transfert · ${tx.fromActivityName || "-"} → ${tx.toActivityName || "-"}`;
                    subtitle = `${formatDate(tx.date)} · ${tx.fromActivityName || "-"} → ${tx.toActivityName || "-"}`;
                  }

                  return (
                    <div
                      key={`${tx.kind}-${tx.id}`}
                      className="flex items-center justify-between rounded-xl border px-3 py-3 transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        borderColor: "hsl(var(--border) / 0.6)",
                        background: "hsl(var(--background) / 0.18)",
                        animationDelay: `${index * 50}ms`,
                        borderLeftWidth: "3px",
                        borderLeftColor: accentColor,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm"
                          style={{
                            background: iconBg,
                          }}
                        >
                          {tx.kind === "income" || tx.kind === "expense" ? (
                            tx.categoryIcon || (isIncome ? "$$" : "--")
                          ) : tx.kind === "loan" ? (
                            <CreditCard size={16} style={{ color: pillFg }} />
                          ) : (
                            <ArrowLeftRight size={16} style={{ color: pillFg }} />
                          )}
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            {title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-sm font-semibold"
                          style={{
                            color: pillFg,
                          }}
                        >
                          {tx.kind === "income"
                            ? "+"
                            : tx.kind === "expense"
                              ? "-"
                              : tx.kind === "loan"
                                ? tx.direction === "LENT"
                                  ? "-"
                                  : "+"
                                : investmentSign}
                          {formatCurrency(tx.amount)}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                          style={{
                            background: pillBg,
                            color: pillFg,
                          }}
                        >
                          {tx.kind === "income"
                            ? "Entrée"
                            : tx.kind === "expense"
                              ? "Sortie"
                              : tx.kind === "loan"
                                ? "Prêt"
                                : "Invest."}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Aucune transaction recente.
                </p>
              )}
            </div>
          </div>

          {/* Right column: loans + analyse du solde */}
          <div className="space-y-4">

            {/* Emprunts et récupérations */}
            <div className="stat-card">
              <div className="mb-4 flex items-center justify-between">
                <p
                  className="font-display font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  Emprunts et récupérations
                </p>
                <span className="badge-purple">
                  {formatCurrency(dashboard.totals.investments)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Active loans */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "hsl(var(--warning-dim))",
                    background: "hsl(var(--warning-dim) / 0.08)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      Prêts actifs
                    </p>
                    <span className="badge-warning">{activeLoans.length}</span>
                  </div>
                  <div className="space-y-3">
                    {activeLoans.length ? (
                      activeLoans.map((loan) => {
                        const pct =
                          loan.totalAmount > 0
                            ? Math.round(
                              ((loan.totalAmount - loan.remainingAmount) /
                                loan.totalAmount) *
                              100,
                            )
                            : 0;
                        return (
                          <div key={loan.id}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span style={{ color: "hsl(var(--foreground))" }}>
                                {loan.lenderName}
                              </span>
                              <span style={{ color: "hsl(var(--warning))" }}>
                                {formatCurrency(loan.remainingAmount)}
                              </span>
                            </div>
                            <div
                              className="h-1.5 overflow-hidden rounded-full"
                              style={{ background: "hsl(var(--border))" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: "var(--gradient-warning)",
                                }}
                              />
                            </div>
                            <p
                              className="mt-0.5 text-[10px]"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {pct}% remboursé
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Aucun prêt actif.
                      </p>
                    )}
                  </div>
                </div>

                {/* To recover */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "hsl(var(--purple-dim))",
                    background: "hsl(var(--purple-dim) / 0.08)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      À récupérer
                    </p>
                    <span className="badge-purple">{toRecoverLoans.length}</span>
                  </div>
                  <div className="space-y-3">
                    {toRecoverLoans.length ? (
                      toRecoverLoans.map((loan) => {
                        const pct =
                          loan.totalAmount > 0
                            ? Math.round(
                              ((loan.totalAmount - loan.remainingAmount) /
                                loan.totalAmount) *
                              100,
                            )
                            : 0;
                        return (
                          <div key={`recover-${loan.id}`}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span style={{ color: "hsl(var(--foreground))" }}>
                                {loan.lenderName}
                              </span>
                              <span style={{ color: "hsl(var(--purple))" }}>
                                {formatCurrency(loan.remainingAmount)}
                              </span>
                            </div>
                            <div
                              className="h-1.5 overflow-hidden rounded-full"
                              style={{ background: "hsl(var(--border))" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: "var(--gradient-purple)",
                                }}
                              />
                            </div>
                            <p
                              className="mt-0.5 text-[10px]"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {pct}% récupéré
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Aucun montant à récupérer.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Analyse du solde (replaced "Activites les plus exposees") ── */}
            <div className="stat-card">
              <div className="mb-4 flex items-center justify-between">
                <p
                  className="font-display font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  Analyse du solde
                </p>
                <span className="badge-income">Synthèse</span>
              </div>

              <div className="space-y-4">
                {/* Revenus row */}
                <div>
                  <div
                    className="mb-1.5 flex items-center justify-between text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={11} style={{ color: "hsl(var(--primary))" }} />
                      <span>Revenus</span>
                    </div>
                    <span
                      className="font-semibold"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {formatCurrency(dashboard.totals.income)}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: "hsl(var(--border))" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: "100%", background: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>

                {/* Dépenses row */}
                <div>
                  <div
                    className="mb-1.5 flex items-center justify-between text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingDown size={11} style={{ color: "hsl(var(--destructive))" }} />
                      <span>Dépenses</span>
                    </div>
                    <span
                      className="font-semibold"
                      style={{ color: "hsl(var(--destructive))" }}
                    >
                      {formatCurrency(dashboard.totals.expense)}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: "hsl(var(--border))" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${dashboard.totals.income > 0
                          ? Math.min(
                            100,
                            Math.round(
                              (dashboard.totals.expense /
                                dashboard.totals.income) *
                              100,
                            ),
                          )
                          : 0
                          }%`,
                        background: "var(--gradient-danger)",
                      }}
                    />
                  </div>
                </div>

                {/* Prêts actifs row */}
                <div>
                  <div
                    className="mb-1.5 flex items-center justify-between text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={11} style={{ color: "hsl(var(--warning))" }} />
                      <span>Prêts actifs</span>
                    </div>
                    <span
                      className="font-semibold"
                      style={{ color: "hsl(var(--warning))" }}
                    >
                      {formatCurrency(dashboard.totals.activeLoans)}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: "hsl(var(--border))" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${dashboard.totals.income > 0
                          ? Math.min(
                            100,
                            Math.round(
                              (dashboard.totals.activeLoans /
                                dashboard.totals.income) *
                              100,
                            ),
                          )
                          : 0
                          }%`,
                        background: "var(--gradient-warning)",
                      }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div
                  className="border-t"
                  style={{ borderColor: "hsl(var(--border))" }}
                />

                {/* Net balance + savings rate gauge */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Solde net
                    </p>
                    <p
                      className="text-xl font-bold font-display"
                      style={{
                        color:
                          dashboard.totals.balance >= 0
                            ? "hsl(var(--primary))"
                            : "hsl(var(--destructive))",
                      }}
                    >
                      {formatCurrency(dashboard.totals.balance)}
                    </p>
                  </div>
                  {/* Savings rate circular gauge */}
                  <div className="relative">
                    <CircularProgress
                      value={insights[0].rawValue}
                      color={
                        insights[0].rawValue >= 0
                          ? "hsl(var(--primary))"
                          : "hsl(var(--destructive))"
                      }
                      size={58}
                      strokeWidth={5}
                    />
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ transform: "rotate(0deg)" }}
                    >
                      <span
                        className="text-[11px] font-bold leading-none"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {insights[0].value}
                      </span>
                      <span
                        className="text-[9px] leading-none mt-0.5"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        épargne
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Répartition des activités ── */}
        <div className="stat-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display font-semibold text-foreground">
              Répartition des activités
            </p>
            <span className="badge-info">Vue liste</span>
          </div>

          <div className="flex flex-col divide-y divide-border/50">
            {(selectedActivityId ? dashboard.activities.filter((activity) => activity.activityId === selectedActivityId) : dashboard.activities).map((activity, index) => {
              const isPositive = activity.netAvailable >= 0;
              const totalBalance =
                activity.cashBalance + activity.cardBalance + activity.mobileBalance || 1;

              const cashPct = Math.round(
                (activity.cashBalance / totalBalance) * 100
              );
              const cardPct = Math.round((activity.cardBalance / totalBalance) * 100);
              const mobilePct = Math.max(0, 100 - cashPct - cardPct);

              const netInvest =
                activity.receivedInvestment - activity.sentInvestment;

              return (
                <div
                  key={activity.activityId}
                  className="py-4 flex items-center gap-4 group hover:bg-muted/30 px-2 rounded-lg transition"
                >
                  {/* LEFT: name + tags */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ActivityIcon
                        size={14}
                        className="text-muted-foreground"
                      />
                      <p className="text-sm font-medium truncate">
                        {activity.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span
                        className={
                          ACTIVITY_TYPE_COLORS[activity.type] || "badge-income"
                        }
                      >
                        {ACTIVITY_TYPE_LABELS[activity.type] ||
                          activity.type}
                      </span>

                      {netInvest !== 0 && (
                        <span className="badge-purple">
                          Invest. {formatCurrency(netInvest)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CENTER: progress (cash vs card) */}
                  <div className="w-[180px] hidden md:block">
                    <div className="h-2 flex rounded-full overflow-hidden bg-border">
                      <div
                        style={{ width: `${cashPct}%` }}
                        className="bg-green-500 transition-all duration-700"
                      />
                      <div
                        style={{ width: `${cardPct}%` }}
                        className="bg-blue-500 transition-all duration-700"
                      />
                      <div
                        style={{ width: `${mobilePct}%` }}
                        className="bg-violet-500 transition-all duration-700"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>💵 {cashPct}%</span>
                      <span>💳 {cardPct}%</span>
                      <span>📱 {mobilePct}%</span>
                    </div>
                  </div>

                  {/* RIGHT: values */}
                  <div className="text-right w-[110px]">
                    <p
                      className={`text-sm font-semibold ${isPositive ? "text-primary" : "text-destructive"
                        }`}
                    >
                      {formatCurrency(activity.netAvailable)}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      Net
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

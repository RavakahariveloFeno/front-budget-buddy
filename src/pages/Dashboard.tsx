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
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
import { getBudgets, getBudgetStatistics, type BudgetStatistics } from "@/api/budgetApi";
import { formatCurrency, formatDate, type Budget, type BudgetPeriod } from "@/data/staticData";
import { compareByMostRecent } from "@/lib/recent-sort";

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

  return (
    <div
      className={`stat-card ${variantClass} animate-fade-in group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
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

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

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
  },
  monthlyData: [],
  expensesByCategory: [],
  recentTransactions: [],
  activeLoans: [],
  toRecoverLoans: [],
  activities: [],
};

const EMPTY_BUDGET_STATS: BudgetStatistics = {
  spentByPeriod: {
    DAY: 0,
    WEEK: 0,
    MONTH: 0,
  },
};

const BUDGET_LABELS: Record<BudgetPeriod, string> = {
  DAY: "Jour",
  WEEK: "Semaine",
  MONTH: "Mois",
};

const BUDGET_COLORS: Record<BudgetPeriod, string> = {
  DAY: "hsl(var(--primary))",
  WEEK: "hsl(var(--warning))",
  MONTH: "hsl(var(--purple))",
};

const BUDGET_BACKGROUNDS: Record<BudgetPeriod, string> = {
  DAY: "hsl(var(--primary-dim))",
  WEEK: "hsl(var(--warning-dim))",
  MONTH: "hsl(var(--purple-dim))",
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

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardStats>(EMPTY_DASHBOARD);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStats, setBudgetStats] = useState<BudgetStatistics>(EMPTY_BUDGET_STATS);

  const recentTransactions = useMemo(
    () => [...dashboard.recentTransactions].sort(compareByMostRecent(["createdAt", "date"])).slice(0, 6),
    [dashboard.recentTransactions],
  );

  const activeLoans = useMemo(
    () => [...dashboard.activeLoans].sort(compareByMostRecent(["createdAt", "startDate", "date"])).slice(0, 4),
    [dashboard.activeLoans],
  );

  const toRecoverLoans = useMemo(
    () => [...dashboard.toRecoverLoans].sort(compareByMostRecent(["createdAt", "startDate", "date"])).slice(0, 4),
    [dashboard.toRecoverLoans],
  );

  const budgetCards = useMemo(() => {
    return (["DAY", "WEEK", "MONTH"] as BudgetPeriod[]).map((period) => {
      const budget = budgets.find((item) => item.period === period);
      const amount = budget?.amount ?? 0;
      const spent = budgetStats.spentByPeriod[period] ?? 0;
      const remaining = amount - spent;
      const progress = amount > 0 ? Math.min(100, Math.round((spent / amount) * 100)) : 0;

      return {
        period,
        amount,
        spent,
        remaining,
        progress,
      };
    });
  }, [budgetStats.spentByPeriod, budgets]);

  const insights = useMemo(() => {
    const savingsRate = dashboard.totals.income > 0
      ? Math.round((dashboard.totals.balance / dashboard.totals.income) * 100)
      : 0;
    const expenseRatio = dashboard.totals.income > 0
      ? Math.round((dashboard.totals.expense / dashboard.totals.income) * 100)
      : 0;
    const cashShare = (dashboard.paymentBalances.card + dashboard.paymentBalances.cash) > 0
      ? Math.round((dashboard.paymentBalances.cash / (dashboard.paymentBalances.card + dashboard.paymentBalances.cash)) * 100)
      : 0;

    return [
      { label: "Taux d'epargne", value: `${savingsRate}%`, icon: Sparkles },
      { label: "Poids des depenses", value: `${expenseRatio}%`, icon: Target },
      { label: "Part en especes", value: `${cashShare}%`, icon: Banknote },
    ];
  }, [dashboard]);

  const topActivities = useMemo(() => {
    const maxNet = Math.max(...dashboard.activities.map((activity) => Math.abs(activity.netAvailable)), 0);

    return [...dashboard.activities]
      .sort((left, right) => Math.abs(right.netAvailable) - Math.abs(left.netAvailable))
      .slice(0, 5)
      .map((activity) => ({
        ...activity,
        progress: maxNet > 0 ? Math.max(8, Math.round((Math.abs(activity.netAvailable) / maxNet) * 100)) : 0,
      }));
  }, [dashboard.activities]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [stats, budgetList, budgetStatistics] = await Promise.all([
          getDashboardStats(),
          getBudgets(),
          getBudgetStatistics(),
        ]);
        setDashboard(stats);
        setBudgets(budgetList);
        setBudgetStats(budgetStatistics);
      } catch (error) {
        console.error("Impossible de charger les statistiques dashboard depuis l'API.", error);
        setDashboard(EMPTY_DASHBOARD);
        setBudgets([]);
        setBudgetStats(EMPTY_BUDGET_STATS);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="animate-fade-in">
      <Header title="Tableau de bord" subtitle="Vue d'ensemble de vos finances" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
          <section
            className="relative overflow-hidden rounded-2xl border p-6 animate-fade-in"
            style={{
              background: "radial-gradient(circle at top left, hsl(158 64% 52% / 0.16), transparent 32%), linear-gradient(135deg, hsl(225, 27%, 12%), hsl(222, 24%, 16%))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl" style={{ background: "hsl(var(--primary) / 0.16)" }} />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Solde net disponible
                  </p>
                  <p className="mt-3 text-4xl font-display font-bold" style={{ color: "hsl(var(--foreground))" }}>
                    {formatCurrency(dashboard.totals.balance)}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Vue rapide de la tresorerie avec la repartition carte, especes et quelques indicateurs de sante financiere.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[360px]">
                  <div className="rounded-xl border p-3 transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.28)" }}>
                    <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <CreditCard size={13} />
                      Carte
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                      {formatCurrency(dashboard.paymentBalances.card)}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3 transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.28)" }}>
                    <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Banknote size={13} />
                      Especes
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                      {formatCurrency(dashboard.paymentBalances.cash)}
                    </p>
                  </div>
                  {insights.slice(0, 2).map((item) => (
                    <div key={item.label} className="rounded-xl border p-3 transition-transform duration-300 hover:-translate-y-1" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.28)" }}>
                      <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        <item.icon size={13} />
                        {item.label}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

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
                    <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <item.icon size={14} />
                      {item.label}
                    </div>
                    <p className="text-lg font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Revenus totaux" value={formatCurrency(dashboard.totals.income)} icon={TrendingUp} variant="income" hint="Encaissements cumules" delay={40} />
            <StatCard label="Depenses totales" value={formatCurrency(dashboard.totals.expense)} icon={TrendingDown} variant="expense" hint="Sorties cumulees" delay={90} />
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {budgetCards.map((budget, index) => {
            const isOver = budget.amount > 0 && budget.spent > budget.amount;
            return (
              <div
                key={budget.period}
                className="stat-card animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${70 * index}ms`, animationFillMode: "both" }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: BUDGET_BACKGROUNDS[budget.period] }}>
                    <Wallet size={18} style={{ color: BUDGET_COLORS[budget.period] }} />
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: BUDGET_BACKGROUNDS[budget.period], color: BUDGET_COLORS[budget.period] }}
                  >
                    {BUDGET_LABELS[budget.period]}
                  </span>
                </div>
                <p className="text-xl font-display font-bold" style={{ color: "hsl(var(--foreground))" }}>
                  {formatCurrency(budget.amount)}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <span>Depense</span>
                    <span>{formatCurrency(budget.spent)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: "hsl(var(--border))" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${budget.progress}%`,
                        background: isOver ? "hsl(var(--destructive))" : BUDGET_COLORS[budget.period],
                      }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: isOver ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}>
                    {budget.amount > 0
                      ? isOver
                        ? `Depasse de ${formatCurrency(Math.abs(budget.remaining))}`
                        : `Reste ${formatCurrency(budget.remaining)}`
                      : "Aucun budget defini"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="stat-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Revenus vs Depenses
              </p>
              <span className="badge-info">Tendance mensuelle</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
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
                <XAxis dataKey="month" tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip {...CustomTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenus" name="Revenus" stroke="hsl(158,64%,52%)" fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="depenses" name="Depenses" stroke="hsl(351,75%,58%)" fill="url(#colorDep)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Depenses par categorie
              </p>
              <span className="badge-warning">{dashboard.expensesByCategory.length} postes</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dashboard.expensesByCategory} cx="50%" cy="50%" innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={3}>
                  {dashboard.expensesByCategory.map((entry, index) => (
                    <Cell key={entry.id} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...CustomTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {dashboard.expensesByCategory.slice(0, 5).map((category, index) => (
                <div key={category.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: category.color || CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>
                      {category.icon || ""} {category.name}
                    </span>
                  </div>
                  <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="stat-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Transactions recentes
              </p>
              <span className="badge-info">{recentTransactions.length} lignes</span>
            </div>
            <div className="space-y-2">
              {recentTransactions.length ? (
                recentTransactions.map((tx, index) => {
                  const isIncome = tx.kind === "income";
                  return (
                    <div
                      key={`${tx.kind}-${tx.id}`}
                      className="flex items-center justify-between rounded-xl border px-3 py-3 transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        borderColor: "hsl(var(--border) / 0.6)",
                        background: "hsl(var(--background) / 0.18)",
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm"
                          style={{ background: isIncome ? "hsl(var(--primary-dim))" : "hsl(var(--destructive-dim))" }}
                        >
                          {tx.categoryIcon || (isIncome ? "$$" : "--")}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                            {tx.description || (isIncome ? "Revenu" : "Depense")}
                          </p>
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {formatDate(tx.date)} · {tx.activityName || tx.categoryName || "-"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: isIncome ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Aucune transaction recente.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="stat-card">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  Emprunts et recuperations
                </p>
                <span className="badge-purple">{formatCurrency(dashboard.totals.investments)}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4" style={{ borderColor: "hsl(var(--warning-dim))", background: "hsl(var(--warning-dim) / 0.08)" }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                      Prets actifs
                    </p>
                    <span className="badge-warning">{activeLoans.length}</span>
                  </div>
                  <div className="space-y-3">
                    {activeLoans.length ? activeLoans.map((loan) => {
                      const pct = loan.totalAmount > 0 ? Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100) : 0;
                      return (
                        <div key={loan.id}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span style={{ color: "hsl(var(--foreground))" }}>{loan.lenderName}</span>
                            <span style={{ color: "hsl(var(--warning))" }}>{formatCurrency(loan.remainingAmount)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "hsl(var(--border))" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--gradient-warning)" }} />
                          </div>
                        </div>
                      );
                    }) : <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Aucun pret actif.</p>}
                  </div>
                </div>

                <div className="rounded-xl border p-4" style={{ borderColor: "hsl(var(--purple-dim))", background: "hsl(var(--purple-dim) / 0.08)" }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                      A recuperer
                    </p>
                    <span className="badge-purple">{toRecoverLoans.length}</span>
                  </div>
                  <div className="space-y-3">
                    {toRecoverLoans.length ? toRecoverLoans.map((loan) => {
                      const pct = loan.totalAmount > 0 ? Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100) : 0;
                      return (
                        <div key={`recover-${loan.id}`}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span style={{ color: "hsl(var(--foreground))" }}>{loan.lenderName}</span>
                            <span style={{ color: "hsl(var(--purple))" }}>{formatCurrency(loan.remainingAmount)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "hsl(var(--border))" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--gradient-purple)" }} />
                          </div>
                        </div>
                      );
                    }) : <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Aucun montant a recuperer.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  Activites les plus exposees
                </p>
                <span className="badge-income">{dashboard.activities.length} activites</span>
              </div>
              <div className="space-y-4">
                {topActivities.length ? topActivities.map((activity, index) => {
                  const isPositive = activity.netAvailable >= 0;
                  return (
                    <div key={activity.activityId} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}>
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <ActivityIcon size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                            <p className="truncate text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                              {activity.name}
                            </p>
                            <span className={ACTIVITY_TYPE_COLORS[activity.type] || "badge-income"}>
                              {ACTIVITY_TYPE_LABELS[activity.type] || activity.type}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="badge-income">Rev. {formatCurrency(activity.income)}</span>
                            <span className="badge-expense">Dep. {formatCurrency(activity.expense)}</span>
                            <span className="badge-info">Carte {formatCurrency(activity.cardBalance)}</span>
                            <span className="badge-warning">Cash {formatCurrency(activity.cashBalance)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Net disponible
                          </p>
                          <p className="text-sm font-semibold" style={{ color: isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                            {formatCurrency(activity.netAvailable)}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: "hsl(var(--border))" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${activity.progress}%`,
                            background: isPositive ? "var(--gradient-primary)" : "var(--gradient-danger)",
                          }}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Aucune activite disponible.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Repartition des activites
            </p>
            <span className="badge-info">Vue compacte</span>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {dashboard.activities.map((activity, index) => {
              const isPositive = activity.netAvailable >= 0;
              return (
                <div
                  key={`activity-summary-${activity.activityId}`}
                  className="rounded-xl border p-4 animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    animationDelay: `${index * 40}ms`,
                    animationFillMode: "both",
                    borderColor: "hsl(var(--border) / 0.7)",
                    background: "hsl(var(--background) / 0.2)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ActivityIcon size={15} style={{ color: "hsl(var(--muted-foreground))" }} />
                        <p className="truncate text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {activity.name}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={ACTIVITY_TYPE_COLORS[activity.type] || "badge-income"}>
                          {ACTIVITY_TYPE_LABELS[activity.type] || activity.type}
                        </span>
                        <span className="badge-purple">Invest. {formatCurrency(activity.receivedInvestment - activity.sentInvestment)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Net
                      </p>
                      <p className="text-sm font-semibold" style={{ color: isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                        {formatCurrency(activity.netAvailable)}
                      </p>
                    </div>
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

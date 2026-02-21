import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, CreditCard, ArrowLeftRight,
  Wallet, Activity as ActivityIcon,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import { getDashboardStats } from "@/api/dashboardApi";
import type { DashboardStats } from "@/api/dashboardApi";

function StatCard({
  label, value, icon: Icon, variant, trend, trendLabel,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  variant: "income" | "expense" | "loan" | "invest" | "default";
  trend?: number;
  trendLabel?: string;
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
    <div className={`stat-card ${variantClass} animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={18} style={{ color: iconColors }} />
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: trend >= 0 ? "hsl(var(--primary-dim))" : "hsl(var(--destructive-dim))",
              color: trend >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))",
            }}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>{value}</p>
      <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      {trendLabel && <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{trendLabel}</p>}
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
    investments: 0,
    balance: 0,
    activeLoanCount: 0,
  },
  monthlyData: [],
  expensesByCategory: [],
  recentTransactions: [],
  activeLoans: [],
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

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardStats>(EMPTY_DASHBOARD);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const stats = await getDashboardStats();
        setDashboard(stats);
      } catch (error) {
        console.error("Impossible de charger les statistiques dashboard depuis l'API.", error);
        setDashboard(EMPTY_DASHBOARD);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="animate-fade-in">
      <Header
        title="Tableau de bord"
        subtitle="Vue d'ensemble de vos finances"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenus totaux" value={formatCurrency(dashboard.totals.income)} icon={TrendingUp} variant="income" />
          <StatCard label="Depenses totales" value={formatCurrency(dashboard.totals.expense)} icon={TrendingDown} variant="expense" />
          <StatCard label="Prets en cours" value={formatCurrency(dashboard.totals.activeLoans)} icon={CreditCard} variant="loan" trendLabel={`${dashboard.totals.activeLoanCount} prets actifs`} />
          <StatCard label="Investissements" value={formatCurrency(dashboard.totals.investments)} icon={ArrowLeftRight} variant="invest" />
        </div>

        <div
          className="rounded-xl p-5 flex items-center justify-between"
          style={{ background: "var(--gradient-primary)" }}
        >
          <div>
            <p className="text-sm font-medium opacity-80" style={{ color: "hsl(var(--primary-foreground))" }}>Solde net disponible</p>
            <p className="text-3xl font-display font-bold mt-1" style={{ color: "hsl(var(--primary-foreground))" }}>
              {formatCurrency(dashboard.totals.balance)}
            </p>
          </div>
          <div className="text-right">
            <Wallet size={40} style={{ color: "hsl(var(--primary-foreground) / 0.3)" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="stat-card lg:col-span-2">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenus vs Depenses</p>
            <ResponsiveContainer width="100%" height={220}>
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
                <YAxis tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenus" name="Revenus" stroke="hsl(158,64%,52%)" fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="depenses" name="Depenses" stroke="hsl(351,75%,58%)" fill="url(#colorDep)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Depenses par categorie</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dashboard.expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {dashboard.expensesByCategory.map((entry, index) => (
                    <Cell key={entry.id} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {dashboard.expensesByCategory.slice(0, 4).map((cat, i) => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color || CHART_COLORS[i] }} />
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{cat.icon || ""} {cat.name}</span>
                  </div>
                  <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Transactions recentes</p>
            <div className="space-y-2">
              {dashboard.recentTransactions.map((tx) => {
                const isIncome = tx.kind === "income";
                return (
                  <div key={`${tx.kind}-${tx.id}`} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: isIncome ? "hsl(var(--primary-dim))" : "hsl(var(--destructive-dim))" }}
                      >
                        {tx.categoryIcon || (isIncome ? "??" : "??")}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{tx.description || (isIncome ? "Revenu" : "Depense")}</p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {formatDate(tx.date)} · {tx.activityName || tx.categoryName || "—"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: isIncome ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                      {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="stat-card">
              <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>Prets actifs</p>
              <div className="space-y-3">
                {dashboard.activeLoans.map((loan) => {
                  const pct = loan.totalAmount > 0 ? Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100) : 0;
                  return (
                    <div key={loan.id}>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{loan.lenderName}</p>
                        <p className="text-sm" style={{ color: "hsl(var(--warning))" }}>{formatCurrency(loan.remainingAmount)}</p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-warning)" }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{pct}% rembourse</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="stat-card">
              <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>Activites</p>
              <div className="space-y-2">
                {dashboard.activities.map((act) => (
                  <div key={act.activityId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ActivityIcon size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                      <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{act.name}</p>
                      <span className={ACTIVITY_TYPE_COLORS[act.type] || "badge-income"}>{ACTIVITY_TYPE_LABELS[act.type] || act.type}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "hsl(var(--primary))" }}>{formatCurrency(act.income)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

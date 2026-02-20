import {
  TrendingUp, TrendingDown, CreditCard, ArrowLeftRight,
  Wallet, Activity as ActivityIcon,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import Header from "@/components/layout/Header";
import {
  formatCurrency, totalIncome, totalExpenses, totalLoans,
  totalInvestments, balance, monthlyData, expensesByCategory,
  incomes, expenses, activities, loans, getActivityById, getCategoryById, formatDate,
} from "@/data/staticData";

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

export default function Dashboard() {
  const recentTransactions = [
    ...incomes.slice(-4).map((i) => ({ ...i, kind: "income" as const })),
    ...expenses.slice(-4).map((e) => ({ ...e, kind: "expense" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");

  return (
    <div className="animate-fade-in">
      <Header
        title="Tableau de bord"
        subtitle={`Bonjour, Alexandre 👋 — Vue d'ensemble de vos finances`}
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenus totaux" value={formatCurrency(totalIncome)} icon={TrendingUp} variant="income" trend={8} trendLabel="vs mois dernier" />
          <StatCard label="Dépenses totales" value={formatCurrency(totalExpenses)} icon={TrendingDown} variant="expense" trend={-3} trendLabel="vs mois dernier" />
          <StatCard label="Prêts en cours" value={formatCurrency(totalLoans)} icon={CreditCard} variant="loan" trendLabel="2 prêts actifs" />
          <StatCard label="Investissements" value={formatCurrency(totalInvestments)} icon={ArrowLeftRight} variant="invest" trend={12} trendLabel="entre activités" />
        </div>

        {/* Balance banner */}
        <div
          className="rounded-xl p-5 flex items-center justify-between"
          style={{ background: "var(--gradient-primary)" }}
        >
          <div>
            <p className="text-sm font-medium opacity-80" style={{ color: "hsl(var(--primary-foreground))" }}>Solde net disponible</p>
            <p className="text-3xl font-display font-bold mt-1" style={{ color: "hsl(var(--primary-foreground))" }}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="text-right">
            <Wallet size={40} style={{ color: "hsl(var(--primary-foreground) / 0.3)" }} />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Area chart */}
          <div className="stat-card lg:col-span-2">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenus vs Dépenses</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
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
                <Area type="monotone" dataKey="dépenses" name="Dépenses" stroke="hsl(351,75%,58%)" fill="url(#colorDep)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Dépenses par catégorie</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {expensesByCategory.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color || CHART_COLORS[i] }} />
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{cat.icon} {cat.name}</span>
                  </div>
                  <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent transactions */}
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Transactions récentes</p>
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const isIncome = tx.kind === "income";
                const activityIncome = isIncome ? getActivityById((tx as any).activityId || "") : null;
                const cat = !isIncome ? getCategoryById((tx as any).categoryId || "") : null;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: isIncome ? "hsl(var(--primary-dim))" : "hsl(var(--destructive-dim))" }}
                      >
                        {cat?.icon || (isIncome ? "💰" : "💸")}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{tx.description}</p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {formatDate(tx.date)} · {activityIncome?.name || cat?.name || "—"}
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

          {/* Active loans summary + activities */}
          <div className="space-y-4">
            <div className="stat-card">
              <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>Prêts actifs</p>
              <div className="space-y-3">
                {activeLoans.map((loan) => {
                  const pct = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100);
                  return (
                    <div key={loan.id}>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{loan.lenderName}</p>
                        <p className="text-sm" style={{ color: "hsl(var(--warning))" }}>{formatCurrency(loan.remainingAmount)}</p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-warning)" }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{pct}% remboursé</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="stat-card">
              <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>Activités</p>
              <div className="space-y-2">
                {activities.map((act) => {
                  const actIncome = incomes.filter((i) => i.activityId === act.id).reduce((s, i) => s + i.amount, 0);
                  const typeColors: Record<string, string> = {
                    SALARY: "badge-income", BUSINESS: "badge-purple",
                    FREELANCE: "badge-info", OTHER: "badge-warning",
                  };
                  const typeLabels: Record<string, string> = {
                    SALARY: "Salaire", BUSINESS: "Business", FREELANCE: "Freelance", OTHER: "Autre",
                  };
                  return (
                    <div key={act.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ActivityIcon size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                        <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{act.name}</p>
                        <span className={typeColors[act.type]}>{typeLabels[act.type]}</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: "hsl(var(--primary))" }}>{formatCurrency(actIncome)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

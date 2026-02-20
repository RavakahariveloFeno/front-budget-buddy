import { Plus, PiggyBank, Calendar, AlertCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import { budgets, expenses, formatCurrency, formatDate } from "@/data/staticData";

const periodLabels: Record<string, string> = { DAY: "Jour", WEEK: "Semaine", MONTH: "Mois" };
const periodGradients: Record<string, string> = {
  DAY: "var(--gradient-primary)",
  WEEK: "var(--gradient-warning)",
  MONTH: "var(--gradient-purple)",
};
const periodColors: Record<string, string> = {
  DAY: "hsl(var(--primary))",
  WEEK: "hsl(var(--warning))",
  MONTH: "hsl(var(--purple))",
};
const periodDim: Record<string, string> = {
  DAY: "hsl(var(--primary-dim))",
  WEEK: "hsl(var(--warning-dim))",
  MONTH: "hsl(var(--purple-dim))",
};

function getSpentForPeriod(period: string): number {
  const now = new Date();
  return expenses.filter((e) => {
    const d = new Date(e.date);
    if (period === "DAY") return d.toDateString() === now.toDateString();
    if (period === "WEEK") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return d >= startOfWeek;
    }
    if (period === "MONTH") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return false;
  }).reduce((s, e) => s + e.amount, 0);
}

export default function Budgets() {
  return (
    <div className="animate-fade-in">
      <Header title="Budgets" subtitle="Définissez et suivez vos limites de dépenses" />
      <div className="p-6 space-y-6">
        {/* Action bar */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouveau budget
          </button>
        </div>

        {/* Budget cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const spent = getSpentForPeriod(budget.period);
            const pct = Math.min(100, Math.round((spent / budget.amount) * 100));
            const isOver = spent > budget.amount;
            const remaining = budget.amount - spent;

            return (
              <div key={budget.id} className="stat-card">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isOver ? "hsl(var(--destructive-dim))" : periodDim[budget.period] }}
                  >
                    <PiggyBank size={18} style={{ color: isOver ? "hsl(var(--destructive))" : periodColors[budget.period] }} />
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: periodDim[budget.period], color: periodColors[budget.period] }}
                  >
                    Par {periodLabels[budget.period]}
                  </span>
                </div>

                <p className="text-2xl font-display font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                  {formatCurrency(budget.amount)}
                </p>
                <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Budget alloué</p>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full mb-2 overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: isOver ? "var(--gradient-danger)" : periodGradients[budget.period],
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    Dépensé: <strong style={{ color: isOver ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}>{formatCurrency(spent)}</strong>
                  </span>
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{pct}%</span>
                </div>

                {/* Status */}
                <div
                  className="flex items-center gap-1.5 mt-3 pt-3 border-t"
                  style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                >
                  {isOver ? (
                    <>
                      <AlertCircle size={13} style={{ color: "hsl(var(--destructive))" }} />
                      <span className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
                        Dépassé de {formatCurrency(Math.abs(remaining))}
                      </span>
                    </>
                  ) : (
                    <>
                      <PiggyBank size={13} style={{ color: "hsl(var(--primary))" }} />
                      <span className="text-xs" style={{ color: "hsl(var(--primary))" }}>
                        Reste {formatCurrency(remaining)}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-2">
                  <Calendar size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Depuis {formatDate(budget.startDate)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="stat-card" style={{ borderColor: "hsl(var(--info-dim))", background: "linear-gradient(145deg, hsl(217,30%,10%), hsl(217,20%,8%))" }}>
          <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--info))" }}>💡 Conseils budget</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: "🎯", title: "Règle 50/30/20", desc: "50% besoins, 30% envies, 20% épargne" },
              { icon: "📊", title: "Suivez vos écarts", desc: "Analysez les dépassements chaque semaine" },
              { icon: "🔔", title: "Alertes préventives", desc: "Soyez alerté à 80% du budget consommé" },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-3">
                <span className="text-xl">{tip.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{tip.title}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

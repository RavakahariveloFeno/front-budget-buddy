import { Briefcase, Plus, Calendar } from "lucide-react";
import Header from "@/components/layout/Header";
import { activities, investments, incomes, expenses, getActivityById, formatCurrency, formatDate } from "@/data/staticData";

const typeColors: Record<string, string> = {
  SALARY: "badge-income", BUSINESS: "badge-purple", FREELANCE: "badge-info", OTHER: "badge-warning",
};
const typeLabels: Record<string, string> = {
  SALARY: "Salaire", BUSINESS: "Business", FREELANCE: "Freelance", OTHER: "Autre",
};
const typeGradients: Record<string, string> = {
  SALARY: "var(--gradient-primary)",
  BUSINESS: "var(--gradient-purple)",
  FREELANCE: "linear-gradient(135deg, hsl(217,91%,60%), hsl(186,74%,56%))",
  OTHER: "var(--gradient-warning)",
};

export default function Activities() {
  return (
    <div className="animate-fade-in">
      <Header title="Activités" subtitle="Sources de revenus et activités financières" />
      <div className="p-6 space-y-6">
        {/* Action bar */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouvelle activité
          </button>
        </div>

        {/* Activity cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((act) => {
            const actIncome = incomes.filter((i) => i.activityId === act.id).reduce((s, i) => s + i.amount, 0);
            const actExpenses = expenses.filter((e) => e.activityId === act.id).reduce((s, e) => s + e.amount, 0);
            const sentInv = investments.filter((i) => i.fromActivityId === act.id).reduce((s, i) => s + i.amount, 0);
            const recvInv = investments.filter((i) => i.toActivityId === act.id).reduce((s, i) => s + i.amount, 0);

            return (
              <div key={act.id} className="stat-card hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: typeGradients[act.type] }}
                    >
                      <Briefcase size={18} style={{ color: "hsl(var(--primary-foreground))" }} />
                    </div>
                    <div>
                      <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>{act.name}</p>
                      {act.description && <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{act.description}</p>}
                    </div>
                  </div>
                  <span className={typeColors[act.type]}>{typeLabels[act.type]}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--primary-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Revenus</p>
                    <p className="font-semibold" style={{ color: "hsl(var(--primary))" }}>{formatCurrency(actIncome)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Dépenses</p>
                    <p className="font-semibold" style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(actExpenses)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--purple-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Invest. envoyés</p>
                    <p className="font-semibold" style={{ color: "hsl(var(--purple))" }}>{formatCurrency(sentInv)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--info-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Invest. reçus</p>
                    <p className="font-semibold" style={{ color: "hsl(var(--info))" }}>{formatCurrency(recvInv)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                  <Calendar size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Depuis le {formatDate(act.startDate)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Investments table */}
        <div className="stat-card">
          <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Transferts entre activités</p>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">De</th>
                  <th className="text-left">Vers</th>
                  <th className="text-right">Montant</th>
                  <th className="text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const from = getActivityById(inv.fromActivityId);
                  const to = getActivityById(inv.toActivityId);
                  return (
                    <tr key={inv.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(inv.date)}</td>
                      <td>
                        <span className="badge-income">{from?.name}</span>
                      </td>
                      <td>
                        <span className="badge-purple">{to?.name}</span>
                      </td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--purple))" }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{inv.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

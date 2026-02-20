import { Plus, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/layout/Header";
import { incomes, getActivityById, formatCurrency, formatDate, totalIncome, monthlyData } from "@/data/staticData";

const CustomTooltipStyle = {
  contentStyle: {
    background: "hsl(225, 27%, 12%)",
    border: "1px solid hsl(224, 22%, 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(213, 31%, 93%)",
  },
};

export default function Incomes() {
  const cashTotal = incomes.filter((i) => i.paymentType === "CASH").reduce((s, i) => s + i.amount, 0);
  const cardTotal = incomes.filter((i) => i.paymentType === "CARD").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Revenus" subtitle="Suivi de tous vos revenus" />
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total revenus", value: formatCurrency(totalIncome), color: "hsl(var(--primary))", bg: "hsl(var(--primary-dim))" },
            { label: "Paiements carte", value: formatCurrency(cardTotal), color: "hsl(var(--info))", bg: "hsl(var(--info-dim))" },
            { label: "Paiements cash", value: formatCurrency(cashTotal), color: "hsl(var(--warning))", bg: "hsl(var(--warning-dim))" },
          ].map((s) => (
            <div key={s.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <TrendingUp size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="stat-card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Revenus mensuels</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,22%,18%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenus" name="Revenus" fill="hsl(158,64%,52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By payment type */}
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Par mode de paiement</p>
            <div className="space-y-4">
              {[
                { label: "Virement / Carte", value: cardTotal, pct: Math.round((cardTotal / totalIncome) * 100), color: "hsl(var(--info))", bg: "hsl(var(--info-dim))" },
                { label: "Espèces", value: cashTotal, pct: Math.round((cashTotal / totalIncome) * 100), color: "hsl(var(--warning))", bg: "hsl(var(--warning-dim))" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between mb-1.5">
                    <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{p.label}</p>
                    <p className="text-sm font-medium" style={{ color: p.color }}>{p.pct}%</p>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "hsl(var(--border))" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{formatCurrency(p.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Tous les revenus <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>({incomes.length})</span>
            </p>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
            >
              <Plus size={13} /> Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Activité</th>
                  <th className="text-left">Paiement</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {[...incomes].reverse().map((inc) => {
                  const act = getActivityById(inc.activityId || "");
                  return (
                    <tr key={inc.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(inc.date)}</td>
                      <td style={{ color: "hsl(var(--foreground))" }}>{inc.description || "—"}</td>
                      <td>{act ? <span className="badge-income">{act.name}</span> : "—"}</td>
                      <td>
                        <span className={inc.paymentType === "CARD" ? "badge-info" : "badge-warning"}>
                          {inc.paymentType === "CARD" ? "💳 Carte" : "💵 Cash"}
                        </span>
                      </td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--primary))" }}>
                        +{formatCurrency(inc.amount)}
                      </td>
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

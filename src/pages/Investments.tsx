import { Plus, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/layout/Header";
import { investments, activities, getActivityById, formatCurrency, formatDate, totalInvestments } from "@/data/staticData";

const CustomTooltipStyle = {
  contentStyle: {
    background: "hsl(225, 27%, 12%)",
    border: "1px solid hsl(224, 22%, 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(213, 31%, 93%)",
  },
};

export default function Investments() {
  // Per-activity investment chart data
  const activityData = activities.map((act) => ({
    name: act.name.split(" ")[0],
    envoyé: investments.filter((i) => i.fromActivityId === act.id).reduce((s, i) => s + i.amount, 0),
    reçu: investments.filter((i) => i.toActivityId === act.id).reduce((s, i) => s + i.amount, 0),
  }));

  return (
    <div className="animate-fade-in">
      <Header title="Investissements" subtitle="Transferts de capital entre activités" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total investi", value: formatCurrency(totalInvestments), color: "hsl(var(--purple))", bg: "hsl(var(--purple-dim))" },
            { label: "Nombre de transferts", value: `${investments.length}`, color: "hsl(var(--info))", bg: "hsl(var(--info-dim))" },
            { label: "Activités impliquées", value: `${activities.length}`, color: "hsl(var(--primary))", bg: "hsl(var(--primary-dim))" },
          ].map((s) => (
            <div key={s.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <ArrowRight size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-purple)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouveau transfert
          </button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Flux par activité</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,22%,18%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="envoyé" name="Envoyé" fill="hsl(351,75%,58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reçu" name="Reçu" fill="hsl(263,70%,62%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity balance */}
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Balance par activité</p>
            <div className="space-y-3">
              {activities.map((act) => {
                const sent = investments.filter((i) => i.fromActivityId === act.id).reduce((s, i) => s + i.amount, 0);
                const recv = investments.filter((i) => i.toActivityId === act.id).reduce((s, i) => s + i.amount, 0);
                const balance = recv - sent;
                return (
                  <div key={act.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{act.name}</p>
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Envoyé: {formatCurrency(sent)} · Reçu: {formatCurrency(recv)}
                      </p>
                    </div>
                    <span
                      className="font-semibold text-sm"
                      style={{ color: balance >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}
                    >
                      {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transactions table */}
        <div className="stat-card">
          <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            Tous les transferts <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>({investments.length})</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Source</th>
                  <th className="text-center">→</th>
                  <th className="text-left">Destination</th>
                  <th className="text-left">Note</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {[...investments].reverse().map((inv) => {
                  const from = getActivityById(inv.fromActivityId);
                  const to = getActivityById(inv.toActivityId);
                  return (
                    <tr key={inv.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(inv.date)}</td>
                      <td>
                        <span className="badge-expense">{from?.name}</span>
                      </td>
                      <td className="text-center">
                        <ArrowRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} className="mx-auto" />
                      </td>
                      <td>
                        <span className="badge-purple">{to?.name}</span>
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{inv.note || "—"}</td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--purple))" }}>
                        {formatCurrency(inv.amount)}
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

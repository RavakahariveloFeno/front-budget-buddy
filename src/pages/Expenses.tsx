import { Plus, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/layout/Header";
import { expenses, getCategoryById, getActivityById, formatCurrency, formatDate, totalExpenses, expensesByCategory } from "@/data/staticData";

const CustomTooltipStyle = {
  contentStyle: {
    background: "hsl(225, 27%, 12%)",
    border: "1px solid hsl(224, 22%, 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(213, 31%, 93%)",
  },
};

export default function Expenses() {
  const maxCat = expensesByCategory.reduce((max, c) => (c.value > max.value ? c : max), expensesByCategory[0]);

  return (
    <div className="animate-fade-in">
      <Header title="Dépenses" subtitle="Suivi et analyse de vos dépenses" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total dépenses", value: formatCurrency(totalExpenses), color: "hsl(var(--destructive))", bg: "hsl(var(--destructive-dim))" },
            { label: "Catégorie principale", value: maxCat.icon + " " + maxCat.name, color: "hsl(var(--warning))", bg: "hsl(var(--warning-dim))" },
            { label: "Nombre transactions", value: expenses.length.toString(), color: "hsl(var(--info))", bg: "hsl(var(--info-dim))" },
          ].map((s) => (
            <div key={s.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <TrendingDown size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pie chart */}
          <div className="stat-card">
            <p className="font-display font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>Par catégorie</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={expensesByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color || "#8b5cf6"} />
                  ))}
                </Pie>
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {expensesByCategory.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color || "#8b5cf6" }} />
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{cat.icon} {cat.name}</span>
                  </div>
                  <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="stat-card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Toutes les dépenses <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>({expenses.length})</span>
              </p>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--gradient-danger)", color: "hsl(var(--destructive-foreground))" }}
              >
                <Plus size={13} /> Ajouter
              </button>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full data-table">
                <thead className="sticky top-0" style={{ background: "hsl(var(--card))" }}>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Description</th>
                    <th className="text-left">Catégorie</th>
                    <th className="text-left">Activité</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expenses].reverse().map((exp) => {
                    const cat = getCategoryById(exp.categoryId || "");
                    const act = getActivityById(exp.activityId || "");
                    return (
                      <tr key={exp.id}>
                        <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(exp.date)}</td>
                        <td style={{ color: "hsl(var(--foreground))" }}>{exp.description || "—"}</td>
                        <td>
                          {cat ? (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ background: cat.color + "30", color: cat.color }}
                            >
                              {cat.icon} {cat.name}
                            </span>
                          ) : "—"}
                        </td>
                        <td>{act ? <span className="badge-info text-xs">{act.name}</span> : "—"}</td>
                        <td className="text-right font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                          -{formatCurrency(exp.amount)}
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
    </div>
  );
}

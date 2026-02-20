import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { categories, expenses, formatCurrency } from "@/data/staticData";

export default function Categories() {
  return (
    <div className="animate-fade-in">
      <Header title="Catégories" subtitle="Gérez vos catégories de dépenses" />
      <div className="p-6 space-y-6">
        {/* Action bar */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouvelle catégorie
          </button>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
            const total = catExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div
                key={cat.id}
                className="stat-card group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: (cat.color || "#8b5cf6") + "25" }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                      <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                    </button>
                  </div>
                </div>
                <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>{cat.name}</p>
                <p className="text-xl font-bold mt-1" style={{ color: cat.color || "hsl(var(--primary))" }}>
                  {formatCurrency(total)}
                </p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {catExpenses.length} transaction{catExpenses.length > 1 ? "s" : ""}
                </p>

                {/* Color bar */}
                <div className="mt-3 h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: cat.color || "hsl(var(--primary))",
                      width: `${Math.min(100, (total / 900) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="stat-card">
          <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Vue d'ensemble</p>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Catégorie</th>
                  <th className="text-left">Icône</th>
                  <th className="text-left">Couleur</th>
                  <th className="text-right">Nb dépenses</th>
                  <th className="text-right">Total dépensé</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const catTotal = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
                  const count = expenses.filter((e) => e.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Tag size={14} style={{ color: cat.color || "hsl(var(--primary))" }} />
                          <span style={{ color: "hsl(var(--foreground))" }}>{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{cat.icon || "—"}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ background: cat.color || "#ccc" }} />
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{cat.color || "—"}</span>
                        </div>
                      </td>
                      <td className="text-right" style={{ color: "hsl(var(--muted-foreground))" }}>{count}</td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                        {formatCurrency(catTotal)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                            <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
                            <Trash2 size={12} style={{ color: "hsl(var(--destructive))" }} />
                          </button>
                        </div>
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

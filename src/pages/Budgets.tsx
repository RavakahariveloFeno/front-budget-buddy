import { useEffect, useState } from "react";
import { Plus, PiggyBank, Calendar, AlertCircle, Pencil, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Budget } from "@/data/staticData";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  getBudgetStatistics,
  updateBudget,
} from "@/api/budgetApi";
import type { BudgetPayload, BudgetStatistics } from "@/api/budgetApi";
import BudgetForm from "@/components/forms/BudgetForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";

const periodLabels: Record<string, string> = { DAY: "Jour", WEEK: "Semaine", MONTH: "Mois" };
const periodGradients: Record<string, string> = { DAY: "var(--gradient-primary)", WEEK: "var(--gradient-warning)", MONTH: "var(--gradient-purple)" };
const periodColors: Record<string, string> = { DAY: "hsl(var(--primary))", WEEK: "hsl(var(--warning))", MONTH: "hsl(var(--purple))" };
const periodDim: Record<string, string> = { DAY: "hsl(var(--primary-dim))", WEEK: "hsl(var(--warning-dim))", MONTH: "hsl(var(--purple-dim))" };

const EMPTY_BUDGET_STATS: BudgetStatistics = {
  spentByPeriod: {
    DAY: 0,
    WEEK: 0,
    MONTH: 0,
  },
};

export default function Budgets() {
  const [budgetList, setBudgetList] = useState<Budget[]>([]);
  const [budgetStats, setBudgetStats] = useState<BudgetStatistics>(EMPTY_BUDGET_STATS);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Budget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const refreshBudgetStats = async () => {
    try {
      const stats = await getBudgetStatistics();
      setBudgetStats(stats);
    } catch (error) {
      console.error("Impossible de charger les statistiques budget depuis l'API.", error);
      setBudgetStats(EMPTY_BUDGET_STATS);
    }
  };

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const remoteBudgets = await getBudgets();
        setBudgetList(remoteBudgets);
      } catch (error) {
        console.error("Impossible de charger les budgets depuis l'API.", error);
        setBudgetList([]);
      }
    };

    loadBudgets();
    refreshBudgetStats();
  }, []);

  const handleEdit = (budget: Budget) => {
    setEditItem(budget);
    setFormOpen(true);
  };
  const handleDelete = (budget: Budget) => {
    setDeleteTarget(budget);
    setDeleteOpen(true);
  };

  const handleCreate = async (payload: BudgetPayload) => {
    const created = await createBudget(payload);
    setBudgetList((prev) => [created, ...prev]);
    await refreshBudgetStats();
    toast({ title: "Budget ajoute", description: formatCurrency(created.amount) });
  };

  const handleUpdate = async (id: string, payload: BudgetPayload) => {
    const updated = await updateBudget(id, payload);
    setBudgetList((prev) => prev.map((budget) => (budget.id === id ? updated : budget)));
    await refreshBudgetStats();
    toast({ title: "Budget modifie", description: formatCurrency(updated.amount) });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteBudget(deleteTarget.id);
      setBudgetList((prev) => prev.filter((budget) => budget.id !== deleteTarget.id));
      await refreshBudgetStats();
      toast({ title: "Budget supprime" });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer le budget.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Budgets" subtitle="Definissez et suivez vos limites de depenses" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouveau budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgetList.map((budget) => {
            const spent = budgetStats.spentByPeriod[budget.period] ?? 0;
            const pct = budget.amount > 0 ? Math.min(100, Math.round((spent / budget.amount) * 100)) : 0;
            const isOver = spent > budget.amount;
            const remaining = budget.amount - spent;

            return (
              <div key={budget.id} className="stat-card group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isOver ? "hsl(var(--destructive-dim))" : periodDim[budget.period] }}>
                    <PiggyBank size={18} style={{ color: isOver ? "hsl(var(--destructive))" : periodColors[budget.period] }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: periodDim[budget.period], color: periodColors[budget.period] }}>
                      Par {periodLabels[budget.period]}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(budget)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                        <Pencil size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </button>
                      <button onClick={() => handleDelete(budget)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
                        <Trash2 size={11} style={{ color: "hsl(var(--destructive))" }} />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-2xl font-display font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
                  {formatCurrency(budget.amount)}
                </p>
                <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Budget alloue
                </p>

                <div className="h-2.5 rounded-full mb-2 overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: isOver ? "var(--gradient-danger)" : periodGradients[budget.period] }} />
                </div>

                <div className="flex justify-between text-xs">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    Depense: <strong style={{ color: isOver ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}>{formatCurrency(spent)}</strong>
                  </span>
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{pct}%</span>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                  {isOver ? (
                    <>
                      <AlertCircle size={13} style={{ color: "hsl(var(--destructive))" }} />
                      <span className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
                        Depasse de {formatCurrency(Math.abs(remaining))}
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
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Depuis {formatDate(budget.startDate)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="stat-card" style={{ borderColor: "hsl(var(--info-dim))", background: "linear-gradient(145deg, hsl(217,30%,10%), hsl(217,20%,8%))" }}>
          <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--info))" }}>
            Conseils budget
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: "??", title: "Regle 50/30/20", desc: "50% besoins, 30% envies, 20% epargne" },
              { icon: "??", title: "Suivez vos ecarts", desc: "Analysez les depassements chaque semaine" },
              { icon: "??", title: "Alertes preventives", desc: "Soyez alerte a 80% du budget consomme" },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-3">
                <span className="text-xl">{tip.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {tip.title}
                  </p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BudgetForm open={formOpen} onOpenChange={setFormOpen} budget={editItem} onCreate={handleCreate} onUpdate={handleUpdate} />
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Supprimer le budget" description="Voulez-vous vraiment supprimer ce budget ?" onConfirm={confirmDelete} />
    </div>
  );
}

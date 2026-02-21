import { useEffect, useMemo, useState } from "react";
import { Plus, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Activity, Category, Expense } from "@/data/staticData";
import { getActivities } from "@/api/activityApi";
import { getCategories } from "@/api/categoryApi";
import {
  createRecurringExpense,
  createExpense,
  deleteRecurringExpense,
  deleteExpense,
  getExpenseStatistics,
  getRecurringExpenses,
  getExpenses,
  updateRecurringExpense,
  updateExpense,
} from "@/api/expenseApi";
import type { ExpensePayload, ExpenseStatistics, RecurringExpense, RecurringExpensePayload } from "@/api/expenseApi";
import ExpenseForm from "@/components/forms/ExpenseForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CustomTooltipStyle = {
  contentStyle: { background: "hsl(225, 27%, 12%)", border: "1px solid hsl(224, 22%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(213, 31%, 93%)" },
};

const EMPTY_EXPENSE_STATS: ExpenseStatistics = {
  totalExpenses: 0,
  transactionCount: 0,
  topCategory: null,
  expensesByCategory: [],
};

export default function Expenses() {
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [expenseStats, setExpenseStats] = useState<ExpenseStatistics>(EMPTY_EXPENSE_STATS);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [recurringList, setRecurringList] = useState<RecurringExpense[]>([]);
  const [recurringEditOpen, setRecurringEditOpen] = useState(false);
  const [recurringEditItem, setRecurringEditItem] = useState<RecurringExpense | null>(null);
  const [recurringDeleteOpen, setRecurringDeleteOpen] = useState(false);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<RecurringExpense | null>(null);
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringDescription, setRecurringDescription] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringFrequency, setRecurringFrequency] = useState<"DAY" | "WEEK" | "MONTH">("MONTH");
  const [recurringCategoryId, setRecurringCategoryId] = useState("none");
  const [recurringActivityId, setRecurringActivityId] = useState("none");
  const [recurringActive, setRecurringActive] = useState(true);
  const [isRecurringSubmitting, setIsRecurringSubmitting] = useState(false);

  const loadExpenses = async () => {
    try {
      const remoteExpenses = await getExpenses();
      setExpenseList(remoteExpenses);
    } catch (error) {
      console.error("Impossible de charger les depenses depuis l'API.", error);
      setExpenseList([]);
    }
  };

  const loadRecurringExpenses = async () => {
    try {
      const data = await getRecurringExpenses();
      setRecurringList(data);
    } catch (error) {
      console.error("Impossible de charger les depenses automatiques.", error);
      setRecurringList([]);
    }
  };

  const refreshExpenseStats = async () => {
    try {
      const stats = await getExpenseStatistics();
      setExpenseStats(stats);
    } catch (error) {
      console.error("Impossible de charger les statistiques depenses depuis l'API.", error);
      setExpenseStats(EMPTY_EXPENSE_STATS);
    }
  };

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const remoteActivities = await getActivities();
        setActivityList(remoteActivities);
      } catch (error) {
        console.error("Impossible de charger les activites depuis l'API.", error);
        setActivityList([]);
      }
    };

    const loadCategories = async () => {
      try {
        const remoteCategories = await getCategories();
        setCategoryList(remoteCategories);
      } catch (error) {
        console.error("Impossible de charger les categories depuis l'API.", error);
        setCategoryList([]);
      }
    };

    loadExpenses();
    loadRecurringExpenses();
    loadActivities();
    loadCategories();
    refreshExpenseStats();
  }, []);

  const maxCatLabel = expenseStats.topCategory
    ? `${expenseStats.topCategory.icon ? `${expenseStats.topCategory.icon} ` : ""}${expenseStats.topCategory.name}`
    : "-";

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categoryList) {
      map.set(category.id, category);
    }
    return map;
  }, [categoryList]);

  const activityById = useMemo(() => {
    const map = new Map<string, Activity>();
    for (const activity of activityList) {
      map.set(activity.id, activity);
    }
    return map;
  }, [activityList]);

  const handleEdit = (expense: Expense) => {
    setEditItem(expense);
    setFormOpen(true);
  };
  const handleDelete = (expense: Expense) => {
    setDeleteTarget(expense);
    setDeleteOpen(true);
  };

  const handleCreate = async (payload: ExpensePayload) => {
    const created = await createExpense(payload);
    setExpenseList((prev) => [created, ...prev]);
    await refreshExpenseStats();
    toast({ title: "Depense ajoutee", description: `-${formatCurrency(created.amount)}` });
  };

  const handleCreateRecurring = async (payload: RecurringExpensePayload) => {
    const result = await createRecurringExpense(payload);
    await loadExpenses();
    await loadRecurringExpenses();
    await refreshExpenseStats();
    toast({
      title: "Depense automatique ajoutee",
      description: `${result.createdOccurrences} occurrence(s) generee(s).`,
    });
  };

  const handleUpdate = async (id: string, payload: ExpensePayload) => {
    const updated = await updateExpense(id, payload);
    setExpenseList((prev) => prev.map((expense) => (expense.id === id ? updated : expense)));
    await refreshExpenseStats();
    toast({ title: "Depense modifiee", description: `-${formatCurrency(updated.amount)}` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteExpense(deleteTarget.id);
      setExpenseList((prev) => prev.filter((expense) => expense.id !== deleteTarget.id));
      await refreshExpenseStats();
      toast({ title: "Depense supprimee" });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer la depense.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  const frequencyOptions = [
    { value: "DAY", label: "Chaque jour" },
    { value: "WEEK", label: "Chaque semaine" },
    { value: "MONTH", label: "Chaque mois" },
  ];

  const handleEditRecurring = (item: RecurringExpense) => {
    setRecurringEditItem(item);
    setRecurringAmount(String(item.amount));
    setRecurringDescription(item.description || "");
    setRecurringStartDate(item.startDate.split("T")[0]);
    setRecurringEndDate(item.endDate ? item.endDate.split("T")[0] : "");
    setRecurringFrequency(item.frequency);
    setRecurringCategoryId(item.categoryId || "none");
    setRecurringActivityId(item.activityId || "none");
    setRecurringActive(item.isActive);
    setRecurringEditOpen(true);
  };

  const submitRecurringUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recurringEditItem) return;
    const amount = Number(recurringAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }
    if (recurringEndDate && recurringEndDate < recurringStartDate) {
      toast({ title: "Date invalide", description: "La date de fin doit etre apres la date de debut." });
      return;
    }

    try {
      setIsRecurringSubmitting(true);
      await updateRecurringExpense(recurringEditItem.id, {
        amount,
        description: recurringDescription.trim() || undefined,
        startDate: recurringStartDate,
        endDate: recurringEndDate || undefined,
        frequency: recurringFrequency,
        categoryId: recurringCategoryId === "none" ? undefined : recurringCategoryId,
        activityId: recurringActivityId === "none" ? undefined : recurringActivityId,
        isActive: recurringActive,
      });
      await loadRecurringExpenses();
      await loadExpenses();
      await refreshExpenseStats();
      setRecurringEditOpen(false);
      toast({ title: "Depense automatique modifiee" });
    } catch (error) {
      console.error("Impossible de modifier la depense automatique.", error);
      toast({ title: "Erreur", description: "Modification impossible pour le moment." });
    } finally {
      setIsRecurringSubmitting(false);
    }
  };

  const confirmDeleteRecurring = async () => {
    if (!recurringDeleteTarget) return;
    try {
      await deleteRecurringExpense(recurringDeleteTarget.id);
      await loadRecurringExpenses();
      toast({ title: "Depense automatique supprimee" });
      setRecurringDeleteOpen(false);
      setRecurringDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer la depense automatique.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Depenses" subtitle="Suivi et analyse de vos depenses" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total depenses", value: formatCurrency(expenseStats.totalExpenses), color: "hsl(var(--destructive))", bg: "hsl(var(--destructive-dim))" },
            { label: "Categorie principale", value: maxCatLabel, color: "hsl(var(--warning))", bg: "hsl(var(--warning-dim))" },
            { label: "Nombre transactions", value: expenseStats.transactionCount.toString(), color: "hsl(var(--info))", bg: "hsl(var(--info-dim))" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <TrendingDown size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-display font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="font-display font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Par categorie
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={expenseStats.expensesByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                  {expenseStats.expensesByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color || "#8b5cf6"} />
                  ))}
                </Pie>
                <Tooltip {...CustomTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {expenseStats.expensesByCategory.map((category) => (
                <div key={category.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: category.color || "#8b5cf6" }} />
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </span>
                  </div>
                  <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Toutes les depenses{" "}
                <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  ({expenseList.length})
                </span>
              </p>
              <button
                onClick={() => {
                  setEditItem(null);
                  setFormOpen(true);
                }}
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
                    <th className="text-left">Categorie</th>
                    <th className="text-left">Activite</th>
                    <th className="text-left">Type</th>
                    <th className="text-right">Montant</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expenseList].reverse().map((expense) => {
                    const category = expense.categoryId ? categoryById.get(expense.categoryId) : undefined;
                    const activity = expense.activityId ? activityById.get(expense.activityId) : undefined;
                    return (
                      <tr key={expense.id}>
                        <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(expense.date)}</td>
                        <td style={{ color: "hsl(var(--foreground))" }}>{expense.description || "-"}</td>
                        <td>
                          {category ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: (category.color || "#8b5cf6") + "30", color: category.color || "#8b5cf6" }}>
                              {category.icon} {category.name}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{activity ? <span className="badge-info text-xs">{activity.name}</span> : "-"}</td>
                        <td>
                          <span className={expense.recurringExpenseId ? "badge-warning text-xs" : "badge-info text-xs"}>
                            {expense.recurringExpenseId ? "Automatique" : "Manuel"}
                          </span>
                        </td>
                        <td className="text-right font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                          -{formatCurrency(expense.amount)}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(expense)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                              <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </button>
                            <button onClick={() => handleDelete(expense)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
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

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Depenses automatiques{" "}
              <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                ({recurringList.length})
              </span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Debut</th>
                  <th className="text-left">Frequence</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Activite</th>
                  <th className="text-left">Statut</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringList.map((item) => {
                  const activity = item.activityId ? activityById.get(item.activityId) : undefined;
                  return (
                    <tr key={item.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(item.startDate)}</td>
                      <td style={{ color: "hsl(var(--foreground))" }}>{item.frequency === "DAY" ? "Jour" : item.frequency === "WEEK" ? "Semaine" : "Mois"}</td>
                      <td style={{ color: "hsl(var(--foreground))" }}>{item.description || "-"}</td>
                      <td>{activity ? <span className="badge-info text-xs">{activity.name}</span> : "-"}</td>
                      <td>
                        <span className={item.isActive ? "badge-income" : "badge-warning"}>{item.isActive ? "Active" : "Pause"}</span>
                      </td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                        -{formatCurrency(item.amount)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditRecurring(item)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                            <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                          <button
                            onClick={() => {
                              setRecurringDeleteTarget(item);
                              setRecurringDeleteOpen(true);
                            }}
                            className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors"
                          >
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

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editItem}
        activities={activityList}
        categories={categoryList}
        onCreate={handleCreate}
        onCreateRecurring={handleCreateRecurring}
        onUpdate={handleUpdate}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer la depense"
        description={`Supprimer "${deleteTarget?.description || "cette depense"}" ?`}
        onConfirm={confirmDelete}
      />
      <DeleteConfirmDialog
        open={recurringDeleteOpen}
        onOpenChange={setRecurringDeleteOpen}
        title="Supprimer la depense automatique"
        description={`Supprimer "${recurringDeleteTarget?.description || "cette regle"}" ?`}
        onConfirm={confirmDeleteRecurring}
      />
      <FormDialog open={recurringEditOpen} onOpenChange={setRecurringEditOpen} title="Modifier la depense automatique">
        <form onSubmit={submitRecurringUpdate} className="space-y-4">
          <FormFieldInput label="Montant (EUR)" id="rec-exp-amount" type="number" value={recurringAmount} onChange={setRecurringAmount} required step="0.01" min="0" />
          <FormFieldInput label="Description" id="rec-exp-desc" value={recurringDescription} onChange={setRecurringDescription} />
          <FormFieldInput label="Date de debut" id="rec-exp-start" type="date" value={recurringStartDate} onChange={setRecurringStartDate} required />
          <FormFieldInput label="Date de fin (optionnel)" id="rec-exp-end" type="date" value={recurringEndDate} onChange={setRecurringEndDate} />
          <SelectField label="Frequence" value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as "DAY" | "WEEK" | "MONTH")} options={frequencyOptions} />
          <SelectField
            label="Categorie"
            value={recurringCategoryId}
            onValueChange={setRecurringCategoryId}
            options={[{ value: "none", label: "Aucune" }, ...categoryList.map((category) => ({ value: category.id, label: `${category.icon || ""} ${category.name}`.trim() }))]}
          />
          <SelectField
            label="Activite"
            value={recurringActivityId}
            onValueChange={setRecurringActivityId}
            options={[{ value: "none", label: "Aucune" }, ...activityList.map((activity) => ({ value: activity.id, label: activity.name }))]}
          />
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
              Regle active
            </Label>
            <Switch checked={recurringActive} onCheckedChange={setRecurringActive} />
          </div>
          <button
            type="submit"
            disabled={isRecurringSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "var(--gradient-danger)", color: "hsl(var(--destructive-foreground))" }}
          >
            {isRecurringSubmitting ? "En cours..." : "Enregistrer"}
          </button>
        </form>
      </FormDialog>
    </div>
  );
}

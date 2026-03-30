import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Plus, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Activity, Income, PaymentType, Withdrawal } from "@/data/staticData";
import { getActivities } from "@/api/activityApi";
import {
  createRecurringIncome,
  createIncome,
  deleteRecurringIncome,
  deleteIncome,
  getIncomeStatistics,
  getRecurringIncomes,
  getIncomes,
  updateRecurringIncome,
  updateIncome,
} from "@/api/incomeApi";
import type { IncomePayload, IncomeStatistics, RecurringIncome, RecurringIncomePayload } from "@/api/incomeApi";
import IncomeForm from "@/components/forms/IncomeForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createWithdrawal, deleteWithdrawal, getWithdrawals, updateWithdrawal } from "@/api/withdrawalApi";
import { compareByMostRecent } from "@/lib/recent-sort";
import { useActivityFilterStore } from "@/stores/activityFilterStore";

const CustomTooltipStyle = {
  contentStyle: {
    background: "hsl(225, 27%, 12%)",
    border: "1px solid hsl(224, 22%, 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(213, 31%, 93%)",
  },
};

const EMPTY_INCOME_STATS: IncomeStatistics = {
  year: new Date().getFullYear(),
  totalIncome: 0,
  cardTotal: 0,
  cashTotal: 0,
  mobileTotal: 0,
  monthlyData: [],
};

export default function Incomes() {
  const selectedActivityId = useActivityFilterStore((state) => state.selectedActivityId);
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [incomeStats, setIncomeStats] = useState<IncomeStatistics>(EMPTY_INCOME_STATS);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Income | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalEditItem, setWithdrawalEditItem] = useState<Withdrawal | null>(null);
  const [withdrawalDeleteOpen, setWithdrawalDeleteOpen] = useState(false);
  const [withdrawalDeleteTarget, setWithdrawalDeleteTarget] = useState<Withdrawal | null>(null);
  const [withdrawalList, setWithdrawalList] = useState<Withdrawal[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDescription, setWithdrawalDescription] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split("T")[0]);
  const [withdrawalActivityId, setWithdrawalActivityId] = useState("none");
  const [withdrawalPaymentType, setWithdrawalPaymentType] = useState<PaymentType>("CARD");
  const [withdrawalCashFee, setWithdrawalCashFee] = useState("");
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [recurringList, setRecurringList] = useState<RecurringIncome[]>([]);
  const [recurringEditOpen, setRecurringEditOpen] = useState(false);
  const [recurringEditItem, setRecurringEditItem] = useState<RecurringIncome | null>(null);
  const [recurringDeleteOpen, setRecurringDeleteOpen] = useState(false);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<RecurringIncome | null>(null);
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringDescription, setRecurringDescription] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringFrequency, setRecurringFrequency] = useState<"DAY" | "WEEK" | "MONTH">("MONTH");
  const [recurringPaymentType, setRecurringPaymentType] = useState<"CARD" | "CASH" | "MOBILE">("CARD");
  const [recurringCashFee, setRecurringCashFee] = useState("");
  const [recurringActivityId, setRecurringActivityId] = useState("none");
  const [recurringActive, setRecurringActive] = useState(true);
  const [isRecurringSubmitting, setIsRecurringSubmitting] = useState(false);

  const visibleRecurringList = useMemo(
    () => (selectedActivityId ? recurringList.filter((item) => item.activityId === selectedActivityId) : recurringList),
    [recurringList, selectedActivityId],
  );

  const loadIncomes = async () => {
    try {
      const remoteIncomes = await getIncomes({ activityId: selectedActivityId ?? undefined });
      setIncomeList(remoteIncomes);
    } catch (error) {
      console.error("Impossible de charger les revenus depuis l'API.", error);
      setIncomeList([]);
    }
  };

  const loadRecurringIncomes = async () => {
    try {
      const data = await getRecurringIncomes();
      setRecurringList(data);
    } catch (error) {
      console.error("Impossible de charger les revenus automatiques.", error);
      setRecurringList([]);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const data = await getWithdrawals();
      setWithdrawalList(data);
    } catch (error) {
      console.error("Impossible de charger les retraits depuis l'API.", error);
      setWithdrawalList([]);
    }
  };

  const refreshIncomeStats = async () => {
    try {
      const stats = await getIncomeStatistics({ activityId: selectedActivityId ?? undefined });
      setIncomeStats(stats);
    } catch (error) {
      console.error("Impossible de charger les statistiques revenus depuis l'API.", error);
      setIncomeStats(EMPTY_INCOME_STATS);
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

    loadActivities();
  }, []);

  useEffect(() => {
    loadIncomes();
    loadRecurringIncomes();
<<<<<<< HEAD
    loadActivities();
    loadWithdrawals();
=======
>>>>>>> 87ba97ea83fdeac5cee8eb0f8eac51ee67470b97
    refreshIncomeStats();
  }, [selectedActivityId]);

  useEffect(() => {
    if (!withdrawalOpen) return;

    if (withdrawalEditItem) {
      setWithdrawalAmount(String(withdrawalEditItem.amount));
      setWithdrawalDescription(withdrawalEditItem.description || "");
      setWithdrawalDate(withdrawalEditItem.date ? withdrawalEditItem.date.split("T")[0] : new Date().toISOString().split("T")[0]);
      setWithdrawalActivityId(withdrawalEditItem.activityId || "none");
      setWithdrawalPaymentType(withdrawalEditItem.paymentType || "CARD");
      setWithdrawalCashFee(
        withdrawalEditItem.cashFee !== undefined && Number.isFinite(withdrawalEditItem.cashFee)
          ? String(withdrawalEditItem.cashFee)
          : "",
      );
      return;
    }

    setWithdrawalAmount("");
    setWithdrawalDescription("");
    setWithdrawalDate(new Date().toISOString().split("T")[0]);
<<<<<<< HEAD
    setWithdrawalActivityId("none");
    setWithdrawalPaymentType("CARD");
    setWithdrawalCashFee("");
  }, [withdrawalOpen, withdrawalEditItem]);
=======
    setWithdrawalActivityId(selectedActivityId ?? "none");
  }, [selectedActivityId, withdrawalOpen]);
>>>>>>> 87ba97ea83fdeac5cee8eb0f8eac51ee67470b97

  const totalIncome = incomeStats.totalIncome;
  const cardTotal = incomeStats.cardTotal;
  const cashTotal = incomeStats.cashTotal;
  const mobileTotal = incomeStats.mobileTotal;
  const accountTotal = cardTotal + cashTotal + mobileTotal;

  const cardPercent = accountTotal > 0 ? Math.round((cardTotal / accountTotal) * 100) : 0;
  const cashPercent = accountTotal > 0 ? Math.round((cashTotal / accountTotal) * 100) : 0;
  const mobilePercent = accountTotal > 0 ? Math.round((mobileTotal / accountTotal) * 100) : 0;

  const handleEdit = (inc: Income) => {
    setEditItem(inc);
    setFormOpen(true);
  };

  const handleDelete = (inc: Income) => {
    setDeleteTarget(inc);
    setDeleteOpen(true);
  };

  const handleCreate = async (payload: IncomePayload) => {
    const created = await createIncome(payload);
    setIncomeList((prev) => [created, ...prev]);
    await refreshIncomeStats();
    toast({ title: "Revenu ajoute", description: `+${formatCurrency(created.amount)}` });
  };

  const handleCreateRecurring = async (payload: RecurringIncomePayload) => {
    const result = await createRecurringIncome(payload);
    await loadIncomes();
    await loadRecurringIncomes();
    await refreshIncomeStats();
    toast({
      title: "Revenu automatique ajoute",
      description: `${result.createdOccurrences} occurrence(s) generee(s).`,
    });
  };

  const handleUpdate = async (id: string, payload: IncomePayload) => {
    const updated = await updateIncome(id, payload);
    setIncomeList((prev) => prev.map((income) => (income.id === id ? updated : income)));
    await refreshIncomeStats();
    toast({ title: "Revenu modifie", description: `+${formatCurrency(updated.amount)}` });
  };

  const submitWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(withdrawalAmount);
    const parsedCashFee = withdrawalCashFee.trim().length ? Number(withdrawalCashFee) : undefined;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }
<<<<<<< HEAD
    if (parsedCashFee !== undefined && (!Number.isFinite(parsedCashFee) || parsedCashFee < 0)) {
      toast({ title: "Frais invalides", description: "Saisissez un montant de frais en especes >= 0." });
      return;
    }
    if (withdrawalActivityId === "none") {
=======

    const effectiveWithdrawalActivityId = selectedActivityId ?? withdrawalActivityId;
    if (effectiveWithdrawalActivityId === "none") {
>>>>>>> 87ba97ea83fdeac5cee8eb0f8eac51ee67470b97
      toast({ title: "Activite requise", description: "Selectionnez une activite pour faire un retrait." });
      return;
    }

    try {
      setWithdrawalSubmitting(true);
      const payload = {
        amount: parsedAmount,
        date: withdrawalDate,
        description: withdrawalDescription.trim() || undefined,
<<<<<<< HEAD
        activityId: withdrawalActivityId,
        paymentType: withdrawalPaymentType,
        cashFee: parsedCashFee !== undefined && parsedCashFee > 0 ? parsedCashFee : undefined,
      };

      if (withdrawalEditItem) {
        const updated = await updateWithdrawal(withdrawalEditItem.id, payload);
        setWithdrawalList((prev) => prev.map((w) => (w.id === withdrawalEditItem.id ? updated : w)));
        toast({ title: "Retrait modifie", description: `-${formatCurrency(updated.amount)}` });
      } else {
        const created = await createWithdrawal(payload);
        setWithdrawalList((prev) => [created, ...prev]);
        toast({ title: "Retrait enregistre", description: `-${formatCurrency(parsedAmount)}` });
      }

=======
        activityId: effectiveWithdrawalActivityId,
      });
>>>>>>> 87ba97ea83fdeac5cee8eb0f8eac51ee67470b97
      await refreshIncomeStats();
      setWithdrawalOpen(false);
      setWithdrawalEditItem(null);
    } catch (error) {
      console.error("Impossible d'enregistrer le retrait.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Retrait impossible pour le moment." });
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteIncome(deleteTarget.id);
      setIncomeList((prev) => prev.filter((income) => income.id !== deleteTarget.id));
      await refreshIncomeStats();
      toast({ title: "Revenu supprime" });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer le revenu.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  const confirmCancelWithdrawal = async () => {
    if (!withdrawalDeleteTarget) return;

    try {
      await deleteWithdrawal(withdrawalDeleteTarget.id);
      setWithdrawalList((prev) => prev.filter((w) => w.id !== withdrawalDeleteTarget.id));
      await refreshIncomeStats();
      toast({ title: "Retrait annule" });
      setWithdrawalDeleteOpen(false);
      setWithdrawalDeleteTarget(null);
    } catch (error) {
      console.error("Impossible d'annuler le retrait.", error);
      toast({ title: "Erreur", description: "Annulation impossible pour le moment." });
    }
  };

  const frequencyOptions = [
    { value: "DAY", label: "Chaque jour" },
    { value: "WEEK", label: "Chaque semaine" },
    { value: "MONTH", label: "Chaque mois" },
  ];
  const paymentOptions = [
    { value: "CARD", label: "Carte" },
    { value: "CASH", label: "Especes" },
    { value: "MOBILE", label: "Compte mobile" },
  ];

  const handleEditRecurring = (item: RecurringIncome) => {
    setRecurringEditItem(item);
    setRecurringAmount(String(item.amount));
    setRecurringDescription(item.description || "");
    setRecurringStartDate(item.startDate.split("T")[0]);
    setRecurringEndDate(item.endDate ? item.endDate.split("T")[0] : "");
    setRecurringFrequency(item.frequency);
    setRecurringPaymentType(item.paymentType || "CARD");
<<<<<<< HEAD
    setRecurringCashFee(item.cashFee !== undefined && Number.isFinite(item.cashFee) ? String(item.cashFee) : "");
    setRecurringActivityId(item.activityId || "none");
=======
    setRecurringActivityId(selectedActivityId || item.activityId || "none");
>>>>>>> 87ba97ea83fdeac5cee8eb0f8eac51ee67470b97
    setRecurringActive(item.isActive);
    setRecurringEditOpen(true);
  };

  const submitRecurringUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recurringEditItem) return;
    const amount = Number(recurringAmount);
    const parsedCashFee = recurringCashFee.trim().length ? Number(recurringCashFee) : undefined;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }
    if (parsedCashFee !== undefined && (!Number.isFinite(parsedCashFee) || parsedCashFee < 0)) {
      toast({ title: "Frais invalides", description: "Saisissez un montant de frais en especes >= 0." });
      return;
    }
    if (recurringEndDate && recurringEndDate < recurringStartDate) {
      toast({ title: "Date invalide", description: "La date de fin doit etre apres la date de debut." });
      return;
    }

    try {
      setIsRecurringSubmitting(true);
      await updateRecurringIncome(recurringEditItem.id, {
        amount,
        paymentType: recurringPaymentType,
        cashFee: parsedCashFee !== undefined && parsedCashFee > 0 ? parsedCashFee : undefined,
        description: recurringDescription.trim() || undefined,
        startDate: recurringStartDate,
        endDate: recurringEndDate || undefined,
        frequency: recurringFrequency,
        activityId: selectedActivityId ?? (recurringActivityId === "none" ? undefined : recurringActivityId),
        isActive: recurringActive,
      });
      await loadRecurringIncomes();
      await loadIncomes();
      await refreshIncomeStats();
      setRecurringEditOpen(false);
      toast({ title: "Revenu automatique modifie" });
    } catch (error) {
      console.error("Impossible de modifier le revenu automatique.", error);
      toast({ title: "Erreur", description: "Modification impossible pour le moment." });
    } finally {
      setIsRecurringSubmitting(false);
    }
  };

  const confirmDeleteRecurring = async () => {
    if (!recurringDeleteTarget) return;
    try {
      await deleteRecurringIncome(recurringDeleteTarget.id);
      await loadRecurringIncomes();
      toast({ title: "Revenu automatique supprime" });
      setRecurringDeleteOpen(false);
      setRecurringDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer le revenu automatique.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Revenus" subtitle="Suivi de tous vos revenus" />
      <div className="p-6 space-y-6">
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
                <p className="text-xl font-display font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="stat-card lg:col-span-2">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              Revenus mensuels
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incomeStats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,22%,18%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...CustomTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenus" name="Revenus" fill="hsl(158,64%,52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              Par mode de paiement
            </p>
            <div className="space-y-4">
              {[
                { label: "Virement / Carte", value: cardTotal, pct: cardPercent, color: "hsl(var(--info))" },
                { label: "Especes", value: cashTotal, pct: cashPercent, color: "hsl(var(--warning))" },
                { label: "Compte mobile", value: mobileTotal, pct: mobilePercent, color: "hsl(var(--purple))" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between mb-1.5">
                    <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                      {p.label}
                    </p>
                    <p className="text-sm font-medium" style={{ color: p.color }}>
                      {p.pct}%
                    </p>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "hsl(var(--border))" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {formatCurrency(p.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Tous les revenus{" "}
              <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                ({incomeList.length})
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setWithdrawalEditItem(null);
                  setWithdrawalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
              >
                <ArrowDownUp size={13} /> Retrait
              </button>
              <button
                onClick={() => {
                  setEditItem(null);
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
              >
                <Plus size={13} /> Ajouter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Activite</th>
                  <th className="text-right">Carte</th>
                  <th className="text-right">Mobile</th>
                  <th className="text-right">Especes</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
                <tbody>
                {[...incomeList]
                  .sort(compareByMostRecent(["createdAt", "date"]))
                  .map((inc) => {
                  const act = activityList.find((activity) => activity.id === inc.activityId);
                  return (
                    <tr key={inc.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(inc.date)}</td>
                      <td style={{ color: "hsl(var(--foreground))" }}>{inc.description || "-"}</td>
                      <td>{act ? <span className="badge-income">{act.name}</span> : "-"}</td>
                      <td className="text-right" style={{ color: "hsl(var(--info))" }}>
                        {inc.paymentType === "CARD" ? formatCurrency(inc.amount) : "-"}
                      </td>
                      <td className="text-right" style={{ color: "hsl(var(--purple))" }}>
                        {inc.paymentType === "MOBILE" ? formatCurrency(inc.amount) : "-"}
                      </td>
                      <td className="text-right" style={{ color: "hsl(var(--warning))" }}>
                        {inc.paymentType === "CASH" ? formatCurrency(inc.amount) : "-"}
                      </td>
                      <td>
                        <span className={inc.recurringIncomeId ? "badge-warning text-xs" : "badge-info text-xs"}>
                          {inc.recurringIncomeId ? "Automatique" : "Manuel"}
                        </span>
                      </td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--primary))" }}>
                        +{formatCurrency(inc.amount)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(inc)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                            <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                          <button onClick={() => handleDelete(inc)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
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

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Revenus automatiques{" "}
              <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                ({visibleRecurringList.length})
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
                  <th className="text-right">Carte</th>
                  <th className="text-right">Mobile</th>
                  <th className="text-right">Especes</th>
                  <th className="text-left">Activite</th>
                  <th className="text-left">Statut</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...visibleRecurringList].sort(compareByMostRecent(["createdAt", "startDate", "date"])).map((item) => {
                  const activity = item.activityId ? activityList.find((a) => a.id === item.activityId) : undefined;
                  return (
                    <tr key={item.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(item.startDate)}</td>
                      <td style={{ color: "hsl(var(--foreground))" }}>{item.frequency === "DAY" ? "Jour" : item.frequency === "WEEK" ? "Semaine" : "Mois"}</td>
                      <td style={{ color: "hsl(var(--foreground))" }}>{item.description || "-"}</td>
                      <td className="text-right" style={{ color: "hsl(var(--info))" }}>
                        {item.paymentType === "CARD" ? formatCurrency(item.amount) : "-"}
                      </td>
                      <td className="text-right" style={{ color: "hsl(var(--purple))" }}>
                        {item.paymentType === "MOBILE" ? formatCurrency(item.amount) : "-"}
                      </td>
                      <td className="text-right" style={{ color: "hsl(var(--warning))" }}>
                        {item.paymentType === "CASH" ? formatCurrency(item.amount) : "-"}
                      </td>
                      <td>{activity ? <span className="badge-income">{activity.name}</span> : "-"}</td>
                      <td>
                        <span className={item.isActive ? "badge-income" : "badge-warning"}>{item.isActive ? "Active" : "Pause"}</span>
                      </td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--primary))" }}>
                        +{formatCurrency(item.amount)}
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

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Retraits{" "}
              <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                ({withdrawalList.length})
              </span>
            </p>
            <button
              onClick={() => {
                setWithdrawalEditItem(null);
                setWithdrawalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
            >
              <ArrowDownUp size={13} /> Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Activite</th>
                  <th className="text-left">Compte</th>
                  <th className="text-right">Frais (especes)</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...withdrawalList]
                  .sort(compareByMostRecent(["date", "createdAt"]))
                  .map((wd) => {
                    const act = activityList.find((a) => a.id === wd.activityId);
                    const paymentLabel = wd.paymentType === "MOBILE" ? "Mobile" : wd.paymentType === "CASH" ? "Especes" : "Carte";
                    return (
                      <tr key={wd.id}>
                        <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(wd.date)}</td>
                        <td style={{ color: "hsl(var(--foreground))" }}>{wd.description || "-"}</td>
                        <td>{act ? <span className="badge-income">{act.name}</span> : "-"}</td>
                        <td>
                          <span
                            className={
                              wd.paymentType === "CASH"
                                ? "badge-warning text-xs"
                                : wd.paymentType === "MOBILE"
                                  ? "badge-info text-xs"
                                  : "badge-income text-xs"
                            }
                          >
                            {paymentLabel}
                          </span>
                        </td>
                        <td className="text-right" style={{ color: "hsl(var(--purple))" }}>
                          {wd.cashFee !== undefined && Number.isFinite(wd.cashFee) ? formatCurrency(wd.cashFee) : "-"}
                        </td>
                        <td className="text-right font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                          -{formatCurrency(wd.amount)}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setWithdrawalEditItem(wd);
                                setWithdrawalOpen(true);
                              }}
                              className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors"
                            >
                              <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </button>
                            <button
                              onClick={() => {
                                setWithdrawalDeleteTarget(wd);
                                setWithdrawalDeleteOpen(true);
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

      <IncomeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        income={editItem}
        activities={activityList}
        lockedActivityId={selectedActivityId}
        onCreate={handleCreate}
        onCreateRecurring={handleCreateRecurring}
        onUpdate={handleUpdate}
      />

      <FormDialog
        open={withdrawalOpen}
        onOpenChange={(open) => {
          setWithdrawalOpen(open);
          if (!open) setWithdrawalEditItem(null);
        }}
        title={withdrawalEditItem ? "Modifier le retrait" : "Nouveau retrait"}
      >
        <form onSubmit={submitWithdrawal} className="space-y-4">
          <FormFieldInput label="Montant (MGA)" id="wd-amount" type="number" value={withdrawalAmount} onChange={setWithdrawalAmount} required step="0.01" min="0" />
          <SelectField
            label="Compte source"
            value={withdrawalPaymentType}
            onValueChange={(v) => setWithdrawalPaymentType(v as PaymentType)}
            options={paymentOptions}
          />
          <FormFieldInput
            label="Frais en especes (optionnel)"
            id="wd-cash-fee"
            type="number"
            value={withdrawalCashFee}
            onChange={setWithdrawalCashFee}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          <FormFieldInput label="Date" id="wd-date" type="date" value={withdrawalDate} onChange={setWithdrawalDate} required />
          <SelectField
            label="Activite"
            value={withdrawalActivityId}
            onValueChange={setWithdrawalActivityId}
            options={[{ value: "none", label: "Selectionner..." }, ...activityList.map((activity) => ({ value: activity.id, label: activity.name }))]}
            disabled={Boolean(selectedActivityId)}
          />
          <FormFieldInput label="Description (optionnel)" id="wd-desc" value={withdrawalDescription} onChange={setWithdrawalDescription} placeholder="Ex: Retrait ATM" />
          <button
            type="submit"
            disabled={withdrawalSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
          >
            {withdrawalSubmitting ? "En cours..." : withdrawalEditItem ? "Enregistrer les modifications" : "Enregistrer le retrait"}
          </button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer le revenu"
        description={`Supprimer "${deleteTarget?.description || "ce revenu"}" de ${deleteTarget ? formatCurrency(deleteTarget.amount) : ""} ?`}
        onConfirm={confirmDelete}
      />
      <DeleteConfirmDialog
        open={recurringDeleteOpen}
        onOpenChange={setRecurringDeleteOpen}
        title="Supprimer le revenu automatique"
        description={`Supprimer "${recurringDeleteTarget?.description || "cette regle"}" ?`}
        onConfirm={confirmDeleteRecurring}
      />
      <DeleteConfirmDialog
        open={withdrawalDeleteOpen}
        onOpenChange={setWithdrawalDeleteOpen}
        title="Annuler le retrait"
        description={`Annuler "${withdrawalDeleteTarget?.description || "ce retrait"}" de ${
          withdrawalDeleteTarget ? formatCurrency(withdrawalDeleteTarget.amount) : ""
        } ?`}
        onConfirm={confirmCancelWithdrawal}
      />
      <FormDialog open={recurringEditOpen} onOpenChange={setRecurringEditOpen} title="Modifier le revenu automatique">
        <form onSubmit={submitRecurringUpdate} className="space-y-4">
          <FormFieldInput label="Montant (MGA)" id="rec-inc-amount" type="number" value={recurringAmount} onChange={setRecurringAmount} required step="0.01" min="0" />
          <FormFieldInput label="Frais en especes (optionnel)" id="rec-inc-cash-fee" type="number" value={recurringCashFee} onChange={setRecurringCashFee} placeholder="0.00" step="0.01" min="0" />
          <FormFieldInput label="Description" id="rec-inc-desc" value={recurringDescription} onChange={setRecurringDescription} />
          <FormFieldInput label="Date de debut" id="rec-inc-start" type="date" value={recurringStartDate} onChange={setRecurringStartDate} required />
          <FormFieldInput label="Date de fin (optionnel)" id="rec-inc-end" type="date" value={recurringEndDate} onChange={setRecurringEndDate} />
          <SelectField label="Frequence" value={recurringFrequency} onValueChange={(v) => setRecurringFrequency(v as "DAY" | "WEEK" | "MONTH")} options={frequencyOptions} />
          <SelectField label="Mode de paiement" value={recurringPaymentType} onValueChange={(v) => setRecurringPaymentType(v as "CARD" | "CASH" | "MOBILE")} options={paymentOptions} />
          <SelectField
            label="Activite"
            value={recurringActivityId}
            onValueChange={setRecurringActivityId}
            options={[{ value: "none", label: "Aucune" }, ...activityList.map((activity) => ({ value: activity.id, label: activity.name }))]}
            disabled={Boolean(selectedActivityId)}
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
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            {isRecurringSubmitting ? "En cours..." : "Enregistrer"}
          </button>
        </form>
      </FormDialog>
    </div>
  );
}

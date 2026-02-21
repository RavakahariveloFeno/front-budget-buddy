import { useEffect, useState } from "react";
import { Briefcase, Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import {
  activities,
  investments,
  formatCurrency,
  formatDate,
  type Activity,
  type Investment,
} from "@/data/staticData";
import {
  createActivity,
  deleteActivity,
  getActivities,
  getActivityStatsByUser,
  updateActivity,
} from "@/api/activityApi";
import type { ActivityPayload, ActivityStats } from "@/api/activityApi";
import { getInvestments } from "@/api/investmentApi";
import ActivityForm from "@/components/forms/ActivityForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";

const typeColors: Record<string, string> = {
  SALARY: "badge-income",
  BUSINESS: "badge-purple",
  FREELANCE: "badge-info",
  OTHER: "badge-warning",
};

const typeLabels: Record<string, string> = {
  SALARY: "Salaire",
  BUSINESS: "Business",
  FREELANCE: "Freelance",
  OTHER: "Autre",
};

const typeGradients: Record<string, string> = {
  SALARY: "var(--gradient-primary)",
  BUSINESS: "var(--gradient-purple)",
  FREELANCE: "linear-gradient(135deg, hsl(217,91%,60%), hsl(186,74%,56%))",
  OTHER: "var(--gradient-warning)",
};

function buildStatsMap(stats: ActivityStats[]): Record<string, ActivityStats> {
  return stats.reduce<Record<string, ActivityStats>>((acc, item) => {
    acc[item.activityId] = item;
    return acc;
  }, {});
}

export default function Activities() {
  const [activityList, setActivityList] = useState<Activity[]>(activities);
  const [investmentList, setInvestmentList] = useState<Investment[]>(investments);
  const [statsByActivity, setStatsByActivity] = useState<Record<string, ActivityStats>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  const refreshActivityStats = async () => {
    try {
      const remoteStats = await getActivityStatsByUser();
      setStatsByActivity(buildStatsMap(remoteStats));
    } catch (error) {
      console.error("Impossible de charger les statistiques activite depuis l'API.", error);
      setStatsByActivity({});
    }
  };

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const remoteActivities = await getActivities();
        setActivityList(remoteActivities.length ? remoteActivities : activities);
      } catch (error) {
        console.error("Impossible de charger les activites depuis l'API, fallback static.", error);
        setActivityList(activities);
      }
    };

    const loadInvestments = async () => {
      try {
        const remoteInvestments = await getInvestments();
        setInvestmentList(remoteInvestments.length ? remoteInvestments : investments);
      } catch (error) {
        console.error("Impossible de charger les investissements depuis l'API, fallback static.", error);
        setInvestmentList(investments);
      }
    };

    loadActivities();
    loadInvestments();
    refreshActivityStats();
  }, []);

  const handleEdit = (act: Activity) => {
    setEditItem(act);
    setFormOpen(true);
  };

  const handleDelete = (act: Activity) => {
    setDeleteTarget(act);
    setDeleteOpen(true);
  };

  const handleCreate = async (payload: ActivityPayload) => {
    const created = await createActivity(payload);
    setActivityList((prev) => [created, ...prev]);
    await refreshActivityStats();
    toast({ title: "Activite ajoutee", description: created.name });
  };

  const handleUpdate = async (id: string, payload: ActivityPayload) => {
    const updated = await updateActivity(id, payload);
    setActivityList((prev) => prev.map((activity) => (activity.id === id ? updated : activity)));
    await refreshActivityStats();
    toast({ title: "Activite modifiee", description: updated.name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteActivity(deleteTarget.id);
      setActivityList((prev) => prev.filter((activity) => activity.id !== deleteTarget.id));
      await refreshActivityStats();
      toast({ title: "Activite supprimee", description: deleteTarget.name });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer l'activite.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Activites" subtitle="Sources de revenus et activites financieres" />
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
            <Plus size={16} /> Nouvelle activite
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityList.map((act) => {
            const stats = statsByActivity[act.id];
            const actIncome = stats?.income ?? 0;
            const actExpenses = stats?.expense ?? 0;
            const sentInv = stats?.sentInvestment ?? 0;
            const recvInv = stats?.receivedInvestment ?? 0;
            const remainingLoan = stats?.remainingLoan ?? 0;
            const netAvailable = actIncome - actExpenses - sentInv + recvInv + remainingLoan;
            const netPositive = netAvailable >= 0;

            return (
              <div key={act.id} className="stat-card hover:border-primary/40 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: typeGradients[act.type] }}>
                      <Briefcase size={18} style={{ color: "hsl(var(--primary-foreground))" }} />
                    </div>
                    <div>
                      <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        {act.name}
                      </p>
                      {act.description && (
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={typeColors[act.type]}>{typeLabels[act.type]}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button onClick={() => handleEdit(act)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                        <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </button>
                      <button onClick={() => handleDelete(act)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors">
                        <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--primary-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Revenus
                    </p>
                    <p className="font-semibold" style={{ color: "hsl(var(--primary))" }}>
                      {formatCurrency(actIncome)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Depenses
                    </p>
                    <p className="font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                      {formatCurrency(actExpenses)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--purple-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Invest. envoyes
                    </p>
                    <p className="font-semibold" style={{ color: "hsl(var(--purple))" }}>
                      {formatCurrency(sentInv)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--info-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Invest. recus
                    </p>
                    <p className="font-semibold" style={{ color: "hsl(var(--info))" }}>
                      {formatCurrency(recvInv)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "hsl(var(--warning-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Prêt restant
                    </p>
                    <p className="font-semibold" style={{ color: "hsl(var(--warning))" }}>
                      {formatCurrency(remainingLoan)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: netPositive ? "hsl(var(--primary-dim))" : "hsl(var(--destructive-dim))" }}>
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Solde net dispo
                    </p>
                    <p className="font-semibold" style={{ color: netPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                      {formatCurrency(netAvailable)}
                    </p>
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

        <div className="stat-card">
          <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            Transferts entre activites
          </p>
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
                {investmentList.map((inv) => {
                  const from = activityList.find((activity) => activity.id === inv.fromActivityId);
                  const to = activityList.find((activity) => activity.id === inv.toActivityId);
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
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{inv.note || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} activity={editItem} onCreate={handleCreate} onUpdate={handleUpdate} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer l'activite"
        description={`Voulez-vous vraiment supprimer "${deleteTarget?.name}" ? Cette action est irreversible.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

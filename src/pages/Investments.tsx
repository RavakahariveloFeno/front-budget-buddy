import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Activity, Investment } from "@/data/staticData";
import { getActivities } from "@/api/activityApi";
import { createInvestment, deleteInvestment, getInvestments, updateInvestment } from "@/api/investmentApi";
import type { InvestmentPayload } from "@/api/investmentApi";
import InvestmentForm from "@/components/forms/InvestmentForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { compareByMostRecent } from "@/lib/recent-sort";

const CustomTooltipStyle = {
  contentStyle: { background: "hsl(225, 27%, 12%)", border: "1px solid hsl(224, 22%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(213, 31%, 93%)" },
};

const paymentTypeBadge = (paymentType?: string) => {
  if (paymentType === "CASH") {
    return { label: "Espèces", className: "badge-income" };
  }
  return { label: "Carte", className: "badge-info" };
};

export default function Investments() {
  const [investmentList, setInvestmentList] = useState<Investment[]>([]);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Investment | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);

  useEffect(() => {
    const loadInvestments = async () => {
      try {
        const remoteInvestments = await getInvestments();
        setInvestmentList(remoteInvestments);
      } catch (error) {
        console.error("Impossible de charger les investissements depuis l'API.", error);
        setInvestmentList([]);
      }
    };

    const loadActivities = async () => {
      try {
        const remoteActivities = await getActivities();
        setActivityList(remoteActivities);
      } catch (error) {
        console.error("Impossible de charger les activites depuis l'API.", error);
        setActivityList([]);
      }
    };

    loadInvestments();
    loadActivities();
  }, []);

  const activityById = useMemo(() => {
    const map = new Map<string, Activity>();
    for (const activity of activityList) {
      map.set(activity.id, activity);
    }
    return map;
  }, [activityList]);

  const sortedInvestments = useMemo(() => [...investmentList].sort(compareByMostRecent(["createdAt", "date"])), [investmentList]);

  const handleEdit = (investment: Investment) => {
    setEditItem(investment);
    setFormOpen(true);
  };
  const handleDelete = (investment: Investment) => {
    setDeleteTarget(investment);
    setDeleteOpen(true);
  };

  const handleCreate = async (payload: InvestmentPayload) => {
    const created = await createInvestment(payload);
    setInvestmentList((prev) => [created, ...prev]);
    toast({ title: "Transfert ajoute", description: formatCurrency(created.amount) });
  };

  const handleUpdate = async (id: string, payload: InvestmentPayload) => {
    const updated = await updateInvestment(id, payload);
    setInvestmentList((prev) => prev.map((investment) => (investment.id === id ? updated : investment)));
    toast({ title: "Transfert modifie", description: formatCurrency(updated.amount) });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteInvestment(deleteTarget.id);
      setInvestmentList((prev) => prev.filter((investment) => investment.id !== deleteTarget.id));
      toast({ title: "Transfert supprime" });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer le transfert.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  const activityData = activityList.map((activity) => ({
    name: activity.name.split(" ")[0],
    envoye: investmentList.filter((investment) => investment.fromActivityId === activity.id).reduce((sum, investment) => sum + investment.amount, 0),
    recu: investmentList.filter((investment) => investment.toActivityId === activity.id).reduce((sum, investment) => sum + investment.amount, 0),
  }));
  const totalInvestments = investmentList.reduce((sum, investment) => sum + investment.amount, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Investissements" subtitle="Transferts de capital entre activites" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total investi", value: formatCurrency(totalInvestments), color: "hsl(var(--purple))", bg: "hsl(var(--purple-dim))" },
            { label: "Nombre de transferts", value: `${investmentList.length}`, color: "hsl(var(--info))", bg: "hsl(var(--info-dim))" },
            { label: "Activites impliquees", value: `${activityList.length}`, color: "hsl(var(--primary))", bg: "hsl(var(--primary-dim))" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <ArrowRight size={18} style={{ color: stat.color }} />
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

        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-purple)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouveau transfert
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              Flux par activite
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,22%,18%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(217,14%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip {...CustomTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="envoye" name="Envoye" fill="hsl(351,75%,58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recu" name="Recu" fill="hsl(263,70%,62%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
              Balance par activite
            </p>
            <div className="space-y-3">
              {activityList.map((activity) => {
                const sent = investmentList.filter((investment) => investment.fromActivityId === activity.id).reduce((sum, investment) => sum + investment.amount, 0);
                const recv = investmentList.filter((investment) => investment.toActivityId === activity.id).reduce((sum, investment) => sum + investment.amount, 0);
                const balance = recv - sent;
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                        {activity.name}
                      </p>
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Envoye: {formatCurrency(sent)} · Recu: {formatCurrency(recv)}
                      </p>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: balance >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                      {balance >= 0 ? "+" : ""}
                      {formatCurrency(balance)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            Tous les transferts <span className="text-sm font-normal ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>({investmentList.length})</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Source</th>
                  <th className="text-center">{"->"}</th>
                  <th className="text-left">Destination</th>
                  <th className="text-left">Paiement</th>
                  <th className="text-left">Note</th>
                  <th className="text-right">Montant</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvestments.map((investment) => {
                  const from = activityById.get(investment.fromActivityId);
                  const to = activityById.get(investment.toActivityId);
                  return (
                    <tr key={investment.id}>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(investment.date)}</td>
                      <td><span className="badge-expense">{from?.name}</span></td>
                      <td className="text-center">
                        <ArrowRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} className="mx-auto" />
                      </td>
                      <td><span className="badge-purple">{to?.name}</span></td>
                      <td><span className={paymentTypeBadge(investment.paymentType).className}>{paymentTypeBadge(investment.paymentType).label}</span></td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{investment.note || "-"}</td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--purple))" }}>{formatCurrency(investment.amount)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(investment)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                            <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                          <button onClick={() => handleDelete(investment)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
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

      <InvestmentForm open={formOpen} onOpenChange={setFormOpen} investment={editItem} activities={activityList} onCreate={handleCreate} onUpdate={handleUpdate} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer le transfert"
        description={`Supprimer ce transfert de ${deleteTarget ? formatCurrency(deleteTarget.amount) : ""} ?`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

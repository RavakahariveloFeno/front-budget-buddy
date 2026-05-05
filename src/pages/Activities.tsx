import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CreditCard,
  Eye,
  LayoutGrid,
  Pencil,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
} from "lucide-react";

import Header from "@/components/layout/Header";
import {
  formatCurrency,
  formatDate,
  PREDEFINED_MODULES,
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
import { useModuleStore } from "@/stores/moduleStore";
import { useActivityFilterStore } from "@/stores/activityFilterStore";
import { getActivityModules } from "@/api/moduleApi";
import { getCurrentUser } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";
import { isModuleBlockedByStatus, useModuleCatalogStore } from "@/stores/moduleCatalogStore";

/* ─────────────────────────── constants ─────────────────────────── */

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

const typeAccent: Record<string, string> = {
  SALARY: "hsl(var(--primary))",
  BUSINESS: "hsl(var(--purple))",
  FREELANCE: "hsl(var(--info))",
  OTHER: "hsl(var(--warning))",
};

const typeAccentDim: Record<string, string> = {
  SALARY: "hsl(var(--primary-dim))",
  BUSINESS: "hsl(var(--purple-dim))",
  FREELANCE: "hsl(var(--info-dim))",
  OTHER: "hsl(var(--warning-dim))",
};

/* ─────────────────────────── helpers ─────────────────────────── */

function buildStatsMap(stats: ActivityStats[]): Record<string, ActivityStats> {
  return stats.reduce<Record<string, ActivityStats>>((acc, item) => {
    acc[item.activityId] = item;
    return acc;
  }, {});
}

/** Compact metric cell inside an activity card */
function MetricCell({
  label,
  value,
  color,
  bg,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  icon?: React.ElementType;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5"
      style={{ background: bg }}
    >
      <div
        className="flex items-center gap-1 text-[10px] uppercase tracking-wide"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <p className="text-sm font-semibold font-display" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export default function Activities() {
  const navigate = useNavigate();
  const setSelectedActivityId = useActivityFilterStore((s) => s.setSelectedActivityId);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const { getModuleIds, setLinks, reset } = useModuleStore();
  const [investmentList, setInvestmentList] = useState<Investment[]>([]);
  const [statsByActivity, setStatsByActivity] = useState<Record<string, ActivityStats>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const currentUser = getCurrentUser();
  const getModuleStatus = useModuleCatalogStore((s) => s.getModuleStatus);
  const isManagedProfile = Boolean(currentUser?.profileId);
  const canManageActivities = !isManagedProfile;
  const { data: managedProfile, isLoading: isLoadingManagedProfile } = useActiveManagedProfile();

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
        reset();
        const remoteActivities = await getActivities();
        setActivityList(remoteActivities);
        for (const act of remoteActivities) {
          try {
            const ids = await getActivityModules(act.id);
            if (ids.length) setLinks(act.id, ids);
          } catch { /* ignore */ }
        }
      } catch (error) {
        console.error("Impossible de charger les activites depuis l'API.", error);
        setActivityList([]);
      }
    };

    const loadInvestments = async () => {
      try {
        const remoteInvestments = await getInvestments();
        setInvestmentList(remoteInvestments);
      } catch (error) {
        console.error("Impossible de charger les investissements depuis l'API.", error);
        setInvestmentList([]);
      }
    };

    loadActivities();
    loadInvestments();
    refreshActivityStats();
  }, []);

  const handleEdit = (act: Activity) => { setEditItem(act); setFormOpen(true); };
  const handleDelete = (act: Activity) => { setDeleteTarget(act); setDeleteOpen(true); };

  const handleCreate = async (payload: ActivityPayload) => {
    const created = await createActivity(payload);
    setActivityList((prev) => [created, ...prev]);
    await refreshActivityStats();
    toast({ title: "Activite ajoutee", description: created.name });
    return created;
  };

  const handleUpdate = async (id: string, payload: ActivityPayload) => {
    const updated = await updateActivity(id, payload);
    setActivityList((prev) => prev.map((a) => (a.id === id ? updated : a)));
    await refreshActivityStats();
    toast({ title: "Activite modifiee", description: updated.name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteActivity(deleteTarget.id);
      setActivityList((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      await refreshActivityStats();
      toast({ title: "Activite supprimee", description: deleteTarget.name });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  /* Global summary totals */
  const globalTotals = activityList.reduce(
    (acc, act) => {
      const s = statsByActivity[act.id];
      if (!s) return acc;
      acc.income += s.income ?? 0;
      acc.expense += s.expense ?? 0;
      acc.net += (s.cardBalance ?? 0) + (s.cashBalance ?? 0) + (s.mobileBalance ?? 0);
      return acc;
    },
    { income: 0, expense: 0, net: 0 },
  );

  return (
    <div className="animate-fade-in">
      <Header title="Activités" subtitle="Sources de revenus et activités financières" />

      <div className="p-6 space-y-6">

        {/* ── Top bar: summary + CTA ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Summary pills */}
          <div className="flex flex-wrap gap-3">
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm animate-fade-in"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.5)" }}
            >
              <Briefcase size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Activités</span>
              <span className="font-bold font-display" style={{ color: "hsl(var(--foreground))" }}>
                {activityList.length}
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm animate-fade-in"
              style={{
                animationDelay: "40ms",
                borderColor: "hsl(var(--primary) / 0.3)",
                background: "hsl(var(--primary-dim))",
              }}
            >
              <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Revenus</span>
              <span className="font-bold font-display" style={{ color: "hsl(var(--primary))" }}>
                {formatCurrency(globalTotals.income)}
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm animate-fade-in"
              style={{
                animationDelay: "80ms",
                borderColor: "hsl(var(--destructive) / 0.3)",
                background: "hsl(var(--destructive-dim))",
              }}
            >
              <TrendingDown size={14} style={{ color: "hsl(var(--destructive))" }} />
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Dépenses</span>
              <span className="font-bold font-display" style={{ color: "hsl(var(--destructive))" }}>
                {formatCurrency(globalTotals.expense)}
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm animate-fade-in"
              style={{
                animationDelay: "120ms",
                borderColor: globalTotals.net >= 0
                  ? "hsl(var(--primary) / 0.3)"
                  : "hsl(var(--destructive) / 0.3)",
                background: globalTotals.net >= 0
                  ? "hsl(var(--primary-dim))"
                  : "hsl(var(--destructive-dim))",
              }}
            >
              <Wallet size={14} style={{ color: globalTotals.net >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }} />
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Solde net total</span>
              <span
                className="font-bold font-display"
                style={{ color: globalTotals.net >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}
              >
                {formatCurrency(globalTotals.net)}
              </span>
            </div>
          </div>

          {/* CTA */}
          {canManageActivities ? (
            <button
              onClick={() => { setEditItem(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "var(--gradient-primary)",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Plus size={15} /> Nouvelle activité
            </button>
          ) : (
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Création réservée au compte principal.
            </p>
          )}
        </div>

        {/* ── Activity Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activityList.map((act, index) => {
            const stats = statsByActivity[act.id];
            const actIncome = stats?.income ?? 0;
            const actExpenses = stats?.expense ?? 0;
            const cardBalance = stats?.cardBalance ?? 0;
            const cashBalance = stats?.cashBalance ?? 0;
            const mobileBalance = stats?.mobileBalance ?? 0;
            const sentInv = stats?.sentInvestment ?? 0;
            const recvInv = stats?.receivedInvestment ?? 0;
            const remainingLoan = stats?.remainingLoan ?? 0;
            const remainingToRecover = stats?.remainingToRecover ?? 0;
            const netAvailable = cardBalance + cashBalance + mobileBalance;
            const netPositive = netAvailable >= 0;

            const expenseRatio =
              actIncome > 0 ? Math.min(100, Math.round((actExpenses / actIncome) * 100)) : 0;
            const accent = typeAccent[act.type] ?? "hsl(var(--primary))";
            const accentDim = typeAccentDim[act.type] ?? "hsl(var(--primary-dim))";

            const canViewModules =
              !isManagedProfile ||
              (!isLoadingManagedProfile &&
                Boolean(managedProfile?.moduleLinks?.some((link) => link.startsWith(`${act.id}::`))));

            const moduleIds = getModuleIds(act.id);
            const linkedMods = PREDEFINED_MODULES
              .filter((m) => moduleIds.includes(m.id))
              .filter((m) => !isModuleBlockedByStatus(getModuleStatus(m.id)));

            return (
              <div
                key={act.id}
                className="rounded-2xl border overflow-hidden animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group"
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: "both",
                  borderColor: "hsl(var(--border))",
                  borderLeftWidth: "3px",
                  borderLeftColor: accent,
                  background: "hsl(var(--card))",
                }}
              >
                {/* ── Subtle header ── */}
                <div
                  className="relative px-5 py-4 flex items-center justify-between border-b"
                  style={{
                    background: "hsl(var(--background) / 0.5)",
                    borderColor: "hsl(var(--border) / 0.6)",
                  }}
                >
                  {/* Left: icon + name */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: accentDim }}
                    >
                      <Briefcase size={18} style={{ color: accent }} />
                    </div>
                    <div>
                      <p
                        className="font-display font-bold leading-tight"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {act.name}
                      </p>
                      {act.description && (
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: type badge + actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={typeColors[act.type]}>
                      {typeLabels[act.type]}
                    </span>
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        type="button"
                        disabled={!canViewModules}
                        onClick={() => canViewModules ? navigate(`/activities/${act.id}`) : undefined}
                        title={canViewModules ? "Voir modules" : "Aucun module autorisé"}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
                        style={{ opacity: canViewModules ? 1 : 0.35 }}
                      >
                        <Eye size={13} style={{ color: "hsl(var(--info))" }} />
                      </button>
                      {canManageActivities && (
                        <>
                          <button
                            onClick={() => handleEdit(act)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
                          >
                            <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                          <button
                            onClick={() => handleDelete(act)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-destructive/20"
                          >
                            <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Body ── */}
                <div className="p-5 space-y-4">

                  {/* Net balance + income/expense bar */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Solde net disponible
                      </p>
                      <p
                        className="text-2xl font-bold font-display mt-0.5"
                        style={{ color: netPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}
                      >
                        {formatCurrency(netAvailable)}
                      </p>
                    </div>
                    {/* Income vs Expense ratio */}
                    <div className="flex-1 max-w-[120px] space-y-1.5">
                      <div className="flex justify-between text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        <span>Rev.</span>
                        <span>{expenseRatio}% dép.</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${expenseRatio}%`,
                            background: expenseRatio > 90
                              ? "var(--gradient-danger)"
                              : expenseRatio > 60
                                ? "var(--gradient-warning)"
                                : "var(--gradient-primary)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span style={{ color: "hsl(var(--primary))" }}>
                          +{formatCurrency(actIncome)}
                        </span>
                        <span style={{ color: "hsl(var(--destructive))" }}>
                          -{formatCurrency(actExpenses)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Metrics 2×3 grid ── */}
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCell
                      label="Solde carte"
                      value={formatCurrency(cardBalance)}
                      color="hsl(var(--info))"
                      bg="hsl(var(--info-dim))"
                      icon={CreditCard}
                    />
                    <MetricCell
                      label="Solde espèces"
                      value={formatCurrency(cashBalance)}
                      color="hsl(var(--warning))"
                      bg="hsl(var(--warning-dim))"
                      icon={Wallet}
                    />
                    <MetricCell
                      label="Solde mobile"
                      value={formatCurrency(mobileBalance)}
                      color="hsl(var(--purple))"
                      bg="hsl(var(--purple-dim))"
                      icon={Wallet}
                    />
                    <MetricCell
                      label="Invest. envoyés"
                      value={formatCurrency(sentInv)}
                      color="hsl(var(--purple))"
                      bg="hsl(var(--purple-dim))"
                    />
                    <MetricCell
                      label="Invest. reçus"
                      value={formatCurrency(recvInv)}
                      color="hsl(var(--primary))"
                      bg="hsl(var(--primary-dim))"
                    />
                    <MetricCell
                      label="Restant à rembourser"
                      value={formatCurrency(remainingLoan)}
                      color="hsl(var(--warning))"
                      bg="hsl(var(--warning-dim))"
                    />
                    <MetricCell
                      label="Restant à récupérer"
                      value={formatCurrency(remainingToRecover)}
                      color="hsl(var(--purple))"
                      bg="hsl(var(--purple-dim))"
                    />
                  </div>

                  {/* ── Linked modules ── */}
                  {linkedMods.length > 0 && (
                    <div
                      className="flex flex-wrap gap-1.5 pt-3 border-t"
                      style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                    >
                      <LayoutGrid
                        size={12}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      />
                      {linkedMods.map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => {
                            setSelectedActivityId(act.id);
                            const firstMenuPath = mod.menus[0]?.path;
                            if (firstMenuPath) {
                              navigate(`/activities/${act.id}/modules/${mod.id}/${firstMenuPath}`);
                              return;
                            }
                            navigate(`/activities/${act.id}`);
                          }}
                          className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-85"
                          style={{
                            background: `hsl(var(--${mod.color}-dim))`,
                            color: `hsl(var(--${mod.color}))`,
                          }}
                        >
                          {mod.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Date ── */}
                  <div
                    className="flex items-center gap-1.5 pt-3 border-t"
                    style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                  >
                    <Calendar size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Depuis le {formatDate(act.startDate)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Transferts entre activités ── */}
        {investmentList.length > 0 && (
          <div className="stat-card">
            <div className="mb-5 flex items-center justify-between">
              <p
                className="font-display font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Transferts entre activités
              </p>
              <span className="badge-purple">{investmentList.length} transfert{investmentList.length > 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-2">
              {investmentList.map((inv, index) => {
                const from = activityList.find((a) => a.id === inv.fromActivityId);
                const to = activityList.find((a) => a.id === inv.toActivityId);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 animate-fade-in transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      animationDelay: `${index * 40}ms`,
                      animationFillMode: "both",
                      borderColor: "hsl(var(--border) / 0.6)",
                      background: "hsl(var(--background) / 0.2)",
                    }}
                  >
                    {/* Date */}
                    <p
                      className="text-xs flex-shrink-0 w-20"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {formatDate(inv.date)}
                    </p>

                    {/* From → To */}
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="badge-income truncate max-w-[120px]">
                        {from?.name ?? "—"}
                      </span>
                      <ArrowRight
                        size={13}
                        className="flex-shrink-0"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      />
                      <span className="badge-purple truncate max-w-[120px]">
                        {to?.name ?? "—"}
                      </span>
                    </div>

                    {/* Amount */}
                    <p
                      className="text-sm font-semibold font-display flex-shrink-0"
                      style={{ color: "hsl(var(--purple))" }}
                    >
                      {formatCurrency(inv.amount)}
                    </p>

                    {/* Note */}
                    {inv.note && (
                      <p
                        className="text-xs flex-shrink-0 max-w-[100px] truncate hidden sm:block"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                        title={inv.note}
                      >
                        {inv.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {canManageActivities && (
        <ActivityForm
          open={formOpen}
          onOpenChange={setFormOpen}
          activity={editItem}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer l'activité"
        description={`Voulez-vous vraiment supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
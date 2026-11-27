import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Banknote, CreditCard, Pencil, Plus, Smartphone, Trash2, Wallet } from 'lucide-react';
import Header from '@/components/layout/Header';
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog';

import {
  createBalanceReservation,
  deleteBalanceReservation,
  getBalanceOverview,
  updateBalanceReservation,
  type BalanceOverview,
  type BalanceReservation,
  type PaymentKey,
  type PaymentType,
} from '@/api/balanceApi';
import { formatCurrency } from '@/data/staticData';
import { toast } from '@/hooks/use-toast';
import { useActivityFilterStore } from '@/stores/activityFilterStore';

const paymentOptions: Array<{ value: PaymentType; label: string }> = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Carte' },
  { value: 'MOBILE', label: 'Mobile Money' },
];
const paymentMeta: Record<PaymentKey, { label: string; icon: typeof Banknote; color: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-emerald-400' },
  card: { label: 'Carte', icon: CreditCard, color: 'text-blue-400' },
  mobile: { label: 'Mobile Money', icon: Smartphone, color: 'text-violet-400' },
};


export default function Balances() {
  const selectedActivityId = useActivityFilterStore((state) => state.selectedActivityId);
  const lockedActivityId = selectedActivityId && selectedActivityId !== 'all' ? selectedActivityId : null;
  const [overview, setOverview] = useState<BalanceOverview | null>(null);

  const [scope, setScope] = useState(lockedActivityId ?? 'global');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editing, setEditing] = useState<BalanceReservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BalanceReservation | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('CASH');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setScope(lockedActivityId ?? 'global');
    setEditing(null);
    setAmount('');
    setPaymentType('CASH');
    setDescription('');
  }, [lockedActivityId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const balanceData = await getBalanceOverview();
      setOverview(balanceData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les soldes.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activities = overview?.activities.map((activity) => ({ id: activity.activityId, name: activity.name })) ?? [];
  const selectedActivity = overview?.activities.find((activity) => activity.activityId === scope);
  const balances = scope === 'global' ? overview?.global : selectedActivity?.balances;
  const visibleReservations = useMemo(() => {
    if (!overview) return [];
    return scope === 'global'
      ? overview.reservations
      : overview.reservations.filter((reservation) => reservation.activityId === scope);
  }, [overview, scope]);

  const addReservationDisabled = submitting || (!editing && scope === 'global');

  const resetForm = () => {
    setEditing(null);
    setAmount('');
    setPaymentType('CASH');
    setDescription('');
  };

  const startEdit = (reservation: BalanceReservation) => {
    setScope(reservation.activityId || 'global');
    setEditing(reservation);
    setAmount(String(reservation.amount));
    setPaymentType(reservation.paymentType);
    setDescription(reservation.description);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing && scope === 'global') {
      toast({ title: 'Activité requise', description: 'Sélectionnez une seule activité pour ajouter un montant non disponible.' });
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast({ title: 'Montant invalide', description: 'Saisissez un montant supérieur à 0.' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'Description requise', description: 'Décrivez pourquoi ce montant est indisponible.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: numericAmount,
        paymentType,
        description: description.trim(),
        activityId: scope === 'global' ? null : scope,
      };
      if (editing) {
        await updateBalanceReservation(editing.id, payload);
        toast({ title: 'Montant mis à jour' });
      } else {
        await createBalanceReservation(payload);
        toast({ title: 'Montant non disponible ajouté' });
      }
      resetForm();
      await refresh();
    } catch (error) {
      toast({ title: 'Impossible d’enregistrer', description: error instanceof Error ? error.message : 'Une erreur est survenue.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBalanceReservation(deleteTarget.id);
      if (editing?.id === deleteTarget.id) resetForm();
      toast({ title: 'Montant retiré des indisponibilités' });
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      toast({ title: 'Suppression impossible', description: error instanceof Error ? error.message : 'Une erreur est survenue.' });
    }
  };

  const scopeLabel = scope === 'global'
    ? 'Solde global'
    : activities.find((activity) => activity.id === scope)?.name ?? selectedActivity?.name ?? 'Activité';

  return (
    <div className="animate-fade-in">
      <Header title="Soldes disponibles" subtitle="Répartissez vos soldes par moyen de paiement" />
      <div className="space-y-6 p-6">
        <section className="stat-card space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg font-semibold text-foreground">Répartition des soldes</p>
              <p className="mt-1 text-xs text-muted-foreground">Le montant disponible est utilisé pour contrôler les sorties.</p>
            </div>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Portée
              <select
                value={scope}
                onChange={(event) => { setScope(event.target.value); resetForm(); }}
                disabled={Boolean(lockedActivityId)}
                className="min-w-52 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
              >
                <option value="global">Solde global</option>
                {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
              </select>
            </label>
          </div>

          {errorMessage && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>}
          {loading && !overview ? (
            <p className="py-6 text-sm text-muted-foreground">Chargement des soldes…</p>
          ) : balances ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(Object.keys(paymentMeta) as PaymentKey[]).map((key) => {
                const item = balances[key];
                const meta = paymentMeta[key];
                const Icon = meta.icon;
                const ratio = item.total > 0 ? Math.min(100, (item.available / item.total) * 100) : 0;
                return (
                  <div key={key} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={17} className={meta.color} />{meta.label}</div>
                      <Wallet size={15} className="text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Total suivi</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.total)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <p className="text-muted-foreground">Disponible</p>
                        <p className="mt-1 font-semibold text-emerald-400">{formatCurrency(item.available)}</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <p className="text-muted-foreground">Non disponible</p>
                        <p className="mt-1 font-semibold text-amber-300">{formatCurrency(item.unavailable)}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">Aucun solde disponible pour cette activité.</p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="stat-card">
            <div className="mb-4">
              <p className="font-display font-semibold text-foreground">{editing ? 'Modifier une part non disponible' : 'Réserver un montant'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Portée : {scopeLabel}</p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-1.5 text-xs text-muted-foreground">
                Moyen de paiement
                <select value={paymentType} onChange={(event) => setPaymentType(event.target.value as PaymentType)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground">
                  {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-xs text-muted-foreground">
                Montant non disponible (MGA)
                <input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" placeholder="0" />
              </label>
              <label className="block space-y-1.5 text-xs text-muted-foreground">
                Description
                <input required value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" placeholder="Ex. loyer du mois, fonds de réserve…" />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={addReservationDisabled} className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60" style={{ background: 'var(--gradient-primary)' }}>
                  <Plus size={15} />{submitting ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Ajouter au montant non disponible'}
                </button>
                {editing && <button type="button" onClick={resetForm} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">Annuler</button>}
              </div>
            {!editing && scope === 'global' && (
              <p className="text-xs text-muted-foreground">Sélectionnez une activité pour activer l'ajout.</p>
            )}
            </form>
          </section>

          <section className="stat-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-semibold text-foreground">Montants non disponibles</p>
                <p className="mt-1 text-xs text-muted-foreground">Les descriptions restent associées à leur moyen de paiement.</p>
              </div>
              <span className="badge-info">{visibleReservations.length} montant(s)</span>
            </div>
            <div className="space-y-2">
              {visibleReservations.length ? visibleReservations.map((reservation) => (
                <div key={reservation.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{reservation.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {paymentOptions.find((option) => option.value === reservation.paymentType)?.label ?? reservation.paymentType}
                      {' · '}{reservation.activityId ? reservation.activityName ?? 'Activité' : 'Global'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-sm font-semibold text-amber-300">{formatCurrency(reservation.amount)}</span>
                    <button type="button" title="Modifier" onClick={() => startEdit(reservation)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"><Pencil size={14} className="text-muted-foreground" /></button>
                    <button type="button" title="Supprimer" onClick={() => setDeleteTarget(reservation)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10"><Trash2 size={14} className="text-destructive" /></button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucun montant non disponible pour cette portée.</div>
              )}
            </div>
          </section>
        </div>
      </div>
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Rendre ce montant disponible ?"
        description={`Retirer « ${deleteTarget?.description ?? 'ce montant'} » des indisponibilités ?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
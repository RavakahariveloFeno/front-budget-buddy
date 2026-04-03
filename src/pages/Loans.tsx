import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronDown, ChevronRight, CreditCard, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Activity, Loan, LoanStatus } from "@/data/staticData";
import { getActivities } from "@/api/activityApi";
import { createLoan, deleteLoan, getLoanPaymentHistory, getLoans, updateLoan } from "@/api/loanApi";
import type { LoanPayload } from "@/api/loanApi";
import { createLoanPayment } from "@/api/loanPaymentApi";
import type { LoanPaymentPayload } from "@/api/loanPaymentApi";
import LoanForm from "@/components/forms/LoanForm";
import LoanPaymentForm from "@/components/forms/LoanPaymentForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { compareByMostRecent } from "@/lib/recent-sort";
import { useActivityFilterStore } from "@/stores/activityFilterStore";

const loanTypeLabels: Record<string, string> = { BANK: "Banque", FRIEND: "Ami", COMPANY: "Entreprise", OTHER: "Autre" };
const loanTypeColors: Record<string, string> = { BANK: "badge-info", FRIEND: "badge-warning", COMPANY: "badge-purple", OTHER: "badge-income" };
const paymentTypeBadge = (paymentType?: string) => {
  if (paymentType === "CASH") {
    return { label: "Espèces", className: "badge-income" };
  }
  return { label: "Carte", className: "badge-info" };
};
const directionBadge = (direction?: string) => {
  if (direction === "LENT") {
    return { label: "Prêt accordé", className: "badge-purple" };
  }
  return { label: "Emprunt", className: "badge-warning" };
};

export default function Loans() {
  const selectedActivityId = useActivityFilterStore((state) => state.selectedActivityId);
  const [loanList, setLoanList] = useState<Loan[]>([]);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Loan | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [paymentLoanId, setPaymentLoanId] = useState("");

  const loadLoans = async () => {
    try {
      const [remoteLoans, paymentHistory] = await Promise.all([getLoans(), getLoanPaymentHistory()]);
      const paymentsByLoanId = new Map(paymentHistory.map((item) => [item.loanId, item.payments]));

      const mergedLoans = remoteLoans.map((loan) => {
        const payments = [...(paymentsByLoanId.get(loan.id) || loan.payments || [])].sort(compareByMostRecent(["createdAt", "date"]));
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingAmount = Math.max(loan.totalAmount - totalPaid, 0);
        return {
          ...loan,
          remainingAmount,
          status: (remainingAmount === 0 ? "PAID" : "ACTIVE") as LoanStatus,
          payments,
        };
      });

      setLoanList(mergedLoans);
    } catch (error) {
      console.error("Impossible de charger les prets depuis l'API.", error);
      setLoanList([]);
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

    loadLoans();
    loadActivities();
  }, []);

  const activityById = useMemo(() => {
    const map = new Map<string, Activity>();
    for (const activity of activityList) {
      map.set(activity.id, activity);
    }
    return map;
  }, [activityList]);

  const filteredLoans = useMemo(
    () => (selectedActivityId ? loanList.filter((loan) => loan.activityId === selectedActivityId) : loanList),
    [loanList, selectedActivityId],
  );

  const normalizedLoans = filteredLoans.map((loan) => ({ ...loan, direction: loan.direction || "BORROWED" }));
  const loanSort = compareByMostRecent<Loan>(["createdAt", "endDate", "startDate", "date"]);

  const activeBorrowedLoans = useMemo(
    () => [...normalizedLoans].filter((loan) => loan.status === "ACTIVE" && loan.direction !== "LENT").sort(loanSort),
    [normalizedLoans],
  );
  const activeLentLoans = useMemo(
    () => [...normalizedLoans].filter((loan) => loan.status === "ACTIVE" && loan.direction === "LENT").sort(loanSort),
    [normalizedLoans],
  );
  const paidBorrowedLoans = useMemo(
    () => [...normalizedLoans].filter((loan) => loan.status === "PAID" && loan.direction !== "LENT").sort(loanSort),
    [normalizedLoans],
  );
  const paidLentLoans = useMemo(
    () => [...normalizedLoans].filter((loan) => loan.status === "PAID" && loan.direction === "LENT").sort(loanSort),
    [normalizedLoans],
  );
  const totalBorrowedRemaining = activeBorrowedLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  const totalLentRemaining = activeLentLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  const totalPaid = [...paidBorrowedLoans, ...paidLentLoans].reduce((sum, loan) => sum + loan.totalAmount, 0);
  const totalActiveCount = activeBorrowedLoans.length + activeLentLoans.length;

  const handleEdit = (loan: Loan) => {
    setEditItem(loan);
    setFormOpen(true);
  };
  const handleDelete = (loan: Loan) => {
    setDeleteTarget(loan);
    setDeleteOpen(true);
  };
  const handleAddPayment = (loanId: string) => {
    setPaymentLoanId(loanId);
    setPaymentFormOpen(true);
  };

  const handleCreate = async (payload: LoanPayload) => {
    const created = await createLoan(payload);
    setLoanList((prev) => [created, ...prev]);
    toast({ title: "Pret ajoute", description: created.lenderName });
  };

  const handleUpdate = async (id: string, payload: LoanPayload) => {
    const updated = await updateLoan(id, payload);
    setLoanList((prev) => prev.map((loan) => (loan.id === id ? updated : loan)));
    toast({ title: "Pret modifie", description: updated.lenderName });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteLoan(deleteTarget.id);
      setLoanList((prev) => prev.filter((loan) => loan.id !== deleteTarget.id));
      toast({ title: "Pret supprime" });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer le pret.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  const handleCreatePayment = async (payload: LoanPaymentPayload) => {
    await createLoanPayment(payload);
    await loadLoans();
    toast({ title: "Paiement ajoute", description: formatCurrency(payload.amount) });
  };

  return (
    <div className="animate-fade-in">
      <Header title="Prets" subtitle="Gerez vos emprunts et remboursements" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Restant a rembourser", value: formatCurrency(totalBorrowedRemaining), color: "hsl(var(--warning))", bg: "hsl(var(--warning-dim))" },
            { label: "Restant a recuperer", value: formatCurrency(totalLentRemaining), color: "hsl(var(--purple))", bg: "hsl(var(--purple-dim))" },
            { label: "Prets actifs", value: `${totalActiveCount} pret${totalActiveCount > 1 ? "s" : ""}`, color: "hsl(var(--destructive))", bg: "hsl(var(--destructive-dim))" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                <CreditCard size={18} style={{ color: stat.color }} />
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
            style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
          >
            <Plus size={16} /> Nouveau pret
          </button>
        </div>

        <div>
          <h2 className="font-display font-semibold text-base mb-3" style={{ color: "hsl(var(--foreground))" }}>
            Emprunts actifs <span className="badge-warning ml-2">{activeBorrowedLoans.length}</span>
          </h2>
          <div className="space-y-3">
            {activeBorrowedLoans.map((loan) => {
              const pct = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100);
              const isExpanded = expandedLoan === loan.id;
              const activity = loan.activityId ? activityById.get(loan.activityId) : undefined;

              return (
                <div key={loan.id} className="stat-card overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--warning-dim))" }}>
                        <CreditCard size={18} style={{ color: "hsl(var(--warning))" }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                          {loan.lenderName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={loanTypeColors[loan.type]}>{loanTypeLabels[loan.type]}</span>
                          <span className={directionBadge(loan.direction).className}>{directionBadge(loan.direction).label}</span>
                          <span className={paymentTypeBadge(loan.paymentType).className}>{paymentTypeBadge(loan.paymentType).label}</span>
                          {loan.interestRate && loan.interestRate > 0 && <span className="badge-info">{loan.interestRate}% / an</span>}
                          {activity && <span className="badge-purple text-xs">{activity.name}</span>}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="font-bold" style={{ color: "hsl(var(--warning))" }}>
                          {formatCurrency(loan.remainingAmount)}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          sur {formatCurrency(loan.totalAmount)}
                        </p>
                      </div>
                      {isExpanded ? <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))" }} /> : <ChevronRight size={16} style={{ color: "hsl(var(--muted-foreground))" }} />}
                    </div>
                  </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{color: "hsl(var(--muted-foreground))"}}>Remboursement</span>
                        <div className="relative flex items-center">
                          <div className="absolute right-full mr-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEdit(loan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                              <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </button>
                            <button type="button" onClick={() => handleDelete(loan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors">
                              <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                            </button>
                          </div>
                          <span style={{color: "hsl(var(--primary))"}}>{pct}%</span>
                        </div>
                       
                      </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Debut: {formatDate(loan.startDate)}</span>
                      {loan.endDate && <span style={{ color: "hsl(var(--muted-foreground))" }}>Fin: {formatDate(loan.endDate)}</span>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          Historique des paiements
                        </p>
                        <button onClick={() => handleAddPayment(loan.id)} className="text-xs px-3 py-1 rounded-lg" style={{ background: "hsl(var(--primary-dim))", color: "hsl(var(--primary))" }}>
                          + Ajouter paiement
                        </button>
                      </div>
                      <div className="space-y-2">
                        {loan.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                            <div>
                              <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                                {payment.note || "Paiement"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  {formatDate(payment.date)}
                                </p>
                                <span className={paymentTypeBadge(payment.paymentType).className}>{paymentTypeBadge(payment.paymentType).label}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-sm" style={{ color: "hsl(var(--primary))" }}>
                              -{formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                        {loan.payments.length === 0 && (
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Aucun paiement enregistre.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold text-base mb-3" style={{ color: "hsl(var(--foreground))" }}>
            Prets accordes actifs <span className="badge-purple ml-2">{activeLentLoans.length}</span>
          </h2>
          <div className="space-y-3">
            {activeLentLoans.map((loan) => {
              const pct = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100);
              const isExpanded = expandedLoan === loan.id;
              const activity = loan.activityId ? activityById.get(loan.activityId) : undefined;

              return (
                <div key={loan.id} className="stat-card overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--purple-dim))" }}>
                        <CreditCard size={18} style={{ color: "hsl(var(--purple))" }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                          {loan.lenderName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={loanTypeColors[loan.type]}>{loanTypeLabels[loan.type]}</span>
                          <span className={directionBadge(loan.direction).className}>{directionBadge(loan.direction).label}</span>
                          <span className={paymentTypeBadge(loan.paymentType).className}>{paymentTypeBadge(loan.paymentType).label}</span>
                          {activity && <span className="badge-purple text-xs">{activity.name}</span>}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="font-bold" style={{ color: "hsl(var(--purple))" }}>
                          {formatCurrency(loan.remainingAmount)}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          sur {formatCurrency(loan.totalAmount)}
                        </p>
                      </div>
                      {isExpanded ? <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))" }} /> : <ChevronRight size={16} style={{ color: "hsl(var(--muted-foreground))" }} />}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{color: "hsl(var(--muted-foreground))"}}>Remboursement</span>
                      <div className="relative flex items-center">
                          <div className="absolute right-full mr-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEdit(loan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                              <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                            </button>
                            <button type="button" onClick={() => handleDelete(loan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors">
                              <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                            </button>
                          </div>
                          <span style={{color: "hsl(var(--primary))"}}>{pct}%</span>
                        </div>
                      
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Debut: {formatDate(loan.startDate)}</span>
                      {loan.endDate && <span style={{ color: "hsl(var(--muted-foreground))" }}>Fin: {formatDate(loan.endDate)}</span>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          Historique des remboursements
                        </p>
                        <button onClick={() => handleAddPayment(loan.id)} className="text-xs px-3 py-1 rounded-lg" style={{ background: "hsl(var(--primary-dim))", color: "hsl(var(--primary))" }}>
                          + Ajouter remboursement
                        </button>
                      </div>
                      <div className="space-y-2">
                        {loan.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                            <div>
                              <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                                {payment.note || "Remboursement"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  {formatDate(payment.date)}
                                </p>
                                <span className={paymentTypeBadge(payment.paymentType).className}>{paymentTypeBadge(payment.paymentType).label}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-sm" style={{ color: "hsl(var(--primary))" }}>
                              +{formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                        {loan.payments.length === 0 && (
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Aucun remboursement enregistre.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold text-base mb-3" style={{ color: "hsl(var(--foreground))" }}>
            Prets rembourses <span className="badge-income ml-2">{paidBorrowedLoans.length + paidLentLoans.length}</span>
          </h2>
          <div className="space-y-3">
            {[...paidBorrowedLoans, ...paidLentLoans].sort(loanSort).map((loan) => (
              <div key={loan.id} className="stat-card opacity-60 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary-dim))" }}>
                      <CheckCircle2 size={18} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                        {loan.lenderName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={loanTypeColors[loan.type]}>{loanTypeLabels[loan.type]}</span>
                        <span className={directionBadge(loan.direction).className}>{directionBadge(loan.direction).label}</span>
                        <span className="badge-income">Rembourse</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="font-bold line-through" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {formatCurrency(loan.totalAmount)}
                      </p>
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {loan.startDate && loan.endDate ? `${formatDate(loan.startDate)} -> ${formatDate(loan.endDate)}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(loan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                        <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </button>
                      <button onClick={() => handleDelete(loan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors">
                        <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LoanForm open={formOpen} onOpenChange={setFormOpen} loan={editItem} activities={activityList} lockedActivityId={selectedActivityId} onCreate={handleCreate} onUpdate={handleUpdate} />
      <LoanPaymentForm open={paymentFormOpen} onOpenChange={setPaymentFormOpen} loanId={paymentLoanId} onCreate={handleCreatePayment} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer le pret"
        description={`Supprimer le pret de "${deleteTarget?.lenderName}" ? Tous les paiements associes seront supprimes.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

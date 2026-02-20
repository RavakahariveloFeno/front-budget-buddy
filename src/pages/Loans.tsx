import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, CreditCard, CheckCircle2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { loans, getActivityById, formatCurrency, formatDate } from "@/data/staticData";

const loanTypeLabels: Record<string, string> = { BANK: "🏦 Banque", FRIEND: "👤 Ami", COMPANY: "🏢 Entreprise", OTHER: "📋 Autre" };
const loanTypeColors: Record<string, string> = { BANK: "badge-info", FRIEND: "badge-warning", COMPANY: "badge-purple", OTHER: "badge-income" };

export default function Loans() {
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const paidLoans = loans.filter((l) => l.status === "PAID");
  const totalActive = activeLoans.reduce((s, l) => s + l.remainingAmount, 0);
  const totalPaid = paidLoans.reduce((s, l) => s + l.totalAmount, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Prêts" subtitle="Gérez vos emprunts et remboursements" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Restant à rembourser", value: formatCurrency(totalActive), color: "hsl(var(--warning))", bg: "hsl(var(--warning-dim))" },
            { label: "Prêts remboursés", value: formatCurrency(totalPaid), color: "hsl(var(--primary))", bg: "hsl(var(--primary-dim))" },
            { label: "Prêts actifs", value: `${activeLoans.length} prêt${activeLoans.length > 1 ? "s" : ""}`, color: "hsl(var(--destructive))", bg: "hsl(var(--destructive-dim))" },
          ].map((s) => (
            <div key={s.label} className="stat-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <CreditCard size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
          >
            <Plus size={16} /> Nouveau prêt
          </button>
        </div>

        {/* Active loans */}
        <div>
          <h2 className="font-display font-semibold text-base mb-3" style={{ color: "hsl(var(--foreground))" }}>
            Prêts actifs <span className="badge-warning ml-2">{activeLoans.length}</span>
          </h2>
          <div className="space-y-3">
            {activeLoans.map((loan) => {
              const pct = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100);
              const isExpanded = expandedLoan === loan.id;
              const act = getActivityById(loan.activityId || "");

              return (
                <div key={loan.id} className="stat-card overflow-hidden">
                  {/* Header */}
                  <button
                    className="w-full flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--warning-dim))" }}>
                        <CreditCard size={18} style={{ color: "hsl(var(--warning))" }} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{loan.lenderName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={loanTypeColors[loan.type]}>{loanTypeLabels[loan.type]}</span>
                          {loan.interestRate && loan.interestRate > 0 && (
                            <span className="badge-info">{loan.interestRate}% / an</span>
                          )}
                          {act && <span className="badge-purple text-xs">{act.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold" style={{ color: "hsl(var(--warning))" }}>{formatCurrency(loan.remainingAmount)}</p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>sur {formatCurrency(loan.totalAmount)}</p>
                      </div>
                      {isExpanded ? <ChevronDown size={16} style={{ color: "hsl(var(--muted-foreground))" }} /> : <ChevronRight size={16} style={{ color: "hsl(var(--muted-foreground))" }} />}
                    </div>
                  </button>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Remboursement</span>
                      <span style={{ color: "hsl(var(--primary))" }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Début: {formatDate(loan.startDate)}</span>
                      {loan.endDate && <span style={{ color: "hsl(var(--muted-foreground))" }}>Fin: {formatDate(loan.endDate)}</span>}
                    </div>
                  </div>

                  {/* Payments expanded */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Historique des paiements</p>
                        <button
                          className="text-xs px-3 py-1 rounded-lg"
                          style={{ background: "hsl(var(--primary-dim))", color: "hsl(var(--primary))" }}
                        >
                          + Ajouter paiement
                        </button>
                      </div>
                      <div className="space-y-2">
                        {loan.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                            <div>
                              <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{payment.note || "Paiement"}</p>
                              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(payment.date)}</p>
                            </div>
                            <span className="font-semibold text-sm" style={{ color: "hsl(var(--primary))" }}>
                              -{formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Paid loans */}
        <div>
          <h2 className="font-display font-semibold text-base mb-3" style={{ color: "hsl(var(--foreground))" }}>
            Prêts remboursés <span className="badge-income ml-2">{paidLoans.length}</span>
          </h2>
          <div className="space-y-3">
            {paidLoans.map((loan) => (
              <div key={loan.id} className="stat-card opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary-dim))" }}>
                      <CheckCircle2 size={18} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{loan.lenderName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={loanTypeColors[loan.type]}>{loanTypeLabels[loan.type]}</span>
                        <span className="badge-income">✓ Remboursé</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold line-through" style={{ color: "hsl(var(--muted-foreground))" }}>{formatCurrency(loan.totalAmount)}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {loan.startDate && loan.endDate ? `${formatDate(loan.startDate)} → ${formatDate(loan.endDate)}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

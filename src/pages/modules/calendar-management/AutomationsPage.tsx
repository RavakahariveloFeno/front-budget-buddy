import { useParams } from "react-router-dom";
import { Bell, Zap, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { useCalendarStore } from "@/stores/calendarStore";
import { formatCurrency } from "@/data/staticData";

const automationLabels: Record<string, string> = {
  NONE: "—",
  INCOME: "Revenu",
  EXPENSE: "Dépense",
};

export default function AutomationsPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const events = useCalendarStore((s) => s.events.filter((e) => e.activityId === activityId));

  const automations = events.filter((e) => e.automation.type !== "NONE");
  const triggered = automations.filter((e) => e.triggered).length;
  const pending = automations.length - triggered;
  const notifyCount = events.filter((e) => e.notify).length;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h2 className="font-display font-semibold text-lg" style={{ color: "hsl(var(--foreground))" }}>
          Automatisations
        </h2>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Suivi des actions automatiques planifiées sur l'agenda
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Zap size={20} style={{ color: "hsl(var(--primary))" }} />
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total</p>
              <p className="font-display font-semibold text-xl" style={{ color: "hsl(var(--foreground))" }}>{automations.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: "hsl(var(--chart-4))" }} />
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>En attente</p>
              <p className="font-display font-semibold text-xl" style={{ color: "hsl(var(--foreground))" }}>{pending}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} style={{ color: "hsl(var(--chart-2))" }} />
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Déclenchées</p>
              <p className="font-display font-semibold text-xl" style={{ color: "hsl(var(--foreground))" }}>{triggered}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
        <table className="w-full text-sm">
          <thead style={{ background: "hsl(var(--secondary))" }}>
            <tr>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Évènement</th>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Date</th>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Action</th>
              <th className="text-right p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Montant</th>
              <th className="text-center p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-60" />
                  Aucun évènement planifié.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <td className="p-3" style={{ color: "hsl(var(--foreground))" }}>
                  <div className="font-medium">{e.title}</div>
                  {e.note && <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{e.note}</div>}
                </td>
                <td className="p-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {new Date(e.start).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="p-3" style={{ color: "hsl(var(--foreground))" }}>{automationLabels[e.automation.type]}</td>
                <td className="p-3 text-right" style={{ color: "hsl(var(--foreground))" }}>
                  {e.automation.amount ? formatCurrency(e.automation.amount) : "—"}
                </td>
                <td className="p-3 text-center">
                  {e.triggered ? (
                    <span className="badge-income text-[10px]">Déclenchée</span>
                  ) : e.automation.type !== "NONE" ? (
                    <span className="badge-warning text-[10px]">Planifiée</span>
                  ) : e.notify ? (
                    <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Bell size={10} /> Notif
                    </span>
                  ) : (
                    <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

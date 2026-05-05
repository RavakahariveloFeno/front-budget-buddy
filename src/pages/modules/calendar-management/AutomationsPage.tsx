import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Bell, Zap, Calendar as CalendarIcon, CheckCircle2, Clock, Mail, Webhook } from "lucide-react";
import { useCalendarStore } from "@/stores/calendarStore";
import { formatCurrency } from "@/data/staticData";

const automationLabels: Record<string, string> = {
  NONE: "—",
  INCOME: "Revenu",
  EXPENSE: "Dépense",
};

export default function AutomationsPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const allEvents = useCalendarStore((s) => s.events);
  const events = useMemo(
    () => allEvents.filter((e) => e.activityId === activityId),
    [allEvents, activityId],
  );

  const automations = events.filter((e) => e.automation.type !== "NONE");
  const triggered = automations.filter((e) => e.triggered).length;
  const pending = automations.length - triggered;
  const notifyCount = events.filter((e) => e.notify).length;
  const reminderCount = events.filter((e) => (e.reminderMinutes ?? 0) > 0).length;
  const now = Date.now();
  const nextRuns = automations
    .filter((e) => !e.triggered && new Date(e.start).getTime() >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3);
  const emailTargets = events.filter((e) => Boolean(e.notificationTargets?.email)).length;
  const webhookTargets = events.filter((e) => Boolean(e.notificationTargets?.discordWebhook)).length;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Bell size={20} style={{ color: "hsl(var(--chart-1))" }} />
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Notifications actives</p>
              <p className="font-display font-semibold text-xl" style={{ color: "hsl(var(--foreground))" }}>{notifyCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: "hsl(var(--chart-3))" }} />
            <div>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Rappels configurés</p>
              <p className="font-display font-semibold text-xl" style={{ color: "hsl(var(--foreground))" }}>{reminderCount}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Prochaines exécutions automatiques</p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{nextRuns.length} planifiée(s)</p>
        </div>
        {nextRuns.length === 0 ? (
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Aucune automatisation à venir. Crée un évènement avec action automatique depuis l'agenda.
          </p>
        ) : (
          <div className="space-y-2">
            {nextRuns.map((event) => (
              <div
                key={event.id}
                className="rounded-lg px-3 py-2 flex items-center justify-between"
                style={{ background: "hsl(var(--secondary))" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{event.title}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {new Date(event.start).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <span className="badge-warning text-[10px]">{event.automation.type}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span className="inline-flex items-center gap-1"><Mail size={12} /> {emailTargets} cible(s) email</span>
          <span className="inline-flex items-center gap-1"><Webhook size={12} /> {webhookTargets} cible(s) Discord</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
        <table className="w-full text-sm">
          <thead style={{ background: "hsl(var(--secondary))" }}>
            <tr>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Évènement</th>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Date</th>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Action</th>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Rappel</th>
              <th className="text-left p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Cible notif.</th>
              <th className="text-right p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Montant</th>
              <th className="text-center p-3 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
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
                <td className="p-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {(e.reminderMinutes ?? 0) > 0 ? `${e.reminderMinutes} min avant` : "Aucun"}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {e.notificationTargets?.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={11} /> Email
                      </span>
                    )}
                    {e.notificationTargets?.discordWebhook && (
                      <span className="inline-flex items-center gap-1">
                        <Webhook size={11} /> Discord
                      </span>
                    )}
                    {!e.notificationTargets?.email && !e.notificationTargets?.discordWebhook && "—"}
                  </div>
                </td>
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

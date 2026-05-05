import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Bell, Zap, Calendar as CalendarIcon, CheckCircle2, Clock, Mail, Webhook, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCalendarStore, type AutomationType, type CalendarEvent } from "@/stores/calendarStore";
import { formatCurrency } from "@/data/staticData";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { deleteCalendarEvent, getCalendarEvents, updateCalendarEvent } from "@/api/calendarApi";

const automationLabels: Record<string, string> = {
  NONE: "—",
  INCOME: "Revenu",
  EXPENSE: "Dépense",
};

const automationOptions = [
  { value: "NONE", label: "Aucune" },
  { value: "INCOME", label: "Créer un revenu" },
  { value: "EXPENSE", label: "Créer une dépense" },
];

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AutomationsPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const allEvents = useCalendarStore((s) => s.events);
  const setEventsForActivity = useCalendarStore((s) => s.setEventsForActivity);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const events = useMemo(
    () => allEvents.filter((e) => e.activityId === activityId),
    [allEvents, activityId],
  );

  useEffect(() => {
    if (!activityId) {
      return;
    }

    const load = async () => {
      try {
        const remote = await getCalendarEvents(activityId);
        setEventsForActivity(activityId, remote);
      } catch (error) {
        console.error("Failed to load calendar events", error);
        toast.error("Impossible de charger les evenements");
      }
    };

    void load();
  }, [activityId, setEventsForActivity]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notify, setNotify] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState("15");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [autoType, setAutoType] = useState<AutomationType>("NONE");
  const [autoAmount, setAutoAmount] = useState("");
  const [autoDesc, setAutoDesc] = useState("");

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

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setNote("");
    setStart("");
    setEnd("");
    setNotify(true);
    setReminderMinutes("15");
    setNotifyEmail("");
    setDiscordWebhook("");
    setAutoType("NONE");
    setAutoAmount("");
    setAutoDesc("");
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setTitle(event.title);
    setNote(event.note || "");
    setStart(toLocalInput(new Date(event.start)));
    setEnd(toLocalInput(new Date(event.end)));
    setNotify(event.notify);
    setReminderMinutes(event.reminderMinutes !== undefined ? String(event.reminderMinutes) : "15");
    setNotifyEmail(event.notificationTargets?.email || "");
    setDiscordWebhook(event.notificationTargets?.discordWebhook || "");
    setAutoType(event.automation.type);
    setAutoAmount(event.automation.amount ? String(event.automation.amount) : "");
    setAutoDesc(event.automation.description || "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !activityId) {
      return;
    }
    if (!title.trim()) {
      toast.error("Titre requis");
      return;
    }
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail.trim())) {
      toast.error("Adresse e-mail invalide");
      return;
    }
    if (discordWebhook && !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/.+/.test(discordWebhook.trim())) {
      toast.error("Lien webhook Discord invalide");
      return;
    }
    const nextStart = new Date(start).toISOString();
    const payload: CalendarEvent = {
      ...editing,
      title: title.trim(),
      note: note.trim() || undefined,
      start: nextStart,
      end: new Date(end).toISOString(),
      notify,
      reminderMinutes: reminderMinutes ? Math.max(0, Number(reminderMinutes)) : 0,
      reminderSentAt: editing.reminderSentAt && editing.start === nextStart ? editing.reminderSentAt : undefined,
      notificationTargets: {
        email: notifyEmail.trim() || undefined,
        discordWebhook: discordWebhook.trim() || undefined,
      },
      activityId,
      notified: editing.notified && editing.start === nextStart ? true : false,
      triggered: editing.triggered && editing.start === nextStart ? true : false,
      automation: {
        type: autoType,
        amount: autoAmount ? Number(autoAmount) : undefined,
        description: autoDesc.trim() || undefined,
      },
    };
    try {
      const saved = await updateCalendarEvent(editing.id, payload);
      updateEvent(editing.id, saved);
    toast.success("Évènement mis à jour");
    setOpen(false);
    resetForm();
    } catch (error) {
      console.error("Calendar event save failed", error);
      toast.error("Sauvegarde impossible pour le moment");
    }
  };

  const handleDelete = async () => {
    if (!editing) {
      return;
    }
    try {
      await deleteCalendarEvent(editing.id);
      deleteEvent(editing.id);
    toast.success("Évènement supprimé");
    setOpen(false);
    resetForm();
    } catch (error) {
      console.error("Calendar event delete failed", error);
      toast.error("Suppression impossible pour le moment");
    }
  };

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
              <tr
                key={e.id}
                style={{ borderTop: "1px solid hsl(var(--border))" }}
                className="cursor-pointer hover:bg-secondary/40 transition-colors"
                onClick={() => openEdit(e)}
                title="Modifier cet évènement"
              >
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
      <FormDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
        title="Modifier l'évènement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormFieldInput label="Titre" id="auto-evt-title" value={title} onChange={setTitle} required />
          <FormFieldInput label="Note" id="auto-evt-note" value={note} onChange={setNote} />
          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput label="Début" id="auto-evt-start" type="datetime-local" value={start} onChange={setStart} required />
            <FormFieldInput label="Fin" id="auto-evt-end" type="datetime-local" value={end} onChange={setEnd} required />
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--foreground))" }}>
            <input type="checkbox" checked={notify} onChange={(evt) => setNotify(evt.target.checked)} />
            <Bell size={14} /> Activer la notification
          </label>
          <div className="space-y-3">
            <FormFieldInput
              label="Rappel (minutes avant)"
              id="auto-evt-reminder"
              type="number"
              min="0"
              value={reminderMinutes}
              onChange={setReminderMinutes}
            />
            <FormFieldInput
              label="Email notification (optionnel)"
              id="auto-evt-email"
              type="email"
              value={notifyEmail}
              onChange={setNotifyEmail}
            />
            <FormFieldInput
              label="Webhook Discord (optionnel)"
              id="auto-evt-webhook"
              type="url"
              value={discordWebhook}
              onChange={setDiscordWebhook}
            />
          </div>
          <div className="rounded-lg p-3 space-y-3" style={{ background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
              <Zap size={14} /> Action automatique
            </div>
            <SelectField
              label="Type"
              value={autoType}
              onValueChange={(v) => setAutoType(v as AutomationType)}
              options={automationOptions}
            />
            {autoType !== "NONE" && (
              <>
                <FormFieldInput
                  label="Montant (MGA)"
                  id="auto-evt-amount"
                  type="number"
                  value={autoAmount}
                  onChange={setAutoAmount}
                  required
                />
                <FormFieldInput
                  label="Description"
                  id="auto-evt-desc"
                  value={autoDesc}
                  onChange={setAutoDesc}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
              style={{ background: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))" }}
            >
              <Trash2 size={14} /> Supprimer
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Plus, Zap, Trash2 } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useCalendarStore, type CalendarEvent, type AutomationType, type RecurrenceFrequency } from "@/stores/calendarStore";
import Header from "@/components/layout/Header";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents, updateCalendarEvent } from "@/api/calendarApi";
import { useActivityFilterStore } from "@/stores/activityFilterStore";
import { getActivities } from "@/api/activityApi";
import { getActivityModules } from "@/api/moduleApi";
import { getCategories } from "@/api/categoryApi";
import type { Activity, Category, PaymentType } from "@/data/staticData";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CALENDAR_MODULE_ID = "mod-calendrier";

const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const automationOptions = [
  { value: "NONE", label: "Aucune" },
  { value: "INCOME", label: "Créer un revenu" },
  { value: "EXPENSE", label: "Créer une dépense" },
];

const paymentTypeOptions = [
  { value: "CARD", label: "Carte" },
  { value: "CASH", label: "Espèces" },
  { value: "MOBILE", label: "Compte mobile" },
];

const recurrenceOptions = [
  { value: "NONE", label: "Une seule fois" },
  { value: "DAILY", label: "Chaque jour" },
  { value: "WEEKLY", label: "Chaque semaine" },
  { value: "MONTHLY", label: "Chaque mois" },
];

const recurrenceEndOptions = [
  { value: "until", label: "Jusqu'à une date" },
  { value: "count", label: "Nombre d'occurrences" },
];

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toLocalDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function endOfDay(dateStr: string) {
  const d = new Date(`${dateStr}T23:59:59`);
  return d.toISOString();
}

function startOfDayIso(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toISOString();
}

export default function AgendaPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const selectedActivityId = useActivityFilterStore((s) => s.selectedActivityId);
  const events = useCalendarStore((s) => s.events);
  const setAllEvents = useCalendarStore((s) => s.setAllEvents);
  const setEventsForActivity = useCalendarStore((s) => s.setEventsForActivity);
  const addEvents = useCalendarStore((s) => s.addEvents);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);

  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [start, setStart] = useState(toLocalInput(new Date()));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [allDay, setAllDay] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("NONE");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndType, setRecurrenceEndType] = useState<"until" | "count">("until");
  const [recurrenceUntil, setRecurrenceUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return toLocalDateInput(d);
  });
  const [recurrenceCount, setRecurrenceCount] = useState("12");
  const [notify, setNotify] = useState(true);
  const [reminderDays, setReminderDays] = useState("1");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [autoType, setAutoType] = useState<AutomationType>("NONE");
  const [autoAmount, setAutoAmount] = useState("");
  const [autoDesc, setAutoDesc] = useState("");
  const [autoPaymentType, setAutoPaymentType] = useState<PaymentType>("CARD");
  const [autoCategoryId, setAutoCategoryId] = useState<string>("none");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [calendarEnabledByActivityId, setCalendarEnabledByActivityId] = useState<Record<string, boolean>>({});
  const [createActivityId, setCreateActivityId] = useState("");

  const showAllActivities = selectedActivityId === null;
  const effectiveActivityId = selectedActivityId ?? activityId;

  const eligibilityKnownForEffectiveActivity = useMemo(() => {
    if (showAllActivities) return true;
    if (!effectiveActivityId) return false;
    return Object.prototype.hasOwnProperty.call(calendarEnabledByActivityId, effectiveActivityId);
  }, [calendarEnabledByActivityId, effectiveActivityId, showAllActivities]);

  const isEffectiveActivityCalendarEnabled = useMemo(() => {
    if (showAllActivities) return true;
    if (!effectiveActivityId) return false;
    if (!eligibilityKnownForEffectiveActivity) return true;
    return Boolean(calendarEnabledByActivityId[effectiveActivityId]);
  }, [calendarEnabledByActivityId, effectiveActivityId, eligibilityKnownForEffectiveActivity, showAllActivities]);

  const calendarActivities = useMemo(() => {
    return activities.filter((a) => calendarEnabledByActivityId[a.id]);
  }, [activities, calendarEnabledByActivityId]);

  const refreshEvents = useCallback(async () => {
    if (showAllActivities) {
      const remote = await getCalendarEvents();
      setAllEvents(remote);
      return;
    }

    if (!effectiveActivityId) {
      return;
    }

    if (!isEffectiveActivityCalendarEnabled) {
      setEventsForActivity(effectiveActivityId, []);
      return;
    }

    const remote = await getCalendarEvents(effectiveActivityId);
    setEventsForActivity(effectiveActivityId, remote);
  }, [effectiveActivityId, isEffectiveActivityCalendarEnabled, setAllEvents, setEventsForActivity, showAllActivities]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const all = await getActivities();
        setActivities(all);
        const entries = await Promise.all(
          all.map(async (act) => {
            try {
              const mods = await getActivityModules(act.id);
              return [act.id, mods.includes(CALENDAR_MODULE_ID)] as const;
            } catch {
              return [act.id, false] as const;
            }
          }),
        );
        setCalendarEnabledByActivityId(Object.fromEntries(entries));
      } catch (error) {
        console.error("Failed to load activities for calendar module", error);
        setActivities([]);
        setCalendarEnabledByActivityId({});
      }
    };

    void loadActivities();
    void (async () => {
      try {
        setCategories(await getCategories());
      } catch (error) {
        console.error("Failed to load categories for calendar automation", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!showAllActivities || editing) {
      return;
    }
    if (createActivityId) {
      return;
    }
    if (calendarActivities.length > 0) {
      setCreateActivityId(calendarActivities[0].id);
    }
  }, [calendarActivities, createActivityId, editing, showAllActivities]);

  const activityEvents = useMemo(
    () => {
      if (!isEffectiveActivityCalendarEnabled) {
        return [];
      }
      return showAllActivities ? events : events.filter((e) => e.activityId === effectiveActivityId);
    },
    [events, showAllActivities, effectiveActivityId, isEffectiveActivityCalendarEnabled],
  );

  useEffect(() => {
    const load = async () => {
      try {
        await refreshEvents();
      } catch (error) {
        console.error("Failed to load calendar events", error);
      }
    };

    void load();
  }, [refreshEvents]);

  const calendarEvents = useMemo(
    () =>
      activityEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        resource: e,
      })),
    [activityEvents],
  );

  const dispatchNotification = useCallback((ev: CalendarEvent, mode: "REMINDER" | "EVENT") => {
  }, []);

  // Local-only notification while page is open (email/discord + automation run in backend)
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      for (const ev of activityEvents) {
        const eventTime = new Date(ev.start).getTime();
        const reminderAt = eventTime - (ev.reminderDays ?? 0) * 24 * 60 * 60 * 1000;
        const isReminderDue = reminderAt <= now && now < eventTime;
        const isEventDue = eventTime <= now;

        if (ev.notify && (ev.reminderDays ?? 0) > 0 && isReminderDue && !ev.reminderSentAt) {
          dispatchNotification(ev, "REMINDER");
          updateEvent(ev.id, { reminderSentAt: new Date().toISOString() });
        }

        if (isEventDue && !ev.notified) {
          dispatchNotification(ev, "EVENT");
          updateEvent(ev.id, { notified: true });
        }
      }
    };
    tick();
    const i = setInterval(tick, 30_000);
    return () => clearInterval(i);
  }, [activityEvents, updateEvent]);

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setNote("");
    setStart(toLocalInput(new Date()));
    setEnd(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
    setAllDay(false);
    setRecurrenceFrequency("NONE");
    setRecurrenceInterval("1");
    setRecurrenceEndType("until");
    const defaultUntil = new Date();
    defaultUntil.setMonth(defaultUntil.getMonth() + 3);
    setRecurrenceUntil(toLocalDateInput(defaultUntil));
    setRecurrenceCount("12");
    setNotify(true);
    setReminderDays("1");
    setNotifyEmail("");
    setDiscordWebhook("");
    setAutoType("NONE");
    setAutoAmount("");
    setAutoDesc("");
    setAutoPaymentType("CARD");
    setAutoCategoryId("none");
    setCreateActivityId("");
  };

  const openCreate = (slotStart?: Date) => {
    resetForm();
    if (slotStart) {
      setStart(toLocalInput(slotStart));
      setEnd(toLocalInput(new Date(slotStart.getTime() + 60 * 60 * 1000)));
    }
    setOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setTitle(ev.title);
    setNote(ev.note || "");
    setStart(toLocalInput(new Date(ev.start)));
    setEnd(toLocalInput(new Date(ev.end)));
    setAllDay(Boolean(ev.allDay));
    setRecurrenceFrequency(ev.recurrence?.frequency ?? "NONE");
    setRecurrenceInterval(String(ev.recurrence?.interval ?? 1));
    if (ev.recurrence?.until) {
      setRecurrenceEndType("until");
      setRecurrenceUntil(toLocalDateInput(new Date(ev.recurrence.until)));
    } else if (ev.recurrence?.count) {
      setRecurrenceEndType("count");
      setRecurrenceCount(String(ev.recurrence.count));
    } else {
      setRecurrenceEndType("until");
    }
    setNotify(ev.notify);
    setReminderDays(ev.reminderDays !== undefined ? String(ev.reminderDays) : "1");
    setNotifyEmail(ev.notificationTargets?.email || "");
    setDiscordWebhook(ev.notificationTargets?.discordWebhook || "");
    setAutoType(ev.automation.type);
    setAutoAmount(ev.automation.amount ? String(ev.automation.amount) : "");
    setAutoDesc(ev.automation.description || "");
    setAutoPaymentType((ev.automation.paymentType as PaymentType) || "CARD");
    setAutoCategoryId(ev.automation.categoryId || "none");
    setCreateActivityId(ev.activityId);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedActivityId = editing
      ? editing.activityId
      : showAllActivities
        ? createActivityId
        : effectiveActivityId;

    if (!title.trim()) {
      return;
    }
    if (!resolvedActivityId) {
      return;
    }
    if (
      Object.prototype.hasOwnProperty.call(calendarEnabledByActivityId, resolvedActivityId) &&
      !calendarEnabledByActivityId[resolvedActivityId]
    ) {
      return;
    }
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail.trim())) {
      return;
    }
    if (discordWebhook && !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/.+/.test(discordWebhook.trim())) {
      return;
    }
    const nextStart = allDay ? startOfDayIso(start.slice(0, 10)) : new Date(start).toISOString();
    const nextEnd = allDay ? endOfDay(end.slice(0, 10)) : new Date(end).toISOString();

    if (new Date(nextEnd).getTime() < new Date(nextStart).getTime()) {
      return;
    }

    const interval = Math.max(1, Number(recurrenceInterval) || 1);
    const recurrence =
      recurrenceFrequency !== "NONE"
        ? {
            frequency: recurrenceFrequency,
            interval,
            ...(recurrenceEndType === "until"
              ? { until: endOfDay(recurrenceUntil) }
              : { count: Math.max(2, Number(recurrenceCount) || 2) }),
          }
        : { frequency: "NONE" as const };

    const payload = {
      title: title.trim(),
      note: note.trim() || undefined,
      start: nextStart,
      end: nextEnd,
      allDay,
      notify,
      reminderDays: reminderDays ? Math.max(0, Number(reminderDays)) : 0,
      reminderSentAt: editing?.reminderSentAt && editing.start === nextStart ? editing.reminderSentAt : undefined,
      notificationTargets: {
        email: notifyEmail.trim() || undefined,
        discordWebhook: discordWebhook.trim() || undefined,
      },
      activityId: resolvedActivityId,
      notified: editing?.notified && editing.start === nextStart ? true : false,
      triggered: editing?.triggered && editing.start === nextStart ? true : false,
      automation: {
        type: autoType,
        amount: autoAmount ? Number(autoAmount) : undefined,
        description: autoDesc.trim() || undefined,
        paymentType: autoType !== "NONE" ? autoPaymentType : undefined,
        categoryId: autoType === "EXPENSE" && autoCategoryId !== "none" ? autoCategoryId : undefined,
      },
      recurrence,
    } as any;
    try {
      if (editing) {
      const saved = await updateCalendarEvent(editing.id, payload);
      if (Array.isArray(saved)) {
        await refreshEvents();
      } else {
        updateEvent(editing.id, saved);
      }
    } else {
        const saved = await createCalendarEvent(payload);
        addEvents(saved);
    }
    setOpen(false);
    resetForm();
    } catch (error) {
      console.error("Calendar event save failed", error);
    }
  };

  const handleDelete = async () => {
    if (editing) {
      try {
        await deleteCalendarEvent(editing.id);
        if (editing.seriesId) {
          await refreshEvents();
        } else {
          deleteEvent(editing.id);
        }
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error("Calendar event delete failed", error);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Agenda & automatisations" subtitle={`${activityEvents.length} evenement(s) planifie(s)`} />
      <div className="p-6 space-y-4">
        {!isEffectiveActivityCalendarEnabled ? (
          <div
            className="rounded-xl p-4"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              Cette activité n'utilise pas le module calendrier.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end flex-wrap gap-3">
              <button
                onClick={() => openCreate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
              >
                <Plus size={16} /> Nouvel évènement
              </button>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div style={{ height: 600 }} className="pilgo-calendar">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                  selectable
                  onSelectSlot={(slot) => openCreate(slot.start as Date)}
                  onSelectEvent={(ev) => openEdit(ev.resource as CalendarEvent)}
                  culture="fr"
                  messages={{
                    next: "Suivant",
                    previous: "Précédent",
                    today: "Aujourd'hui",
                    month: "Mois",
                    week: "Semaine",
                    day: "Jour",
                    agenda: "Agenda",
                    date: "Date",
                    time: "Heure",
                    event: "Évènement",
                    noEventsInRange: "Aucun évènement",
                  }}
                  eventPropGetter={(ev) => {
                    const r = ev.resource as CalendarEvent;
                    const color =
                      r.automation.type === "INCOME"
                        ? "hsl(var(--chart-2))"
                        : r.automation.type === "EXPENSE"
                          ? "hsl(var(--destructive))"
                          : "hsl(var(--primary))";
                    return { style: { background: color, border: "none", borderRadius: 6, fontSize: 12 } };
                  }}
                />
              </div>
            </div>
          </>
        )}

      <FormDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
        title={editing ? "Modifier l'évènement" : "Nouvel évènement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {showAllActivities && (
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Activité *
              </Label>
              <Select
                value={createActivityId || (editing ? editing.activityId : "")}
                onValueChange={setCreateActivityId}
                disabled={Boolean(editing)}
              >
                <SelectTrigger
                  disabled={Boolean(editing)}
                  className="border-border"
                  style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}
                >
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent style={{ background: "hsl(225, 27%, 12%)", borderColor: "hsl(var(--border))" }}>
                  {activities.map((act) => (
                    <SelectItem key={act.id} value={act.id} disabled={!calendarEnabledByActivityId[act.id]}>
                      {act.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <FormFieldInput label="Titre" id="evt-title" value={title} onChange={setTitle} placeholder="Ex: Loyer mensuel" required />
          <FormFieldInput label="Note" id="evt-note" value={note} onChange={setNote} placeholder="Détail optionnel" />

          <label className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--foreground))" }}>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => {
                const checked = e.target.checked;
                setAllDay(checked);
                if (checked) {
                  setStart(toLocalDateInput(new Date(start)));
                  setEnd(toLocalDateInput(new Date(end)));
                } else {
                  setStart(toLocalInput(new Date(`${start.slice(0, 10)}T09:00:00`)));
                  setEnd(toLocalInput(new Date(`${end.slice(0, 10)}T10:00:00`)));
                }
              }}
            />
            Journée entière
          </label>

          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput
              label="Début"
              id="evt-start"
              type={allDay ? "date" : "datetime-local"}
              value={allDay ? start.slice(0, 10) : start}
              onChange={(v) => setStart(allDay ? v : v)}
              required
            />
            <FormFieldInput
              label="Fin"
              id="evt-end"
              type={allDay ? "date" : "datetime-local"}
              value={allDay ? end.slice(0, 10) : end}
              onChange={(v) => setEnd(allDay ? v : v)}
              required
            />
          </div>

          {showAllActivities && (
            <div className="space-y-1.5">
              <Label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Activité *
              </Label>
              <Select
                value={createActivityId || (editing ? editing.activityId : "")}
                onValueChange={setCreateActivityId}
                disabled={Boolean(editing)}
              >
                <SelectTrigger
                  disabled={Boolean(editing)}
                  className="border-border"
                  style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}
                >
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent style={{ background: "hsl(225, 27%, 12%)", borderColor: "hsl(var(--border))" }}>
                  {activities.map((act) => (
                    <SelectItem key={act.id} value={act.id} disabled={!calendarEnabledByActivityId[act.id]}>
                      {act.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-lg p-3 space-y-3" style={{ background: "hsl(var(--secondary))" }}>
              <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                Récurrence
              </p>
              <SelectField
                label="Fréquence"
                value={recurrenceFrequency}
                onValueChange={(v) => setRecurrenceFrequency(v as RecurrenceFrequency)}
                options={recurrenceOptions}
              />
              {recurrenceFrequency !== "NONE" && (
                <>
                  <FormFieldInput
                    label={
                      recurrenceFrequency === "DAILY"
                        ? "Tous les (jours)"
                        : recurrenceFrequency === "WEEKLY"
                          ? "Toutes les (semaines)"
                          : "Tous les (mois)"
                    }
                    id="evt-recurrence-interval"
                    type="number"
                    min="1"
                    value={recurrenceInterval}
                    onChange={setRecurrenceInterval}
                    required
                  />
                  <SelectField
                    label="Fin de la série"
                    value={recurrenceEndType}
                    onValueChange={(v) => setRecurrenceEndType(v as "until" | "count")}
                    options={recurrenceEndOptions}
                  />
                  {recurrenceEndType === "until" ? (
                    <FormFieldInput
                      label="Date de fin"
                      id="evt-recurrence-until"
                      type="date"
                      value={recurrenceUntil}
                      onChange={setRecurrenceUntil}
                      required
                    />
                  ) : (
                    <FormFieldInput
                      label="Nombre d'occurrences"
                      id="evt-recurrence-count"
                      type="number"
                      min="2"
                      
                      value={recurrenceCount}
                      onChange={setRecurrenceCount}
                      required
                    />
                  )}
                </>
              )}
            </div>

          {editing?.seriesId && (
            <p className="text-xs rounded-md px-2 py-1.5" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))" }}>
              Cet évènement fait partie d'une série récurrente. La modification ne s'applique qu'à cette occurrence.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--foreground))" }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <Bell size={14} /> Activer la notification
          </label>
          <div className="space-y-3">
            <FormFieldInput
              label="Rappel (jours avant)"
              id="evt-reminder"
              type="number"
              min="0"
              value={reminderDays}
              onChange={setReminderDays}
              placeholder="1"
            />
            <FormFieldInput
              label="Email notification (optionnel)"
              id="evt-notify-email"
              type="email"
              value={notifyEmail}
              onChange={setNotifyEmail}
              placeholder="vous@exemple.com"
            />
            <FormFieldInput
              label="Webhook Discord (optionnel)"
              id="evt-discord-webhook"
              type="url"
              value={discordWebhook}
              onChange={setDiscordWebhook}
              placeholder="https://discord.com/api/webhooks/..."
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
                  id="evt-amount"
                  type="number"
                  value={autoAmount}
                  onChange={setAutoAmount}
                  placeholder="0"
                  required
                />
                <FormFieldInput
                  label="Description"
                  id="evt-auto-desc"
                  value={autoDesc}
                  onChange={setAutoDesc}
                  placeholder="Reprend le titre si vide"
                />
                <SelectField
                  label="Mode de paiement"
                  value={autoPaymentType}
                  onValueChange={(v) => setAutoPaymentType(v as PaymentType)}
                  options={paymentTypeOptions}
                />
                {autoType === "EXPENSE" && (
                  <SelectField
                    label="Catégorie"
                    value={autoCategoryId}
                    onValueChange={setAutoCategoryId}
                    options={[
                      { value: "none", label: "Aucune" },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editing && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
                style={{ background: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))" }}
              >
                <Trash2 size={14} /> Supprimer
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
            >
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </FormDialog>
      </div>
    </div>
  );
}




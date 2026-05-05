import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Plus, Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useCalendarStore, type CalendarEvent, type AutomationType } from "@/stores/calendarStore";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { createIncome } from "@/api/incomeApi";
import { createExpense } from "@/api/expenseApi";

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

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AgendaPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const events = useCalendarStore((s) => s.events);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const markNotified = useCalendarStore((s) => s.markNotified);
  const markTriggered = useCalendarStore((s) => s.markTriggered);

  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [start, setStart] = useState(toLocalInput(new Date()));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [notify, setNotify] = useState(true);
  const [autoType, setAutoType] = useState<AutomationType>("NONE");
  const [autoAmount, setAutoAmount] = useState("");
  const [autoDesc, setAutoDesc] = useState("");

  const activityEvents = useMemo(
    () => events.filter((e) => e.activityId === activityId),
    [events, activityId],
  );

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

  // Notification + automation polling
  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      for (const ev of activityEvents) {
        const t = new Date(ev.start).getTime();
        if (t <= now && !ev.notified) {
          if (ev.notify) {
            toast(ev.title, {
              description: ev.note || (ev.automation.type !== "NONE" ? "Action automatique en cours…" : undefined),
              icon: <Bell size={16} />,
            });
          }
          markNotified(ev.id);

          if (ev.automation.type !== "NONE" && !ev.triggered && ev.automation.amount) {
            try {
              if (ev.automation.type === "INCOME") {
                await createIncome({
                  amount: ev.automation.amount,
                  date: new Date(ev.start).toISOString(),
                  description: ev.automation.description || ev.title,
                  activityId: ev.activityId,
                });
                toast.success("Revenu créé automatiquement", { description: ev.title });
              } else if (ev.automation.type === "EXPENSE") {
                await createExpense({
                  amount: ev.automation.amount,
                  date: new Date(ev.start).toISOString(),
                  description: ev.automation.description || ev.title,
                  activityId: ev.activityId,
                  categoryId: ev.automation.categoryId,
                });
                toast.success("Dépense créée automatiquement", { description: ev.title });
              }
              markTriggered(ev.id);
            } catch (err) {
              console.error("Automation failed", err);
              toast.error("Echec de l'action automatique", { description: ev.title });
            }
          }
        }
      }
    };
    tick();
    const i = setInterval(tick, 30_000);
    return () => clearInterval(i);
  }, [activityEvents, markNotified, markTriggered]);

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setNote("");
    setStart(toLocalInput(new Date()));
    setEnd(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
    setNotify(true);
    setAutoType("NONE");
    setAutoAmount("");
    setAutoDesc("");
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
    setNotify(ev.notify);
    setAutoType(ev.automation.type);
    setAutoAmount(ev.automation.amount ? String(ev.automation.amount) : "");
    setAutoDesc(ev.automation.description || "");
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activityId) {
      toast.error("Titre requis");
      return;
    }
    const payload: CalendarEvent = {
      id: editing?.id || `evt-${Date.now()}`,
      title: title.trim(),
      note: note.trim() || undefined,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      notify,
      activityId,
      notified: editing?.notified && editing.start === new Date(start).toISOString() ? true : false,
      triggered: editing?.triggered && editing.start === new Date(start).toISOString() ? true : false,
      automation: {
        type: autoType,
        amount: autoAmount ? Number(autoAmount) : undefined,
        description: autoDesc.trim() || undefined,
      },
    };
    if (editing) {
      updateEvent(editing.id, payload);
      toast.success("Évènement mis à jour");
    } else {
      addEvent(payload);
      toast.success("Évènement créé");
    }
    setOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (editing) {
      deleteEvent(editing.id);
      toast.success("Évènement supprimé");
      setOpen(false);
      resetForm();
    }
  };

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg" style={{ color: "hsl(var(--foreground))" }}>
            Agenda & automatisations
          </h2>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {activityEvents.length} évènement(s) planifié(s)
          </p>
        </div>
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

      <FormDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
        title={editing ? "Modifier l'évènement" : "Nouvel évènement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormFieldInput label="Titre" id="evt-title" value={title} onChange={setTitle} placeholder="Ex: Loyer mensuel" required />
          <FormFieldInput label="Note" id="evt-note" value={note} onChange={setNote} placeholder="Détail optionnel" />
          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput label="Début" id="evt-start" type="datetime-local" value={start} onChange={setStart} required />
            <FormFieldInput label="Fin" id="evt-end" type="datetime-local" value={end} onChange={setEnd} required />
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--foreground))" }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <Bell size={14} /> Activer la notification
          </label>

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
  );
}

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, ActivityType } from "@/data/staticData";
import { PREDEFINED_MODULES } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";
import type { ActivityPayload } from "@/api/activityApi";
import { useModuleStore } from "@/stores/moduleStore";
import { getActivityModules, setActivityModules } from "@/api/moduleApi";
import { getCurrentUser } from "@/api/authApi";

const typeOptions = [
  { value: "SALARY", label: "Salaire" },
  { value: "BUSINESS", label: "Business" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "OTHER", label: "Autre" },
];

const AVAILABLE_MODULE_IDS = new Set(["mod-vente", "mod-comptabilite"]);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onCreate: (payload: ActivityPayload) => Promise<Activity | void>;
  onUpdate: (id: string, payload: ActivityPayload) => Promise<void>;
}

export default function ActivityForm({ open, onOpenChange, activity, onCreate, onUpdate }: Props) {
  const defaultVisibleModules = 3;
  const isEdit = Boolean(activity);
  const isManagedProfile = Boolean(getCurrentUser()?.profileId);
  const [name, setName] = useState("");
  const [type, setType] = useState<ActivityType>("SALARY");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [showAllModules, setShowAllModules] = useState(false);

  const { setLinks } = useModuleStore();

  useEffect(() => {
    if (!open) return;
    setName(activity?.name || "");
    setType(activity?.type || "SALARY");
    setDescription(activity?.description || "");
    setStartDate(activity?.startDate ? activity.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    if (activity && activity.id) {
      getActivityModules(activity.id)
        .then((ids) => setSelectedModules(ids.filter((id) => AVAILABLE_MODULE_IDS.has(id))))
        .catch(() => setSelectedModules([]));
    } else {
      setSelectedModules([]);
    }
    setShowAllModules(false);
  }, [activity, open]);

  const toggleModule = (moduleId: string) => {
    if (!AVAILABLE_MODULE_IDS.has(moduleId)) {
      return;
    }
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isManagedProfile) {
      toast({ title: "Acces refuse", description: "Seul le compte principal peut gerer les activites." });
      onOpenChange(false);
      return;
    }
    const payload: ActivityPayload = {
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      startDate,
    };

    if (!payload.name) {
      toast({ title: "Nom requis", description: "Veuillez renseigner le nom de l'activite." });
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit && activity) {
        const safeModules = selectedModules.filter((id) => AVAILABLE_MODULE_IDS.has(id));
        await onUpdate(activity.id, payload);
        await setActivityModules(activity.id, safeModules);
        setLinks(activity.id, safeModules);
      } else {
        const created = await onCreate(payload);
        if (created && created.id) {
          const safeModules = selectedModules.filter((id) => AVAILABLE_MODULE_IDS.has(id));
          await setActivityModules(created.id, safeModules);
          setLinks(created.id, safeModules);
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement d'activite.", error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer l'activite." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasManyModules = PREDEFINED_MODULES.length > defaultVisibleModules;
  const modulesToDisplay = showAllModules ? PREDEFINED_MODULES : PREDEFINED_MODULES.slice(0, defaultVisibleModules);

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier l'activite" : "Nouvelle activite"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Nom" id="act-name" value={name} onChange={setName} placeholder="Ex: Emploi CDI" required />
        <SelectField label="Type" value={type} onValueChange={(value) => setType(value as ActivityType)} options={typeOptions} />
        <FormFieldInput label="Description" id="act-desc" value={description} onChange={setDescription} placeholder="Description optionnelle" />
        <FormFieldInput label="Date de debut" id="act-date" type="date" value={startDate} onChange={setStartDate} required />

        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>
            Modules associes
          </label>
          <div className="space-y-2">
            {modulesToDisplay.map((mod) => {
              const isSelected = selectedModules.includes(mod.id);
              const isAvailable = AVAILABLE_MODULE_IDS.has(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  disabled={!isAvailable}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    borderColor: isSelected ? `hsl(var(--${mod.color}))` : "hsl(var(--border))",
                    background: isSelected ? `hsl(var(--${mod.color}-dim))` : "transparent",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md border flex items-center justify-center text-xs flex-shrink-0 transition-all"
                    style={{
                      borderColor: isSelected ? `hsl(var(--${mod.color}))` : "hsl(var(--muted-foreground) / 0.4)",
                      background: isSelected ? `hsl(var(--${mod.color}))` : "transparent",
                      boxShadow: isSelected ? `0 0 0 2px hsl(var(--${mod.color}) / 0.22)` : "none",
                      color: isSelected ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium flex-1 truncate" style={{ color: "hsl(var(--foreground))" }}>
                        {mod.name}
                      </p>
                      {mod.id === "mod-comptabilite" && <span className="badge-warning text-[10px]">En cours</span>}
                      {mod.id === "mod-vente" && <span className="badge-income text-[10px]">Disponible</span>}
                    </div>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {mod.menus.map((m) => m.label).join(", ")}
                    </p>
                  </div>
                  {!isAvailable && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                      À venir
                    </span>
                  )}
                </button>
              );
            })}
            {hasManyModules && (
              <button
                type="button"
                onClick={() => setShowAllModules((prev) => !prev)}
                className="w-full py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-accent"
                style={{
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {showAllModules ? "Voir moins" : `Voir plus (${PREDEFINED_MODULES.length - defaultVisibleModules})`}
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
        >
          {isSubmitting ? "En cours..." : isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

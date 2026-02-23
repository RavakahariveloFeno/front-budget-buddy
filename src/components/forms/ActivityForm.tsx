import { useEffect, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, ActivityType } from "@/data/staticData";
import { PREDEFINED_MODULES } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";
import type { ActivityPayload } from "@/api/activityApi";
import { useModuleStore } from "@/stores/moduleStore";

const typeOptions = [
  { value: "SALARY", label: "Salaire" },
  { value: "BUSINESS", label: "Business" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "OTHER", label: "Autre" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onCreate: (payload: ActivityPayload) => Promise<Activity | void>;
  onUpdate: (id: string, payload: ActivityPayload) => Promise<void>;
}

export default function ActivityForm({ open, onOpenChange, activity, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(activity);
  const [name, setName] = useState("");
  const [type, setType] = useState<ActivityType>("SALARY");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const { getModuleIds, setLinks } = useModuleStore();

  useEffect(() => {
    if (!open) return;
    setName(activity?.name || "");
    setType(activity?.type || "SALARY");
    setDescription(activity?.description || "");
    setStartDate(activity?.startDate ? activity.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setSelectedModules(activity ? getModuleIds(activity.id) : []);
  }, [activity, open]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        await onUpdate(activity.id, payload);
        setLinks(activity.id, selectedModules);
      } else {
        const created = await onCreate(payload);
        if (created && created.id) {
          setLinks(created.id, selectedModules);
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

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier l'activite" : "Nouvelle activite"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Nom" id="act-name" value={name} onChange={setName} placeholder="Ex: Emploi CDI" required />
        <SelectField label="Type" value={type} onValueChange={(value) => setType(value as ActivityType)} options={typeOptions} />
        <FormFieldInput label="Description" id="act-desc" value={description} onChange={setDescription} placeholder="Description optionnelle" />
        <FormFieldInput label="Date de debut" id="act-date" type="date" value={startDate} onChange={setStartDate} required />

        {/* Module multi-select */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "hsl(var(--foreground))" }}>
            Modules associés
          </label>
          <div className="space-y-2">
            {PREDEFINED_MODULES.map((mod) => {
              const isSelected = selectedModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                  style={{
                    borderColor: isSelected ? `hsl(var(--${mod.color}))` : "hsl(var(--border))",
                    background: isSelected ? `hsl(var(--${mod.color}-dim))` : "transparent",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: isSelected ? `hsl(var(--${mod.color}))` : "hsl(var(--secondary))",
                      color: isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isSelected ? "✓" : ""}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                      {mod.name}
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {mod.menus.map((m) => m.label).join(", ")}
                    </p>
                  </div>
                </button>
              );
            })}
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

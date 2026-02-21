import { useEffect, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, ActivityType } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";
import type { ActivityPayload } from "@/api/activityApi";

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
  onCreate: (payload: ActivityPayload) => Promise<void>;
  onUpdate: (id: string, payload: ActivityPayload) => Promise<void>;
}

export default function ActivityForm({ open, onOpenChange, activity, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(activity);
  const [name, setName] = useState("");
  const [type, setType] = useState<ActivityType>("SALARY");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(activity?.name || "");
    setType(activity?.type || "SALARY");
    setDescription(activity?.description || "");
    setStartDate(activity?.startDate ? activity.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
  }, [activity, open]);

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
      } else {
        await onCreate(payload);
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

import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Activity, ActivityType } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

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
}

export default function ActivityForm({ open, onOpenChange, activity }: Props) {
  const isEdit = !!activity;
  const [name, setName] = useState(activity?.name || "");
  const [type, setType] = useState<string>(activity?.type || "SALARY");
  const [description, setDescription] = useState(activity?.description || "");
  const [startDate, setStartDate] = useState(activity?.startDate || new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Activité modifiée" : "Activité ajoutée", description: name });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier l'activité" : "Nouvelle activité"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Nom" id="act-name" value={name} onChange={setName} placeholder="Ex: Emploi CDI" required />
        <SelectField label="Type" value={type} onValueChange={setType} options={typeOptions} />
        <FormFieldInput label="Description" id="act-desc" value={description} onChange={setDescription} placeholder="Description optionnelle" />
        <FormFieldInput label="Date de début" id="act-date" type="date" value={startDate} onChange={setStartDate} required />
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
        >
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

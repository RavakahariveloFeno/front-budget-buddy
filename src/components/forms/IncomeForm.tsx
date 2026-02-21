import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Income, activities } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

const paymentOptions = [
  { value: "CARD", label: "💳 Carte" },
  { value: "CASH", label: "💵 Espèces" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income | null;
}

export default function IncomeForm({ open, onOpenChange, income }: Props) {
  const isEdit = !!income;
  const [amount, setAmount] = useState(income?.amount?.toString() || "");
  const [description, setDescription] = useState(income?.description || "");
  const [date, setDate] = useState(income?.date || new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<string>(income?.paymentType || "CARD");
  const [activityId, setActivityId] = useState(income?.activityId || "");

  const activityOptions = activities.map((a) => ({ value: a.id, label: a.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Revenu modifié" : "Revenu ajouté", description: `${amount} €` });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le revenu" : "Nouveau revenu"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (€)" id="inc-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <FormFieldInput label="Description" id="inc-desc" value={description} onChange={setDescription} placeholder="Ex: Salaire janvier" />
        <FormFieldInput label="Date" id="inc-date" type="date" value={date} onChange={setDate} required />
        <SelectField label="Mode de paiement" value={paymentType} onValueChange={setPaymentType} options={paymentOptions} />
        <SelectField label="Activité" value={activityId} onValueChange={setActivityId} options={[{ value: "", label: "Aucune" }, ...activityOptions]} placeholder="Sélectionner une activité" />
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

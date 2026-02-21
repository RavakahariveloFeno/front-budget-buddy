import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Budget } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

const periodOptions = [
  { value: "DAY", label: "Par jour" },
  { value: "WEEK", label: "Par semaine" },
  { value: "MONTH", label: "Par mois" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
}

export default function BudgetForm({ open, onOpenChange, budget }: Props) {
  const isEdit = !!budget;
  const [amount, setAmount] = useState(budget?.amount?.toString() || "");
  const [period, setPeriod] = useState<string>(budget?.period || "MONTH");
  const [startDate, setStartDate] = useState(budget?.startDate || new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Budget modifié" : "Budget ajouté", description: `${amount} €` });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le budget" : "Nouveau budget"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (€)" id="bud-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <SelectField label="Période" value={period} onValueChange={setPeriod} options={periodOptions} />
        <FormFieldInput label="Date de début" id="bud-date" type="date" value={startDate} onChange={setStartDate} required />
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

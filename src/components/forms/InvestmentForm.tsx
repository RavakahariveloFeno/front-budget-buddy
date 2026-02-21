import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Investment, activities } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
}

export default function InvestmentForm({ open, onOpenChange, investment }: Props) {
  const isEdit = !!investment;
  const [amount, setAmount] = useState(investment?.amount?.toString() || "");
  const [fromActivityId, setFromActivityId] = useState(investment?.fromActivityId || "");
  const [toActivityId, setToActivityId] = useState(investment?.toActivityId || "");
  const [date, setDate] = useState(investment?.date || new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState(investment?.note || "");

  const actOptions = activities.map((a) => ({ value: a.id, label: a.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Transfert modifié" : "Transfert ajouté", description: `${amount} €` });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le transfert" : "Nouveau transfert"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (€)" id="inv-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <SelectField label="Activité source" value={fromActivityId} onValueChange={setFromActivityId} options={actOptions} placeholder="De..." />
        <SelectField label="Activité destination" value={toActivityId} onValueChange={setToActivityId} options={actOptions} placeholder="Vers..." />
        <FormFieldInput label="Date" id="inv-date" type="date" value={date} onChange={setDate} required />
        <FormFieldInput label="Note" id="inv-note" value={note} onChange={setNote} placeholder="Ex: Apport initial" />
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-purple)", color: "hsl(var(--primary-foreground))" }}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

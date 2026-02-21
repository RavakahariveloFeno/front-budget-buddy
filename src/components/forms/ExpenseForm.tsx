import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Expense, activities, categories } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export default function ExpenseForm({ open, onOpenChange, expense }: Props) {
  const isEdit = !!expense;
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [description, setDescription] = useState(expense?.description || "");
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState(expense?.categoryId || "");
  const [activityId, setActivityId] = useState(expense?.activityId || "");

  const catOptions = categories.map((c) => ({ value: c.id, label: `${c.icon || ""} ${c.name}` }));
  const actOptions = activities.map((a) => ({ value: a.id, label: a.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Dépense modifiée" : "Dépense ajoutée", description: `${amount} €` });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier la dépense" : "Nouvelle dépense"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (€)" id="exp-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <FormFieldInput label="Description" id="exp-desc" value={description} onChange={setDescription} placeholder="Ex: Courses semaine" />
        <FormFieldInput label="Date" id="exp-date" type="date" value={date} onChange={setDate} required />
        <SelectField label="Catégorie" value={categoryId} onValueChange={setCategoryId} options={[{ value: "", label: "Aucune" }, ...catOptions]} />
        <SelectField label="Activité" value={activityId} onValueChange={setActivityId} options={[{ value: "", label: "Aucune" }, ...actOptions]} />
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-danger)", color: "hsl(var(--destructive-foreground))" }}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

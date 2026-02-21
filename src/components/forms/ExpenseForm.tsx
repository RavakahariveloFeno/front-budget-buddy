import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, Category, Expense } from "@/data/staticData";
import type { ExpensePayload } from "@/api/expenseApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  activities: Activity[];
  categories: Category[];
  onCreate: (payload: ExpensePayload) => Promise<void>;
  onUpdate: (id: string, payload: ExpensePayload) => Promise<void>;
}

export default function ExpenseForm({ open, onOpenChange, expense, activities, categories, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(expense);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("none");
  const [activityId, setActivityId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const catOptions = useMemo(
    () => [{ value: "none", label: "Aucune" }, ...categories.map((category) => ({ value: category.id, label: `${category.icon || ""} ${category.name}`.trim() }))],
    [categories],
  );
  const actOptions = useMemo(
    () => [{ value: "none", label: "Aucune" }, ...activities.map((activity) => ({ value: activity.id, label: activity.name }))],
    [activities],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setAmount(expense?.amount ? String(expense.amount) : "");
    setDescription(expense?.description || "");
    setDate(expense?.date ? expense.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setCategoryId(expense?.categoryId || "none");
    setActivityId(expense?.activityId || "none");
  }, [expense, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }

    const payload: ExpensePayload = {
      amount: parsedAmount,
      date,
      description: description.trim() || undefined,
      categoryId: categoryId === "none" ? undefined : categoryId,
      activityId: activityId === "none" ? undefined : activityId,
    };

    try {
      setIsSubmitting(true);
      if (isEdit && expense) {
        await onUpdate(expense.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement de depense.", error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer la depense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier la depense" : "Nouvelle depense"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (EUR)" id="exp-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <FormFieldInput label="Description" id="exp-desc" value={description} onChange={setDescription} placeholder="Ex: Courses semaine" />
        <FormFieldInput label="Date" id="exp-date" type="date" value={date} onChange={setDate} required />
        <SelectField label="Categorie" value={categoryId} onValueChange={setCategoryId} options={catOptions} />
        <SelectField label="Activite" value={activityId} onValueChange={setActivityId} options={actOptions} />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-danger)", color: "hsl(var(--destructive-foreground))" }}
        >
          {isSubmitting ? "En cours..." : isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

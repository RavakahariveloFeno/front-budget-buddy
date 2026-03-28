import { useEffect, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Budget, BudgetPeriod } from "@/data/staticData";
import type { BudgetPayload } from "@/api/budgetApi";
import { toast } from "@/hooks/use-toast";

const periodOptions = [
  { value: "DAY", label: "Par jour" },
  { value: "WEEK", label: "Par semaine" },
  { value: "MONTH", label: "Par mois" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  budget?: Budget | null;
  onCreate: (payload: BudgetPayload) => Promise<void>;
  onUpdate: (id: string, payload: BudgetPayload) => Promise<void>;
}

export default function BudgetForm({ open, onOpenChange, activityId, budget, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(budget);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("MONTH");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAmount(budget?.amount ? String(budget.amount) : "");
    setPeriod(budget?.period || "MONTH");
    setStartDate(budget?.startDate ? budget.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
  }, [budget, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }

    const payload: BudgetPayload = {
      amount: parsedAmount,
      period,
      startDate,
      activityId,
    };

    try {
      setIsSubmitting(true);
      if (isEdit && budget) {
        await onUpdate(budget.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement du budget.", error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer le budget." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le budget" : "Nouveau budget"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (MGA)" id="bud-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <SelectField label="Periode" value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)} options={periodOptions} />
        <FormFieldInput label="Date de debut" id="bud-date" type="date" value={startDate} onChange={setStartDate} required />
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

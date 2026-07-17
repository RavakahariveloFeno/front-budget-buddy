import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, Income, PaymentType } from "@/data/staticData";
import type { IncomePayload } from "@/api/incomeApi";
import { toast } from "@/hooks/use-toast";

const paymentOptions = [
  { value: "CARD", label: "Carte" },
  { value: "CASH", label: "Especes" },
  { value: "MOBILE", label: "Compte mobile" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income | null;
  activities: Activity[];
  lockedActivityId?: string | null;
  onCreate: (payload: IncomePayload) => Promise<void>;
  onUpdate: (id: string, payload: IncomePayload) => Promise<void>;
}

export default function IncomeForm({ open, onOpenChange, income, activities, lockedActivityId = null, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(income);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<PaymentType>("CARD");
  const [cashFee, setCashFee] = useState("");
  const [activityId, setActivityId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activityOptions = useMemo(
    () => [{ value: "none", label: "Aucune" }, ...activities.map((a) => ({ value: a.id, label: a.name }))],
    [activities],
  );
  useEffect(() => {
    if (!open) {
      return;
    }

    setAmount(income?.amount ? String(income.amount) : "");
    setDescription(income?.description || "");
    setDate(income?.date ? income.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setPaymentType(income?.paymentType || "CARD");
    setCashFee(income?.cashFee !== undefined && Number.isFinite(income.cashFee) ? String(income.cashFee) : "");
    setActivityId(lockedActivityId || income?.activityId || "none");
  }, [income, lockedActivityId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    const parsedCashFee = cashFee.trim().length ? Number(cashFee) : undefined;

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }
    if (parsedCashFee !== undefined && (!Number.isFinite(parsedCashFee) || parsedCashFee < 0)) {
      toast({ title: "Frais invalides", description: "Saisissez un montant de frais en especes >= 0." });
      return;
    }
    if (activityId === "none") {
      toast({ title: "Activite requise", description: "Selectionnez une activite avant d'enregistrer le revenu." });
      return;
    }

    const payloadBase = {
      amount: parsedAmount,
      paymentType,
      cashFee: parsedCashFee !== undefined && parsedCashFee > 0 ? parsedCashFee : undefined,
      description: description.trim() || undefined,
      activityId,
    };
    const payload: IncomePayload = { ...payloadBase, date };

    try {
      setIsSubmitting(true);
      if (isEdit && income) {
        await onUpdate(income.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement du revenu.", error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer le revenu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le revenu" : "Nouveau revenu"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (MGA)" id="inc-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <FormFieldInput label="Frais en especes (optionnel)" id="inc-cash-fee" type="number" value={cashFee} onChange={setCashFee} placeholder="0.00" step="0.01" min="0" />
        <FormFieldInput label="Description" id="inc-desc" value={description} onChange={setDescription} placeholder="Ex: Salaire janvier" />
        <FormFieldInput label="Date" id="inc-date" type="date" value={date} onChange={setDate} required />
        <SelectField label="Mode de paiement" value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)} options={paymentOptions} />
        <SelectField label="Activite" value={activityId} onValueChange={setActivityId} options={activityOptions} placeholder="Selectionner une activite" required disabled={Boolean(lockedActivityId)} />
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

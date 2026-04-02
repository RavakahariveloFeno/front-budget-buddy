import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, Investment, PaymentType } from "@/data/staticData";
import type { InvestmentPayload } from "@/api/investmentApi";
import { toast } from "@/hooks/use-toast";

const paymentTypeOptions = [
  { value: "CARD", label: "Carte" },
  { value: "CASH", label: "Espèces" },
  { value: "MOBILE", label: "Compte mobile" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
  activities: Activity[];
  onCreate: (payload: InvestmentPayload) => Promise<void>;
  onUpdate: (id: string, payload: InvestmentPayload) => Promise<void>;
}

export default function InvestmentForm({ open, onOpenChange, investment, activities, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(investment);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CARD");
  const [fromActivityId, setFromActivityId] = useState("");
  const [toActivityId, setToActivityId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actOptions = useMemo(() => activities.map((activity) => ({ value: activity.id, label: activity.name })), [activities]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAmount(investment?.amount ? String(investment.amount) : "");
    setPaymentType(investment?.paymentType || "CARD");
    setFromActivityId(investment?.fromActivityId || "");
    setToActivityId(investment?.toActivityId || "");
    setDate(investment?.date ? investment.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setNote(investment?.note || "");
  }, [investment, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }

    if (!fromActivityId || !toActivityId) {
      toast({ title: "Activites requises", description: "Selectionnez une source et une destination." });
      return;
    }

    if (fromActivityId === toActivityId) {
      toast({ title: "Activites identiques", description: "La source et la destination doivent etre differentes." });
      return;
    }

    const payload: InvestmentPayload = {
      amount: parsedAmount,
      paymentType,
      fromActivityId,
      toActivityId,
      date,
      note: note.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      if (isEdit && investment) {
        await onUpdate(investment.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement du transfert.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer le transfert." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le transfert" : "Nouveau transfert"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (MGA)" id="inv-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <SelectField label="Mode de paiement" value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)} options={paymentTypeOptions} />
        <SelectField label="Activite source" value={fromActivityId} onValueChange={setFromActivityId} options={actOptions} placeholder="De..." />
        <SelectField label="Activite destination" value={toActivityId} onValueChange={setToActivityId} options={actOptions} placeholder="Vers..." />
        <FormFieldInput label="Date" id="inv-date" type="date" value={date} onChange={setDate} required />
        <FormFieldInput label="Note" id="inv-note" value={note} onChange={setNote} placeholder="Ex: Apport initial" />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-purple)", color: "hsl(var(--primary-foreground))" }}
        >
          {isSubmitting ? "En cours..." : isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

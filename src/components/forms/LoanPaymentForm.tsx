import { useEffect, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { LoanPaymentPayload } from "@/api/loanPaymentApi";
import type { PaymentType } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

const paymentTypeOptions = [
  { value: "CARD", label: "Carte" },
  { value: "CASH", label: "Espèces" },
  { value: "MOBILE", label: "Compte mobile" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  onCreate: (payload: LoanPaymentPayload) => Promise<void>;
}

export default function LoanPaymentForm({ open, onOpenChange, loanId, onCreate }: Props) {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CARD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAmount("");
    setPaymentType("CARD");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
  }, [open, loanId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!loanId) {
      toast({ title: "Pret invalide", description: "Selectionnez un pret valide." });
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }

    const payload: LoanPaymentPayload = {
      amount: parsedAmount,
      paymentType,
      date,
      note: note.trim() || undefined,
      loanId,
    };

    try {
      setIsSubmitting(true);
      await onCreate(payload);
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement du paiement.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer le paiement." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Nouveau paiement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (MGA)" id="pay-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <SelectField label="Mode de paiement" value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)} options={paymentTypeOptions} />
        <FormFieldInput label="Date" id="pay-date" type="date" value={date} onChange={setDate} required />
        <FormFieldInput label="Note" id="pay-note" value={note} onChange={setNote} placeholder="Ex: Mensualite mars" />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
        >
          {isSubmitting ? "En cours..." : "Ajouter le paiement"}
        </button>
      </form>
    </FormDialog>
  );
}

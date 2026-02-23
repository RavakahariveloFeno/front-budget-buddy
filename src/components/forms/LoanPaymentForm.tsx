import { useEffect, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import type { LoanPaymentPayload } from "@/api/loanPaymentApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  onCreate: (payload: LoanPaymentPayload) => Promise<void>;
}

export default function LoanPaymentForm({ open, onOpenChange, loanId, onCreate }: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAmount("");
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
      toast({ title: "Erreur", description: "Impossible d'enregistrer le paiement." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Nouveau paiement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (EUR)" id="pay-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
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

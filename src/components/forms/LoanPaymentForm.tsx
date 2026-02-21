import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
}

export default function LoanPaymentForm({ open, onOpenChange, loanId }: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Paiement ajouté", description: `${amount} €` });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Nouveau paiement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (€)" id="pay-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <FormFieldInput label="Date" id="pay-date" type="date" value={date} onChange={setDate} required />
        <FormFieldInput label="Note" id="pay-note" value={note} onChange={setNote} placeholder="Ex: Mensualité mars" />
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
          Ajouter le paiement
        </button>
      </form>
    </FormDialog>
  );
}

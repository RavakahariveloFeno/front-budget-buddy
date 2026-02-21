import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import { Loan, activities } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

const typeOptions = [
  { value: "BANK", label: "🏦 Banque" },
  { value: "FRIEND", label: "👤 Ami" },
  { value: "COMPANY", label: "🏢 Entreprise" },
  { value: "OTHER", label: "📋 Autre" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan | null;
}

export default function LoanForm({ open, onOpenChange, loan }: Props) {
  const isEdit = !!loan;
  const [totalAmount, setTotalAmount] = useState(loan?.totalAmount?.toString() || "");
  const [remainingAmount, setRemainingAmount] = useState(loan?.remainingAmount?.toString() || "");
  const [type, setType] = useState<string>(loan?.type || "BANK");
  const [lenderName, setLenderName] = useState(loan?.lenderName || "");
  const [interestRate, setInterestRate] = useState(loan?.interestRate?.toString() || "0");
  const [startDate, setStartDate] = useState(loan?.startDate || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(loan?.endDate || "");
  const [activityId, setActivityId] = useState(loan?.activityId || "");

  const actOptions = activities.map((a) => ({ value: a.id, label: a.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Prêt modifié" : "Prêt ajouté", description: lenderName });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le prêt" : "Nouveau prêt"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Prêteur" id="loan-lender" value={lenderName} onChange={setLenderName} placeholder="Ex: Crédit Agricole" required />
        <SelectField label="Type" value={type} onValueChange={setType} options={typeOptions} />
        <div className="grid grid-cols-2 gap-3">
          <FormFieldInput label="Montant total (€)" id="loan-total" type="number" value={totalAmount} onChange={setTotalAmount} required step="0.01" min="0" />
          <FormFieldInput label="Restant (€)" id="loan-remaining" type="number" value={remainingAmount} onChange={setRemainingAmount} required step="0.01" min="0" />
        </div>
        <FormFieldInput label="Taux d'intérêt (%)" id="loan-rate" type="number" value={interestRate} onChange={setInterestRate} step="0.1" min="0" />
        <div className="grid grid-cols-2 gap-3">
          <FormFieldInput label="Date début" id="loan-start" type="date" value={startDate} onChange={setStartDate} required />
          <FormFieldInput label="Date fin" id="loan-end" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <SelectField label="Activité liée" value={activityId} onValueChange={setActivityId} options={[{ value: "", label: "Aucune" }, ...actOptions]} />
        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

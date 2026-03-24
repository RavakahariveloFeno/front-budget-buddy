import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import type { Activity, Loan, LoanDirection, LoanType, PaymentType } from "@/data/staticData";
import type { LoanPayload } from "@/api/loanApi";
import { toast } from "@/hooks/use-toast";

const typeOptions = [
  { value: "BANK", label: "Banque" },
  { value: "FRIEND", label: "Ami" },
  { value: "COMPANY", label: "Entreprise" },
  { value: "OTHER", label: "Autre" },
];

const paymentTypeOptions = [
  { value: "CARD", label: "Carte" },
  { value: "CASH", label: "Espèces" },
];

const directionOptions = [
  { value: "BORROWED", label: "Je suis emprunteur" },
  { value: "LENT", label: "Je suis prêteur" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan | null;
  activities: Activity[];
  onCreate: (payload: LoanPayload) => Promise<void>;
  onUpdate: (id: string, payload: LoanPayload) => Promise<void>;
}

export default function LoanForm({ open, onOpenChange, loan, activities, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(loan);
  const [totalAmount, setTotalAmount] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CARD");
  const [direction, setDirection] = useState<LoanDirection>("BORROWED");
  const [type, setType] = useState<LoanType>("BANK");
  const [lenderName, setLenderName] = useState("");
  const [description, setDescription] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [activityId, setActivityId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actOptions = useMemo(
    () => [{ value: "none", label: "Aucune" }, ...activities.map((activity) => ({ value: activity.id, label: activity.name }))],
    [activities],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setTotalAmount(loan?.totalAmount ? String(loan.totalAmount) : "");
    setRemainingAmount(loan?.remainingAmount ? String(loan.remainingAmount) : "");
    setPaymentType(loan?.paymentType || "CARD");
    setDirection(loan?.direction || "BORROWED");
    setType(loan?.type || "BANK");
    setLenderName(loan?.lenderName || "");
    setDescription(loan?.description || "");
    setInterestRate(String(loan?.interestRate ?? 0));
    setStartDate(loan?.startDate ? loan.startDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setEndDate(loan?.endDate ? loan.endDate.split("T")[0] : "");
    setActivityId(loan?.activityId || "none");
  }, [loan, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedTotal = Number(totalAmount);
    const parsedRemaining = Number(remainingAmount);
    const parsedRate = Number(interestRate);

    if (!lenderName.trim()) {
      toast({
        title: direction === "LENT" ? "Emprunteur requis" : "Preteur requis",
        description: direction === "LENT" ? "Veuillez renseigner le nom de l'emprunteur." : "Veuillez renseigner le nom du preteur.",
      });
      return;
    }
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      toast({ title: "Montant invalide", description: "Le montant total doit etre superieur a 0." });
      return;
    }
    if (!Number.isFinite(parsedRemaining) || parsedRemaining < 0 || parsedRemaining > parsedTotal) {
      toast({ title: "Montant restant invalide", description: "Le restant doit etre entre 0 et le montant total." });
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      toast({ title: "Taux invalide", description: "Le taux doit etre superieur ou egal a 0." });
      return;
    }

    if (direction === "LENT" && activityId === "none") {
      toast({ title: "Activite requise", description: "Selectionnez une activite pour un pret accorde." });
      return;
    }

    const payload: LoanPayload = {
      totalAmount: parsedTotal,
      remainingAmount: parsedRemaining,
      paymentType,
      direction,
      type,
      lenderName: lenderName.trim(),
      description: description.trim() || undefined,
      interestRate: parsedRate,
      startDate,
      endDate: endDate || undefined,
      activityId: activityId === "none" ? undefined : activityId,
      status: parsedRemaining <= 0 ? "PAID" : "ACTIVE",
    };

    try {
      setIsSubmitting(true);
      if (isEdit && loan) {
        await onUpdate(loan.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement du pret.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer le pret." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier le pret" : "Nouveau pret"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput
          label={direction === "LENT" ? "Emprunteur" : "Preteur"}
          id="loan-lender"
          value={lenderName}
          onChange={setLenderName}
          placeholder={direction === "LENT" ? "Ex: Paul" : "Ex: Credit Agricole"}
          required
        />
        <SelectField label="Direction" value={direction} onValueChange={(value) => setDirection(value as LoanDirection)} options={directionOptions} />
        <SelectField label="Type" value={type} onValueChange={(value) => setType(value as LoanType)} options={typeOptions} />
        <SelectField label="Mode de paiement" value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)} options={paymentTypeOptions} />
        <FormFieldInput
          label="Description"
          id="loan-description"
          value={description}
          onChange={setDescription}
          placeholder="Optionnel"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormFieldInput label="Montant total (MGA)" id="loan-total" type="number" value={totalAmount} onChange={setTotalAmount} required step="0.01" min="0" />
          <FormFieldInput label="Restant (MGA)" id="loan-remaining" type="number" value={remainingAmount} onChange={setRemainingAmount} required step="0.01" min="0" />
        </div>
        <FormFieldInput label="Taux d'interet (%)" id="loan-rate" type="number" value={interestRate} onChange={setInterestRate} step="0.1" min="0" />
        <div className="grid grid-cols-2 gap-3">
          <FormFieldInput label="Date debut" id="loan-start" type="date" value={startDate} onChange={setStartDate} required />
          <FormFieldInput label="Date fin" id="loan-end" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <SelectField label="Activite liee" value={activityId} onValueChange={setActivityId} options={actOptions} />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
        >
          {isSubmitting ? "En cours..." : isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

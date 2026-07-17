import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import ActionConfirmDialog from "@/components/dialogs/ActionConfirmDialog";
import CategoryForm from "@/components/forms/CategoryForm";
import { formatCurrency, type Activity, type Category, type Expense } from "@/data/staticData";
import type { ExpensePayload } from "@/api/expenseApi";
import type { CategoryPayload } from "@/api/categoryApi";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  activities: Activity[];
  lockedActivityId?: string | null;
  activityNetById?: Record<string, number>;
  categories: Category[];
  onCreate: (payload: ExpensePayload) => Promise<void>;
  onUpdate: (id: string, payload: ExpensePayload) => Promise<void>;
  onCreateCategory?: (payload: CategoryPayload) => Promise<Category>;
}

interface OverBudgetConfirmState {
  payload: ExpensePayload;
  activityName: string;
  availableBudget: number;
  requestedAmount: number;
}

export default function ExpenseForm({
  open,
  onOpenChange,
  expense,
  activities,
  lockedActivityId = null,
  activityNetById = {},
  categories,
  onCreate,
  onUpdate,
  onCreateCategory,
}: Props) {
  const isEdit = Boolean(expense);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<"CARD" | "CASH" | "MOBILE">("CARD");
  const [categoryId, setCategoryId] = useState("none");
  const [activityId, setActivityId] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overBudgetConfirm, setOverBudgetConfirm] = useState<OverBudgetConfirmState | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  const catOptions = useMemo(
    () => [{ value: "none", label: "Aucune" }, ...categories.map((category) => ({ value: category.id, label: `${category.icon || ""} ${category.name}`.trim() }))],
    [categories],
  );
  const actOptions = useMemo(
    () => [{ value: "none", label: "Aucune" }, ...activities.map((activity) => ({ value: activity.id, label: activity.name }))],
    [activities],
  );
  const paymentOptions = useMemo(
    () => [
      { value: "CARD", label: "Carte" },
      { value: "CASH", label: "Especes" },
      { value: "MOBILE", label: "Compte mobile" },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setAmount(expense?.amount ? String(expense.amount) : "");
    setDescription(expense?.description || "");
    setDate(expense?.date ? expense.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setPaymentType(expense?.paymentType || "CARD");
    setCategoryId(expense?.categoryId || "none");
    setActivityId(lockedActivityId || expense?.activityId || "none");
    setOverBudgetConfirm(null);
  }, [expense, lockedActivityId, open]);

  const handleConfirmOverBudget = async () => {
    if (!overBudgetConfirm) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate(overBudgetConfirm.payload);
      onOpenChange(false);
      setOverBudgetConfirm(null);
    } catch (error) {
      console.error("Echec de l'enregistrement de depense.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer la depense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Montant invalide", description: "Saisissez un montant superieur a 0." });
      return;
    }
    if (activityId === "none") {
      toast({ title: "Activite requise", description: "Selectionnez une activite avant d'enregistrer la depense." });
      return;
    }

    const payloadBase = {
      amount: parsedAmount,
      paymentType,
      description: description.trim() || undefined,
      categoryId: categoryId === "none" ? undefined : categoryId,
      activityId,
    };

    const payload: ExpensePayload = {
      ...payloadBase,
      date,
    };

    try {
      setIsSubmitting(true);
      if (isEdit && expense) {
        await onUpdate(expense.id, payload);
      } else {
        if (activityId !== "none") {
          const activityName = activities.find((activity) => activity.id === activityId)?.name || "cette activite";
          const availableBudget = activityNetById[activityId] ?? 0;
          if (parsedAmount > availableBudget) {
            setOverBudgetConfirm({
              payload,
              activityName,
              availableBudget,
              requestedAmount: parsedAmount,
            });
            return;
          }
        }
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement de depense.", error);
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Impossible d'enregistrer la depense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier la depense" : "Nouvelle depense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Montant (MGA)" id="exp-amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" required step="0.01" min="0" />
        <FormFieldInput label="Description" id="exp-desc" value={description} onChange={setDescription} placeholder="Ex: Courses semaine" />
        <FormFieldInput label="Date" id="exp-date" type="date" value={date} onChange={setDate} required />
        <SelectField label="Paiement" value={paymentType} onValueChange={(value) => setPaymentType(value as "CARD" | "CASH" | "MOBILE")} options={paymentOptions} />
        <SelectField label="Categorie" value={categoryId} onValueChange={setCategoryId} options={catOptions} onAddClick={onCreateCategory ? () => setCategoryFormOpen(true) : undefined} />
        <SelectField label="Activite" value={activityId} onValueChange={setActivityId} options={actOptions} required disabled={Boolean(lockedActivityId)} />
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
      <ActionConfirmDialog
        open={Boolean(overBudgetConfirm)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOverBudgetConfirm(null);
          }
        }}
        title="Budget d'activite insuffisant"
        description={
          overBudgetConfirm
            ? `Le budget disponible de ${overBudgetConfirm.activityName} (${formatCurrency(overBudgetConfirm.availableBudget)}) est inferieur au montant (${formatCurrency(overBudgetConfirm.requestedAmount)}). Voulez-vous continuer ?`
            : ""
        }
        confirmLabel="Continuer"
        onConfirm={handleConfirmOverBudget}
      />
      {onCreateCategory && (
        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          onCreate={async (payload) => {
            const created = await onCreateCategory(payload);
            setCategoryId(created.id);
            setCategoryFormOpen(false);
          }}
          onUpdate={async () => {}}
        />
      )}
    </>
  );
}

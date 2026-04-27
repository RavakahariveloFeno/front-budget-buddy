import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancelAction?: () => void;
  onConfirm: () => void;
}

export default function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Continuer",
  cancelLabel = "Annuler",
  onCancelAction,
  onConfirm,
}: ActionConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border" style={{ background: "hsl(225, 27%, 10%)" }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display" style={{ color: "hsl(var(--foreground))" }}>{title}</AlertDialogTitle>
          <AlertDialogDescription style={{ color: "hsl(var(--muted-foreground))" }}>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancelAction}
            className="border-border"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="border-0"
            style={{ background: "var(--gradient-warning)", color: "hsl(var(--warning-foreground))" }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

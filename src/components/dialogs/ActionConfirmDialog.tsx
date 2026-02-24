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
  onConfirm: () => void;
}

export default function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Continuer",
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
            className="border-border"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
          >
            Annuler
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

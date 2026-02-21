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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({ open, onOpenChange, title, description, onConfirm }: DeleteConfirmDialogProps) {
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
            style={{ background: "var(--gradient-danger)", color: "hsl(var(--destructive-foreground))" }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

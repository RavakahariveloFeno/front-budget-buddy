import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormDialog({ open, onOpenChange, title, children, className }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("border-border max-h-[85vh] overflow-y-auto", className)}
        style={{ background: "hsl(225, 27%, 10%)" }}
      >
        <DialogHeader>
          <DialogTitle className="font-display" style={{ color: "hsl(var(--foreground))" }}>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

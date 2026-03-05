import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  onAddClick?: () => void;
}

export default function SelectField({ label, value, onValueChange, options, placeholder, onAddClick }: SelectFieldProps) {
  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onAddClick?.();
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</Label>
      <div className={onAddClick ? "flex gap-2" : ""}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={`border-border ${onAddClick ? "flex-1" : ""}`} style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}>
            <SelectValue placeholder={placeholder || "Sélectionner"} />
          </SelectTrigger>
          <SelectContent style={{ background: "hsl(225, 27%, 12%)", borderColor: "hsl(var(--border))" }}>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onAddClick && (
          <button
            type="button"
            onClick={handleAddClick}
            className="h-10 w-10 flex-shrink-0 rounded-md border flex items-center justify-center transition-colors hover:bg-accent"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--input))" }}
            title={`Ajouter ${label.toLowerCase()}`}
          >
            <Plus size={16} style={{ color: "hsl(var(--primary))" }} />
          </button>
        )}
      </div>
    </div>
  );
}

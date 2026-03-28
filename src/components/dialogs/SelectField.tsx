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
  required?: boolean;
  disabled?: boolean;
}

export default function SelectField({ label, value, onValueChange, options, placeholder, onAddClick, required = false, disabled = false }: SelectFieldProps) {
  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onAddClick?.();
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
        {required ? " *" : ""}
      </Label>
      <div className={`relative ${onAddClick ? "flex gap-2" : ""}`}>
        {required ? (
          <select
            aria-hidden="true"
            tabIndex={-1}
            required
            disabled={disabled}
            value={value === "none" ? "" : value}
            onChange={() => {}}
            className="absolute h-0 w-0 opacity-0 pointer-events-none"
          >
            <option value="">Selectionner</option>
            {options
              .filter((opt) => opt.value !== "none")
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        ) : null}
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger disabled={disabled} className={`border-border ${onAddClick ? "flex-1" : ""}`} style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}>
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
            disabled={disabled}
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

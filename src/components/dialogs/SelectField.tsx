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
}

export default function SelectField({ label, value, onValueChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-border" style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}>
          <SelectValue placeholder={placeholder || "Sélectionner"} />
        </SelectTrigger>
        <SelectContent style={{ background: "hsl(225, 27%, 12%)", borderColor: "hsl(var(--border))" }}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

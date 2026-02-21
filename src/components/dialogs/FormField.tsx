import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
}

export default function FormFieldInput({ label, id, type = "text", value, onChange, placeholder, required, step, min }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        className="border-border"
        style={{ background: "hsl(var(--input))", color: "hsl(var(--foreground))" }}
      />
    </div>
  );
}

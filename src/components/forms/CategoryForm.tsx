import { useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import { Category } from "@/data/staticData";
import { toast } from "@/hooks/use-toast";

const emojiOptions = ["🛒", "🏠", "🚗", "🏥", "🎮", "👗", "💻", "🍽️", "📚", "✈️", "💊", "🎬", "🐾", "🏋️", "🎵"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export default function CategoryForm({ open, onOpenChange, category }: Props) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name || "");
  const [icon, setIcon] = useState(category?.icon || "🛒");
  const [color, setColor] = useState(category?.color || "#8b5cf6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isEdit ? "Catégorie modifiée" : "Catégorie ajoutée", description: `${icon} ${name}` });
    onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Nom" id="cat-name" value={name} onChange={setName} placeholder="Ex: Alimentation" required />
        
        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Icône</label>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                style={{
                  background: icon === e ? "hsl(var(--primary-dim))" : "hsl(var(--secondary))",
                  border: icon === e ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Couleur</label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
            <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{color}</span>
          </div>
        </div>

        <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

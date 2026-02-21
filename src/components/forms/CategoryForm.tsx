import { useEffect, useState } from "react";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import type { Category } from "@/data/staticData";
import type { CategoryPayload } from "@/api/categoryApi";
import { toast } from "@/hooks/use-toast";

const emojiOptions = ["🛒", "🏠", "🚗", "🏥", "🎮", "👗", "💻", "🍽️", "📚", "✈️", "💊", "🎬", "🐾", "🏋️", "🎵"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onCreate: (payload: CategoryPayload) => Promise<void>;
  onUpdate: (id: string, payload: CategoryPayload) => Promise<void>;
}

export default function CategoryForm({ open, onOpenChange, category, onCreate, onUpdate }: Props) {
  const isEdit = Boolean(category);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🛒");
  const [color, setColor] = useState("#8b5cf6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(category?.name || "");
    setIcon(category?.icon || "🛒");
    setColor(category?.color || "#8b5cf6");
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CategoryPayload = {
      name: name.trim(),
      icon,
      color,
    };

    if (!payload.name) {
      toast({ title: "Nom requis", description: "Veuillez renseigner le nom de la categorie." });
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit && category) {
        await onUpdate(category.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Echec de l'enregistrement de categorie.", error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer la categorie." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? "Modifier la categorie" : "Nouvelle categorie"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFieldInput label="Nom" id="cat-name" value={name} onChange={setName} placeholder="Ex: Alimentation" required />

        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Icone
          </label>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                style={{
                  background: icon === emoji ? "hsl(var(--primary-dim))" : "hsl(var(--secondary))",
                  border: icon === emoji ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Couleur
          </label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
            <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
              {color}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
        >
          {isSubmitting ? "En cours..." : isEdit ? "Enregistrer" : "Ajouter"}
        </button>
      </form>
    </FormDialog>
  );
}

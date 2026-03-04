import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategories,
  updateProductCategory,
  type ProductCategoryOption,
} from "@/api/saleApi";

export default function ProductCategoriesPage() {
  const { toast } = useToast();
  const { activityId } = useParams<{ activityId: string }>();
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategoryOption | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!activityId) return;
    getProductCategories({ activityId })
      .then(setCategories)
      .catch(() => {
        toast({ title: "Impossible de charger les categories", variant: "destructive" });
      });
  }, [activityId, toast]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setFormOpen(true);
  };

  const openEdit = (category: ProductCategoryOption) => {
    setEditing(category);
    setName(category.name);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId) return;

    try {
      if (editing) {
        const updated = await updateProductCategory({ activityId }, editing.id, name);
        setCategories((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast({ title: "Categorie modifiee" });
      } else {
        const created = await createProductCategory({ activityId }, name);
        setCategories((prev) => {
          if (prev.some((item) => item.id === created.id)) return prev;
          return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
        });
        toast({ title: "Categorie ajoutee" });
      }
      setFormOpen(false);
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!activityId || !editing) {
      setDeleteOpen(false);
      setEditing(null);
      return;
    }
    try {
      await deleteProductCategory({ activityId }, editing.id);
      setCategories((prev) => prev.filter((item) => item.id !== editing.id));
      toast({ title: "Categorie supprimee" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setEditing(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Categories produits" subtitle="Gestion des categories de produits" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <Tags size={20} style={{ color: "hsl(var(--primary))" }} />
              <div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total categories</p>
                <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{categories.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Liste des categories</h3>
            <Button size="sm" onClick={openAdd}>
              <Plus size={14} className="mr-1" /> Ajouter
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(category)} className="p-1.5 rounded hover:bg-accent">
                        <Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(category);
                          setDeleteOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-accent"
                      >
                        <Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier la categorie" : "Nouvelle categorie"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput
            label="Nom"
            id="category-name"
            value={name}
            onChange={setName}
            placeholder="Ex: Alimentaire"
            required
          />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Supprimer cette categorie ?"
        description="Les produits lies garderont une categorie vide."
      />
    </div>
  );
}

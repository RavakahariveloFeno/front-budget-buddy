import { useState } from "react";
import { Box, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_PRODUITS, type Produit } from "@/data/venteData";
import { formatCurrency } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Alimentaire", "Ménage", "Fourniture", "Électronique", "Autre"];

export default function ProduitsPage() {
  const { toast } = useToast();
  const [produits, setProduits] = useState<Produit[]>(STATIC_PRODUITS);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);

  const [nom, setNom] = useState("");
  const [reference, setReference] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [categorie, setCategorie] = useState("");

  const openAdd = () => { setEditing(null); setNom(""); setReference(""); setPrixAchat(""); setPrixVente(""); setCategorie(""); setFormOpen(true); };
  const openEdit = (p: Produit) => { setEditing(p); setNom(p.nom); setReference(p.reference); setPrixAchat(String(p.prixAchat)); setPrixVente(String(p.prixVente)); setCategorie(p.categorie); setFormOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nom, reference, prixAchat: +prixAchat, prixVente: +prixVente, categorie };
    if (editing) {
      setProduits((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...data } : p));
      toast({ title: "Produit modifié" });
    } else {
      setProduits((prev) => [...prev, { id: `p${Date.now()}`, ...data }]);
      toast({ title: "Produit ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setProduits((prev) => prev.filter((p) => p.id !== editing.id)); toast({ title: "Produit supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const totalMarge = produits.reduce((s, p) => s + (p.prixVente - p.prixAchat), 0);

  return (
    <div className="animate-fade-in">
      <Header title="Produits" subtitle="Catalogue de produits" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><Box size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Produits</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{produits.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Box size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Catégories</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{new Set(produits.map((p) => p.categorie)).size}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Box size={20} style={{ color: "hsl(var(--chart-3))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Marge totale</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalMarge)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Catalogue</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix achat</TableHead>
                <TableHead>Prix vente</TableHead>
                <TableHead>Marge</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produits.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline">{p.reference}</Badge></TableCell>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{p.nom}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{p.categorie}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatCurrency(p.prixAchat)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(p.prixVente)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(p.prixVente - p.prixAchat)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
                      <button onClick={() => { setEditing(p); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier le produit" : "Nouveau produit"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Nom" id="nom" value={nom} onChange={setNom} placeholder="Ex: Riz 50kg" required />
          <FormFieldInput label="Référence" id="reference" value={reference} onChange={setReference} placeholder="Ex: RIZ-050" required />
          <SelectField label="Catégorie" value={categorie} onValueChange={setCategorie} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput label="Prix d'achat" id="prixAchat" type="number" value={prixAchat} onChange={setPrixAchat} min="0" required />
            <FormFieldInput label="Prix de vente" id="prixVente" type="number" value={prixVente} onChange={setPrixVente} min="0" required />
          </div>
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer ce produit ?" description="Cette action est irréversible." />
    </div>
  );
}

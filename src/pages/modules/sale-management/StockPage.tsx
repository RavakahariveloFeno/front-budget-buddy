import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Package, AlertTriangle, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import type { StockItem, Produit } from "@/data/venteData";
import { formatDate } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { createStockItem, deleteStockItem, getProduits, getStock, updateStockItem } from "@/api/saleApi";

export default function StockPage() {
  const { toast } = useToast();
  const { activityId } = useParams<{ activityId: string }>();
  const [items, setItems] = useState<StockItem[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const [produitId, setProduitId] = useState("");
  const [quantite, setQuantite] = useState("");
  const [seuil, setSeuil] = useState("");
  const [emplacement, setEmplacement] = useState("");

  useEffect(() => {
    if (!activityId) return;
    getProduits({ activityId })
      .then(setProduits)
      .catch(() => {
        toast({ title: "Impossible de charger les produits", variant: "destructive" });
      });
    getStock({ activityId })
      .then(setItems)
      .catch(() => {
        toast({ title: "Impossible de charger le stock", variant: "destructive" });
      });
  }, [activityId, toast]);

  function getProduitNom(id: string) {
    return produits.find((p) => p.id === id)?.nom ?? "—";
  }

  const openAdd = () => { setEditing(null); setProduitId(""); setQuantite(""); setSeuil("15"); setEmplacement(""); setFormOpen(true); };
  const openEdit = (s: StockItem) => { setEditing(s); setProduitId(s.produitId); setQuantite(String(s.quantite)); setSeuil(String(s.seuilAlerte)); setEmplacement(s.emplacement); setFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId) return;
    const payload = { produitId, quantite: +quantite, seuilAlerte: +seuil, emplacement };
    try {
      if (editing) {
        const updated = await updateStockItem({ activityId }, editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast({ title: "Stock mis à jour" });
      } else {
        const created = await createStockItem({ activityId }, payload);
        setItems((prev) => [...prev, created]);
        toast({ title: "Stock ajouté" });
      }
      setFormOpen(false);
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editing || !activityId) { setDeleteOpen(false); setEditing(null); return; }
    try {
      await deleteStockItem({ activityId }, editing.id);
      setItems((prev) => prev.filter((i) => i.id !== editing.id));
      toast({ title: "Stock supprimé" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setEditing(null);
    }
  };

  const totalItems = items.reduce((s, i) => s + i.quantite, 0);
  const alertes = items.filter((i) => i.quantite <= i.seuilAlerte);

  return (
    <div className="animate-fade-in">
      <Header title="Stock" subtitle="Gestion des stocks et inventaire" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><Package size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total articles</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{totalItems}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><MapPin size={20} style={{ color: "hsl(var(--chart-3))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Produits suivis</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{items.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><AlertTriangle size={20} style={{ color: "hsl(var(--destructive))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Alertes stock bas</p><p className="text-xl font-bold" style={{ color: "hsl(var(--destructive))" }}>{alertes.length}</p></div></div></div>
        </div>

        {/* Table */}
        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Inventaire</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Seuil</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Dernière MAJ</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{getProduitNom(s.produitId)}</TableCell>
                  <TableCell>
                    <Badge variant={s.quantite <= s.seuilAlerte ? "destructive" : "secondary"}>{s.quantite}</Badge>
                  </TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{s.seuilAlerte}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{s.emplacement}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(s.derniereMaj)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
                      <button onClick={() => { setEditing(s); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier le stock" : "Ajouter au stock"}>
        <form onSubmit={handleSave} className="space-y-4">
          <SelectField label="Produit" value={produitId} onValueChange={setProduitId} options={produits.map((p) => ({ value: p.id, label: p.nom }))} placeholder="Choisir un produit" />
          <FormFieldInput label="Quantité" id="quantite" type="number" value={quantite} onChange={setQuantite} min="0" required />
          <FormFieldInput label="Seuil d'alerte" id="seuil" type="number" value={seuil} onChange={setSeuil} min="0" required />
          <FormFieldInput label="Emplacement" id="emplacement" value={emplacement} onChange={setEmplacement} placeholder="Ex: Entrepôt A" required />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer ce stock ?" description="Cette action est irréversible." />
    </div>
  );
}

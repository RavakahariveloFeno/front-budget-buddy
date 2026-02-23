import { useState } from "react";
import { List, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_COMPTES, type CompteComptable } from "@/data/comptabiliteData";
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

const CLASSES = ["1 - Capitaux", "2 - Immobilisations", "3 - Stocks", "4 - Tiers", "5 - Financier", "6 - Charges", "7 - Produits"];

export default function PlanComptablePage() {
  const { toast } = useToast();
  const [comptes, setComptes] = useState<CompteComptable[]>(STATIC_COMPTES);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<CompteComptable | null>(null);

  const [numero, setNumero] = useState("");
  const [libelle, setLibelle] = useState("");
  const [classe, setClasse] = useState("");
  const [solde, setSolde] = useState("");

  const openAdd = () => { setEditing(null); setNumero(""); setLibelle(""); setClasse(""); setSolde("0"); setFormOpen(true); };
  const openEdit = (c: CompteComptable) => { setEditing(c); setNumero(c.numero); setLibelle(c.libelle); setClasse(c.classe); setSolde(String(c.solde)); setFormOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setComptes((prev) => prev.map((c) => c.id === editing.id ? { ...c, numero, libelle, classe, solde: +solde } : c));
      toast({ title: "Compte modifié" });
    } else {
      setComptes((prev) => [...prev, { id: `cc${Date.now()}`, numero, libelle, classe, solde: +solde }]);
      toast({ title: "Compte ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setComptes((prev) => prev.filter((c) => c.id !== editing.id)); toast({ title: "Compte supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><List size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Comptes</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{comptes.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><List size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Classes</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{new Set(comptes.map((c) => c.classe)).size}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Plan comptable</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Libellé</TableHead><TableHead>Classe</TableHead><TableHead>Solde</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {comptes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.numero}</Badge></TableCell>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{c.libelle}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{c.classe}</TableCell>
                  <TableCell className="font-semibold" style={{ color: c.solde >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }}>{formatCurrency(c.solde)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
                      <button onClick={() => { setEditing(c); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier le compte" : "Nouveau compte"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Numéro" id="numero" value={numero} onChange={setNumero} placeholder="Ex: 411" required />
          <FormFieldInput label="Libellé" id="libelle" value={libelle} onChange={setLibelle} required />
          <SelectField label="Classe" value={classe} onValueChange={setClasse} options={CLASSES.map((c) => ({ value: c, label: c }))} />
          <FormFieldInput label="Solde (MGA)" id="solde" type="number" value={solde} onChange={setSolde} required />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer ce compte ?" description="Cette action est irréversible." />
    </div>
  );
}

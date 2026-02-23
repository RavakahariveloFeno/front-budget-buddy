import { useState } from "react";
import { ArrowUpRight, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_DECAISSEMENTS, type Decaissement } from "@/data/tresorerieData";
import { formatCurrency, formatDate } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export default function DecaissementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Decaissement[]>(STATIC_DECAISSEMENTS);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Decaissement | null>(null);

  const [date, setDate] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState("");
  const [reference, setReference] = useState("");

  const openAdd = () => { setEditing(null); setDate(new Date().toISOString().slice(0, 10)); setBeneficiaire(""); setMontant(""); setCategorie(""); setReference(""); setFormOpen(true); };
  const openEdit = (d: Decaissement) => { setEditing(d); setDate(d.date); setBeneficiaire(d.beneficiaire); setMontant(String(d.montant)); setCategorie(d.categorie); setReference(d.reference || ""); setFormOpen(true); };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    const data = { date, beneficiaire, montant: +montant, categorie, reference: reference || undefined };
    if (editing) {
      setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...data } : i));
      toast({ title: "Décaissement modifié" });
    } else {
      setItems((prev) => [...prev, { id: `dec${Date.now()}`, ...data }]);
      toast({ title: "Décaissement ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setItems((prev) => prev.filter((i) => i.id !== editing.id)); toast({ title: "Décaissement supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const total = items.reduce((s, i) => s + i.montant, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><ArrowUpRight size={20} style={{ color: "hsl(var(--destructive))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total décaissements</p><p className="text-xl font-bold" style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(total)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><ArrowUpRight size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Nombre</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{items.length}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Décaissements</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Bénéficiaire</TableHead><TableHead>Catégorie</TableHead><TableHead>Montant</TableHead><TableHead>Réf.</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(i.date)}</TableCell>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{i.beneficiaire}</TableCell>
                  <TableCell><Badge variant="secondary">{i.categorie}</Badge></TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--destructive))" }}>-{formatCurrency(i.montant)}</TableCell>
                  <TableCell className="font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{i.reference || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(i)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
                      <button onClick={() => { setEditing(i); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier" : "Nouveau décaissement"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Date" id="date" type="date" value={date} onChange={setDate} required />
          <FormFieldInput label="Bénéficiaire" id="beneficiaire" value={beneficiaire} onChange={setBeneficiaire} required />
          <FormFieldInput label="Montant (MGA)" id="montant" type="number" value={montant} onChange={setMontant} min="0" required />
          <SelectField label="Catégorie" value={categorie} onValueChange={setCategorie} options={[{ value: "Achats", label: "Achats" }, { value: "Salaires", label: "Salaires" }, { value: "Loyer", label: "Loyer" }, { value: "Charges", label: "Charges" }, { value: "Assurance", label: "Assurance" }, { value: "Transport", label: "Transport" }]} />
          <FormFieldInput label="Référence" id="reference" value={reference} onChange={setReference} />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer ce décaissement ?" description="Irréversible." />
    </div>
  );
}

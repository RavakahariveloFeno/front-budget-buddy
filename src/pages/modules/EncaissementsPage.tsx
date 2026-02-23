import { useState } from "react";
import { ArrowDownLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_ENCAISSEMENTS, type Encaissement } from "@/data/tresorerieData";
import { formatCurrency, formatDate } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export default function EncaissementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Encaissement[]>(STATIC_ENCAISSEMENTS);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Encaissement | null>(null);

  const [date, setDate] = useState("");
  const [source, setSource] = useState("");
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("");
  const [reference, setReference] = useState("");

  const openAdd = () => { setEditing(null); setDate(new Date().toISOString().slice(0, 10)); setSource(""); setMontant(""); setMode(""); setReference(""); setFormOpen(true); };
  const openEdit = (e: Encaissement) => { setEditing(e); setDate(e.date); setSource(e.source); setMontant(String(e.montant)); setMode(e.mode); setReference(e.reference || ""); setFormOpen(true); };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    const data = { date, source, montant: +montant, mode, reference: reference || undefined };
    if (editing) {
      setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...data } : i));
      toast({ title: "Encaissement modifié" });
    } else {
      setItems((prev) => [...prev, { id: `enc${Date.now()}`, ...data }]);
      toast({ title: "Encaissement ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setItems((prev) => prev.filter((i) => i.id !== editing.id)); toast({ title: "Encaissement supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const total = items.reduce((s, i) => s + i.montant, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><ArrowDownLeft size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total encaissements</p><p className="text-xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(total)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><ArrowDownLeft size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Nombre</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{items.length}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Encaissements</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Mode</TableHead><TableHead>Montant</TableHead><TableHead>Réf.</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(i.date)}</TableCell>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{i.source}</TableCell>
                  <TableCell><Badge variant="secondary">{i.mode}</Badge></TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--chart-2))" }}>+{formatCurrency(i.montant)}</TableCell>
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

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier" : "Nouvel encaissement"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Date" id="date" type="date" value={date} onChange={setDate} required />
          <FormFieldInput label="Source" id="source" value={source} onChange={setSource} required />
          <FormFieldInput label="Montant (MGA)" id="montant" type="number" value={montant} onChange={setMontant} min="0" required />
          <SelectField label="Mode" value={mode} onValueChange={setMode} options={[{ value: "Virement", label: "Virement" }, { value: "Chèque", label: "Chèque" }, { value: "Espèces", label: "Espèces" }, { value: "Mobile money", label: "Mobile money" }]} />
          <FormFieldInput label="Référence" id="reference" value={reference} onChange={setReference} />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer cet encaissement ?" description="Irréversible." />
    </div>
  );
}

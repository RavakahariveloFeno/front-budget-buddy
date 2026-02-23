import { useState } from "react";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_ECRITURES, type EcritureJournal } from "@/data/comptabiliteData";
import { formatCurrency, formatDate } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export default function JournalPage() {
  const { toast } = useToast();
  const [ecritures, setEcritures] = useState<EcritureJournal[]>(STATIC_ECRITURES);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<EcritureJournal | null>(null);

  const [date, setDate] = useState("");
  const [libelle, setLibelle] = useState("");
  const [compteDebit, setCompteDebit] = useState("");
  const [compteCredit, setCompteCredit] = useState("");
  const [montant, setMontant] = useState("");
  const [reference, setReference] = useState("");

  const openAdd = () => { setEditing(null); setDate(new Date().toISOString().slice(0, 10)); setLibelle(""); setCompteDebit(""); setCompteCredit(""); setMontant(""); setReference(""); setFormOpen(true); };
  const openEdit = (e: EcritureJournal) => { setEditing(e); setDate(e.date); setLibelle(e.libelle); setCompteDebit(e.compteDebit); setCompteCredit(e.compteCredit); setMontant(String(e.montant)); setReference(e.reference || ""); setFormOpen(true); };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    const data = { date, libelle, compteDebit, compteCredit, montant: +montant, reference: reference || undefined };
    if (editing) {
      setEcritures((prev) => prev.map((e) => e.id === editing.id ? { ...e, ...data } : e));
      toast({ title: "Écriture modifiée" });
    } else {
      setEcritures((prev) => [...prev, { id: `ej${Date.now()}`, ...data }]);
      toast({ title: "Écriture ajoutée" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setEcritures((prev) => prev.filter((e) => e.id !== editing.id)); toast({ title: "Écriture supprimée" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const totalDebit = ecritures.reduce((s, e) => s + e.montant, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><BookOpen size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Écritures</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{ecritures.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><BookOpen size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total mouvements</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalDebit)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Journal comptable</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Nouvelle écriture</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Libellé</TableHead><TableHead>Débit</TableHead><TableHead>Crédit</TableHead><TableHead>Montant</TableHead><TableHead>Réf.</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {ecritures.map((e) => (
                <TableRow key={e.id}>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(e.date)}</TableCell>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{e.libelle}</TableCell>
                  <TableCell><Badge variant="outline">{e.compteDebit}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{e.compteCredit}</Badge></TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(e.montant)}</TableCell>
                  <TableCell className="font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{e.reference || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
                      <button onClick={() => { setEditing(e); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier l'écriture" : "Nouvelle écriture"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Date" id="date" type="date" value={date} onChange={setDate} required />
          <FormFieldInput label="Libellé" id="libelle" value={libelle} onChange={setLibelle} required />
          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput label="Compte débit" id="debit" value={compteDebit} onChange={setCompteDebit} placeholder="Ex: 411" required />
            <FormFieldInput label="Compte crédit" id="credit" value={compteCredit} onChange={setCompteCredit} placeholder="Ex: 701" required />
          </div>
          <FormFieldInput label="Montant (MGA)" id="montant" type="number" value={montant} onChange={setMontant} min="0" required />
          <FormFieldInput label="Référence" id="reference" value={reference} onChange={setReference} placeholder="Ex: FAC-2025-001" />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer cette écriture ?" description="Cette action est irréversible." />
    </div>
  );
}

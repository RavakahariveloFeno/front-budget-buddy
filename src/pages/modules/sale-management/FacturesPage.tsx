import { useState } from "react";
import { FileText, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { STATIC_FACTURES, STATIC_CLIENTS, STATIC_PRODUITS, type Facture, type FactureStatut } from "@/data/venteData";
import { formatCurrency, formatDate } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function clientNom(id: string) { return STATIC_CLIENTS.find((c) => c.id === id)?.nom ?? "—"; }
function produitNom(id: string) { return STATIC_PRODUITS.find((p) => p.id === id)?.nom ?? "—"; }

const statutColor: Record<FactureStatut, string> = {
  "PAYÉE": "default",
  "EN_ATTENTE": "secondary",
  "ANNULÉE": "destructive",
};

export default function FacturesPage() {
  const { toast } = useToast();
  const [factures, setFactures] = useState<Facture[]>(STATIC_FACTURES);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Facture | null>(null);
  const [viewing, setViewing] = useState<Facture | null>(null);

  const [numero, setNumero] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [statut, setStatut] = useState<string>("EN_ATTENTE");
  const [total, setTotal] = useState("");

  const openAdd = () => { setEditing(null); setNumero(`FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, "0")}`); setClientId(""); setDate(new Date().toISOString().slice(0, 10)); setStatut("EN_ATTENTE"); setTotal(""); setFormOpen(true); };
  const openEdit = (f: Facture) => { setEditing(f); setNumero(f.numero); setClientId(f.clientId); setDate(f.date); setStatut(f.statut); setTotal(String(f.total)); setFormOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setFactures((prev) => prev.map((f) => f.id === editing.id ? { ...f, numero, clientId, date, statut: statut as FactureStatut, total: +total } : f));
      toast({ title: "Facture modifiée" });
    } else {
      setFactures((prev) => [...prev, { id: `f${Date.now()}`, numero, clientId, date, statut: statut as FactureStatut, total: +total, lignes: [] }]);
      toast({ title: "Facture créée" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setFactures((prev) => prev.filter((f) => f.id !== editing.id)); toast({ title: "Facture supprimée" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const totalPayee = factures.filter((f) => f.statut === "PAYÉE").reduce((s, f) => s + f.total, 0);
  const totalEnAttente = factures.filter((f) => f.statut === "EN_ATTENTE").reduce((s, f) => s + f.total, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Factures" subtitle="Gestion de la facturation" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><FileText size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total factures</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{factures.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><FileText size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Payées</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalPayee)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><FileText size={20} style={{ color: "hsl(var(--chart-4))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>En attente</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalEnAttente)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Liste des factures</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Nouvelle facture</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factures.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium font-mono text-xs" style={{ color: "hsl(var(--foreground))" }}>{f.numero}</TableCell>
                  <TableCell style={{ color: "hsl(var(--foreground))" }}>{clientNom(f.clientId)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(f.date)}</TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(f.total)}</TableCell>
                  <TableCell><Badge variant={statutColor[f.statut] as any}>{f.statut.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => { setViewing(f); setDetailOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Eye size={14} style={{ color: "hsl(var(--primary))" }} /></button>
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
                      <button onClick={() => { setEditing(f); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} style={{ color: "hsl(var(--destructive))" }} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="border-border" style={{ background: "hsl(225, 27%, 10%)" }}>
          <DialogHeader>
            <DialogTitle className="font-display" style={{ color: "hsl(var(--foreground))" }}>Facture {viewing?.numero}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span style={{ color: "hsl(var(--muted-foreground))" }}>Client : </span><span style={{ color: "hsl(var(--foreground))" }}>{clientNom(viewing.clientId)}</span></div>
                <div><span style={{ color: "hsl(var(--muted-foreground))" }}>Date : </span><span style={{ color: "hsl(var(--foreground))" }}>{formatDate(viewing.date)}</span></div>
                <div><span style={{ color: "hsl(var(--muted-foreground))" }}>Statut : </span><Badge variant={statutColor[viewing.statut] as any}>{viewing.statut}</Badge></div>
              </div>
              {viewing.lignes.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Qté</TableHead><TableHead>P.U.</TableHead><TableHead>Sous-total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {viewing.lignes.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell style={{ color: "hsl(var(--foreground))" }}>{produitNom(l.produitId)}</TableCell>
                        <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{l.quantite}</TableCell>
                        <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatCurrency(l.prixUnitaire)}</TableCell>
                        <TableCell className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(l.quantite * l.prixUnitaire)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="text-right text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>Total : {formatCurrency(viewing.total)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier la facture" : "Nouvelle facture"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Numéro" id="numero" value={numero} onChange={setNumero} required />
          <SelectField label="Client" value={clientId} onValueChange={setClientId} options={STATIC_CLIENTS.map((c) => ({ value: c.id, label: c.nom }))} placeholder="Choisir un client" />
          <FormFieldInput label="Date" id="date" type="date" value={date} onChange={setDate} required />
          <SelectField label="Statut" value={statut} onValueChange={setStatut} options={[{ value: "EN_ATTENTE", label: "En attente" }, { value: "PAYÉE", label: "Payée" }, { value: "ANNULÉE", label: "Annulée" }]} />
          <FormFieldInput label="Total (MGA)" id="total" type="number" value={total} onChange={setTotal} min="0" required />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Créer"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer cette facture ?" description="Cette action est irréversible." />
    </div>
  );
}

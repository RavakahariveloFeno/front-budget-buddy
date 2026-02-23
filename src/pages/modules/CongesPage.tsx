import { useState } from "react";
import { Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_CONGES, STATIC_EMPLOYES, type Conge, type StatutConge } from "@/data/paieData";
import { formatDate } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const statutColor: Record<StatutConge, string> = { APPROUVE: "default", EN_ATTENTE: "secondary", REFUSE: "destructive" };
const statutLabel: Record<StatutConge, string> = { APPROUVE: "Approuvé", EN_ATTENTE: "En attente", REFUSE: "Refusé" };
function employeNom(id: string) { return STATIC_EMPLOYES.find((e) => e.id === id)?.nom ?? "—"; }

export default function CongesPage() {
  const { toast } = useToast();
  const [conges, setConges] = useState<Conge[]>(STATIC_CONGES);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Conge | null>(null);

  const [employeId, setEmployeId] = useState("");
  const [type, setType] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [jours, setJours] = useState("");
  const [statut, setStatut] = useState<string>("EN_ATTENTE");
  const [motif, setMotif] = useState("");

  const openAdd = () => { setEditing(null); setEmployeId(""); setType(""); setDateDebut(""); setDateFin(""); setJours(""); setStatut("EN_ATTENTE"); setMotif(""); setFormOpen(true); };
  const openEdit = (c: Conge) => { setEditing(c); setEmployeId(c.employeId); setType(c.type); setDateDebut(c.dateDebut); setDateFin(c.dateFin); setJours(String(c.jours)); setStatut(c.statut); setMotif(c.motif || ""); setFormOpen(true); };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    const data = { employeId, type, dateDebut, dateFin, jours: +jours, statut: statut as StatutConge, motif: motif || undefined };
    if (editing) {
      setConges((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...data } : c));
      toast({ title: "Congé modifié" });
    } else {
      setConges((prev) => [...prev, { id: `cg${Date.now()}`, ...data }]);
      toast({ title: "Congé ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setConges((prev) => prev.filter((c) => c.id !== editing.id)); toast({ title: "Congé supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><Calendar size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total demandes</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{conges.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Calendar size={20} style={{ color: "hsl(var(--chart-4))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>En attente</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{conges.filter((c) => c.statut === "EN_ATTENTE").length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Calendar size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Jours pris</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{conges.filter((c) => c.statut === "APPROUVE").reduce((s, c) => s + c.jours, 0)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Demandes de congé</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Nouvelle demande</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Employé</TableHead><TableHead>Type</TableHead><TableHead>Du</TableHead><TableHead>Au</TableHead><TableHead>Jours</TableHead><TableHead>Statut</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {conges.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{employeNom(c.employeId)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{c.type}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(c.dateDebut)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(c.dateFin)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--foreground))" }}>{c.jours}</TableCell>
                  <TableCell><Badge variant={statutColor[c.statut] as any}>{statutLabel[c.statut]}</Badge></TableCell>
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

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier le congé" : "Nouvelle demande"}>
        <form onSubmit={handleSave} className="space-y-4">
          <SelectField label="Employé" value={employeId} onValueChange={setEmployeId} options={STATIC_EMPLOYES.map((e) => ({ value: e.id, label: e.nom }))} placeholder="Choisir un employé" />
          <SelectField label="Type" value={type} onValueChange={setType} options={[{ value: "Annuel", label: "Annuel" }, { value: "Maladie", label: "Maladie" }, { value: "Personnel", label: "Personnel" }, { value: "Maternité", label: "Maternité" }]} />
          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput label="Date début" id="dateDebut" type="date" value={dateDebut} onChange={setDateDebut} required />
            <FormFieldInput label="Date fin" id="dateFin" type="date" value={dateFin} onChange={setDateFin} required />
          </div>
          <FormFieldInput label="Nombre de jours" id="jours" type="number" value={jours} onChange={setJours} min="1" required />
          <SelectField label="Statut" value={statut} onValueChange={setStatut} options={[{ value: "EN_ATTENTE", label: "En attente" }, { value: "APPROUVE", label: "Approuvé" }, { value: "REFUSE", label: "Refusé" }]} />
          <FormFieldInput label="Motif" id="motif" value={motif} onChange={setMotif} placeholder="Raison du congé" />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer ce congé ?" description="Cette action est irréversible." />
    </div>
  );
}

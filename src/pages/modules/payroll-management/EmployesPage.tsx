import { useState } from "react";
import { UserCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { STATIC_EMPLOYES, type Employe, type StatutEmploye } from "@/data/paieData";
import { formatCurrency, formatDate } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const statutColor: Record<StatutEmploye, string> = { ACTIF: "default", INACTIF: "destructive", EN_CONGE: "secondary" };
const statutLabel: Record<StatutEmploye, string> = { ACTIF: "Actif", INACTIF: "Inactif", EN_CONGE: "En congé" };

export default function EmployesPage() {
  const { toast } = useToast();
  const [employes, setEmployes] = useState<Employe[]>(STATIC_EMPLOYES);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Employe | null>(null);

  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [departement, setDepartement] = useState("");
  const [dateEmbauche, setDateEmbauche] = useState("");
  const [salaireBase, setSalaireBase] = useState("");
  const [statut, setStatut] = useState<string>("ACTIF");

  const openAdd = () => { setEditing(null); setNom(""); setPoste(""); setDepartement(""); setDateEmbauche(""); setSalaireBase(""); setStatut("ACTIF"); setFormOpen(true); };
  const openEdit = (e: Employe) => { setEditing(e); setNom(e.nom); setPoste(e.poste); setDepartement(e.departement); setDateEmbauche(e.dateEmbauche); setSalaireBase(String(e.salaireBase)); setStatut(e.statut); setFormOpen(true); };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    const data = { nom, poste, departement, dateEmbauche, salaireBase: +salaireBase, statut: statut as StatutEmploye };
    if (editing) {
      setEmployes((prev) => prev.map((e) => e.id === editing.id ? { ...e, ...data } : e));
      toast({ title: "Employé modifié" });
    } else {
      setEmployes((prev) => [...prev, { id: `emp${Date.now()}`, ...data }]);
      toast({ title: "Employé ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setEmployes((prev) => prev.filter((e) => e.id !== editing.id)); toast({ title: "Employé supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const masseSalariale = employes.reduce((s, e) => s + e.salaireBase, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><UserCheck size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Employés</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{employes.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><UserCheck size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Actifs</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{employes.filter((e) => e.statut === "ACTIF").length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><UserCheck size={20} style={{ color: "hsl(var(--chart-3))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Masse salariale</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(masseSalariale)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Liste des employés</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Poste</TableHead><TableHead>Département</TableHead><TableHead>Embauche</TableHead><TableHead>Salaire</TableHead><TableHead>Statut</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {employes.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{e.nom}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{e.poste}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{e.departement}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(e.dateEmbauche)}</TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(e.salaireBase)}</TableCell>
                  <TableCell><Badge variant={statutColor[e.statut] as any}>{statutLabel[e.statut]}</Badge></TableCell>
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

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier l'employé" : "Nouvel employé"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Nom" id="nom" value={nom} onChange={setNom} required />
          <FormFieldInput label="Poste" id="poste" value={poste} onChange={setPoste} required />
          <FormFieldInput label="Département" id="departement" value={departement} onChange={setDepartement} required />
          <FormFieldInput label="Date d'embauche" id="dateEmbauche" type="date" value={dateEmbauche} onChange={setDateEmbauche} required />
          <FormFieldInput label="Salaire de base (MGA)" id="salaireBase" type="number" value={salaireBase} onChange={setSalaireBase} min="0" required />
          <SelectField label="Statut" value={statut} onValueChange={setStatut} options={[{ value: "ACTIF", label: "Actif" }, { value: "INACTIF", label: "Inactif" }, { value: "EN_CONGE", label: "En congé" }]} />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer cet employé ?" description="Cette action est irréversible." />
    </div>
  );
}

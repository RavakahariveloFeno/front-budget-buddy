import { useState } from "react";
import { Users, Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { STATIC_CLIENTS, type Client } from "@/data/venteData";
import { formatCurrency } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import FormDialog from "@/components/dialogs/FormDialog";
import FormFieldInput from "@/components/dialogs/FormField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(STATIC_CLIENTS);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");

  const openAdd = () => { setEditing(null); setNom(""); setEmail(""); setTelephone(""); setAdresse(""); setFormOpen(true); };
  const openEdit = (c: Client) => { setEditing(c); setNom(c.nom); setEmail(c.email); setTelephone(c.telephone); setAdresse(c.adresse); setFormOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setClients((prev) => prev.map((c) => c.id === editing.id ? { ...c, nom, email, telephone, adresse } : c));
      toast({ title: "Client modifié" });
    } else {
      setClients((prev) => [...prev, { id: `c${Date.now()}`, nom, email, telephone, adresse, totalAchats: 0 }]);
      toast({ title: "Client ajouté" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (editing) { setClients((prev) => prev.filter((c) => c.id !== editing.id)); toast({ title: "Client supprimé" }); }
    setDeleteOpen(false); setEditing(null);
  };

  const totalCA = clients.reduce((s, c) => s + c.totalAchats, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Clients" subtitle="Gestion de la clientèle" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><Users size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Nombre de clients</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{clients.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Users size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total achats</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalCA)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Liste des clients</h3>
            <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Ajouter</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Total achats</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{c.nom}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}><Mail size={12} /> {c.email}</div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}><Phone size={12} /> {c.telephone}</div>
                    </div>
                  </TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{c.adresse}</TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(c.totalAchats)}</TableCell>
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

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "Modifier le client" : "Nouveau client"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormFieldInput label="Nom" id="nom" value={nom} onChange={setNom} placeholder="Ex: Rakoto Jean" required />
          <FormFieldInput label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="email@exemple.mg" required />
          <FormFieldInput label="Téléphone" id="telephone" value={telephone} onChange={setTelephone} placeholder="034 12 345 67" required />
          <FormFieldInput label="Adresse" id="adresse" value={adresse} onChange={setAdresse} placeholder="Quartier, Ville" required />
          <Button type="submit" className="w-full">{editing ? "Enregistrer" : "Ajouter"}</Button>
        </form>
      </FormDialog>
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer ce client ?" description="Cette action est irréversible." />
    </div>
  );
}

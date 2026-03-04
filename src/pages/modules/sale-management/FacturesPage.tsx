import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileText, Plus, Pencil, Trash2, Eye, PlusCircle, X, ArrowLeft } from "lucide-react";
import type { Facture, FactureStatut, LigneFacture, Client, Produit } from "@/data/venteData";
import { formatCurrency, formatDate } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createFacture, deleteFacture, getClients, getFactures, getProduits, updateFacture } from "@/api/saleApi";

function clientNom(id: string, clients: Client[]) { return clients.find((c) => c.id === id)?.nom ?? "—"; }
function produitNom(id: string, produits: Produit[]) { return produits.find((p) => p.id === id)?.nom ?? "—"; }

const statutColor: Record<FactureStatut, string> = {
  "PAYÉE": "default",
  "EN_ATTENTE": "secondary",
  "ANNULÉE": "destructive",
};

const emptyLigne = (): LigneFacture => ({ produitId: "", quantite: 1, prixUnitaire: 0 });

type ViewMode = "list" | "form";

export default function FacturesPage() {
  const { toast } = useToast();
  const { activityId } = useParams<{ activityId: string }>();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Facture | null>(null);
  const [viewing, setViewing] = useState<Facture | null>(null);

  const [numero, setNumero] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [statut, setStatut] = useState<string>("EN_ATTENTE");
  const [lignes, setLignes] = useState<LigneFacture[]>([emptyLigne()]);

  useEffect(() => {
    if (!activityId) return;
    getFactures({ activityId })
      .then(setFactures)
      .catch(() => {
        toast({ title: "Impossible de charger les factures", variant: "destructive" });
      });
    getClients({ activityId })
      .then(setClients)
      .catch(() => {
        toast({ title: "Impossible de charger les clients", variant: "destructive" });
      });
    getProduits({ activityId })
      .then(setProduits)
      .catch(() => {
        toast({ title: "Impossible de charger les produits", variant: "destructive" });
      });
  }, [activityId, toast]);

  const lignesTotal = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);

  const updateLigne = (index: number, field: keyof LigneFacture, value: string | number) => {
    setLignes((prev) => prev.map((l, i) => {
      if (i !== index) return l;
      if (field === "produitId") {
        const prod = produits.find((p) => p.id === value);
        return { ...l, produitId: value as string, prixUnitaire: prod?.prixVente ?? 0 };
      }
      return { ...l, [field]: field === "quantite" || field === "prixUnitaire" ? +value : value };
    }));
  };

  const addLigne = () => setLignes((prev) => [...prev, emptyLigne()]);
  const removeLigne = (index: number) => setLignes((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const openAdd = () => {
    setEditing(null);
    setNumero(`FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, "0")}`);
    setClientId(""); setDate(new Date().toISOString().slice(0, 10)); setStatut("EN_ATTENTE");
    setLignes([emptyLigne()]);
    setViewMode("form");
  };
  const openEdit = (f: Facture) => {
    setEditing(f); setNumero(f.numero); setClientId(f.clientId); setDate(f.date); setStatut(f.statut);
    setLignes(f.lignes.length > 0 ? [...f.lignes] : [emptyLigne()]);
    setViewMode("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLignes = lignes.filter((l) => l.produitId && l.quantite > 0);
    if (validLignes.length === 0) { toast({ title: "Ajoutez au moins un produit", variant: "destructive" }); return; }
    if (!activityId) return;
    const payload = { numero, clientId, date, statut: statut as FactureStatut, lignes: validLignes };
    try {
      if (editing) {
        const updated = await updateFacture({ activityId }, editing.id, payload);
        setFactures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        toast({ title: "Facture modifiée" });
      } else {
        const created = await createFacture({ activityId }, payload);
        setFactures((prev) => [...prev, created]);
        toast({ title: "Facture créée" });
      }
      setViewMode("list");
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editing || !activityId) { setDeleteOpen(false); setEditing(null); return; }
    try {
      await deleteFacture({ activityId }, editing.id);
      setFactures((prev) => prev.filter((f) => f.id !== editing.id));
      toast({ title: "Facture supprimée" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setEditing(null);
    }
  };

  const totalPayee = factures.filter((f) => f.statut === "PAYÉE").reduce((s, f) => s + f.total, 0);
  const totalEnAttente = factures.filter((f) => f.statut === "EN_ATTENTE").reduce((s, f) => s + f.total, 0);

  // ── FORM VIEW ──
  if (viewMode === "form") {
    return (
      <div className="animate-fade-in">
        <Header title={editing ? "Modifier la facture" : "Nouvelle facture"} subtitle="Remplissez les détails de la facture" />
        <div className="p-6">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setViewMode("list")}>
            <ArrowLeft size={16} className="mr-1" /> Retour à la liste
          </Button>

          <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
            {/* Infos générales */}
            <div className="stat-card p-5 space-y-4">
              <h3 className="font-display font-semibold text-foreground">Informations générales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormFieldInput label="Numéro" id="numero" value={numero} onChange={setNumero} required />
                <SelectField label="Client" value={clientId} onValueChange={setClientId} options={clients.map((c) => ({ value: c.id, label: c.nom }))} placeholder="Choisir un client" />
                <FormFieldInput label="Date" id="date" type="date" value={date} onChange={setDate} required />
                <SelectField label="Statut" value={statut} onValueChange={setStatut} options={[{ value: "EN_ATTENTE", label: "En attente" }, { value: "PAYÉE", label: "Payée" }, { value: "ANNULÉE", label: "Annulée" }]} />
              </div>
            </div>

            {/* Lignes de facture */}
            <div className="stat-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground">Produits</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLigne}><PlusCircle size={14} className="mr-1" /> Ajouter une ligne</Button>
              </div>

              <div className="space-y-3">
                {lignes.map((ligne, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_120px_32px] gap-3 items-end rounded-lg p-3 border border-border bg-muted/30">
                    <SelectField label={i === 0 ? "Produit" : ""} value={ligne.produitId} onValueChange={(v) => updateLigne(i, "produitId", v)} options={produits.map((p) => ({ value: p.id, label: `${p.nom} (${formatCurrency(p.prixVente)})` }))} placeholder="Choisir un produit" />
                    <FormFieldInput label={i === 0 ? "Quantité" : ""} id={`qty-${i}`} type="number" value={String(ligne.quantite)} onChange={(v) => updateLigne(i, "quantite", v)} min="1" required />
                    <div>
                      {i === 0 && <label className="text-sm font-medium block mb-1.5 text-foreground">Sous-total</label>}
                      <div className="h-10 flex items-center text-sm font-semibold text-foreground">{formatCurrency(ligne.quantite * ligne.prixUnitaire)}</div>
                    </div>
                    <button type="button" onClick={() => removeLigne(i)} className="h-10 flex items-center justify-center rounded hover:bg-destructive/20">
                      <X size={16} className="text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <div className="text-lg font-bold text-foreground">Total : {formatCurrency(lignesTotal)}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setViewMode("list")}>Annuler</Button>
              <Button type="submit">{editing ? "Enregistrer les modifications" : "Créer la facture"}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="animate-fade-in">
      <Header title="Factures" subtitle="Gestion de la facturation" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><FileText size={20} className="text-primary" /><div><p className="text-xs text-muted-foreground">Total factures</p><p className="text-xl font-bold text-foreground">{factures.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><FileText size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs text-muted-foreground">Payées</p><p className="text-xl font-bold text-foreground">{formatCurrency(totalPayee)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><FileText size={20} style={{ color: "hsl(var(--chart-4))" }} /><div><p className="text-xs text-muted-foreground">En attente</p><p className="text-xl font-bold text-foreground">{formatCurrency(totalEnAttente)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Liste des factures</h3>
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
                  <TableCell className="font-medium font-mono text-xs text-foreground">{f.numero}</TableCell>
                  <TableCell className="text-foreground">{clientNom(f.clientId, clients)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(f.date)}</TableCell>
                  <TableCell className="font-semibold text-foreground">{formatCurrency(f.total)}</TableCell>
                  <TableCell><Badge variant={statutColor[f.statut] as any}>{f.statut.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => { setViewing(f); setDetailOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Eye size={14} className="text-primary" /></button>
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded hover:bg-accent"><Pencil size={14} className="text-muted-foreground" /></button>
                      <button onClick={() => { setEditing(f); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-accent"><Trash2 size={14} className="text-destructive" /></button>
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
            <DialogTitle className="font-display text-foreground">Facture {viewing?.numero}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Client : </span><span className="text-foreground">{clientNom(viewing.clientId, clients)}</span></div>
                <div><span className="text-muted-foreground">Date : </span><span className="text-foreground">{formatDate(viewing.date)}</span></div>
                <div><span className="text-muted-foreground">Statut : </span><Badge variant={statutColor[viewing.statut] as any}>{viewing.statut}</Badge></div>
              </div>
              {viewing.lignes.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Qté</TableHead><TableHead>P.U.</TableHead><TableHead>Sous-total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {viewing.lignes.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-foreground">{produitNom(l.produitId, produits)}</TableCell>
                        <TableCell className="text-muted-foreground">{l.quantite}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(l.prixUnitaire)}</TableCell>
                        <TableCell className="font-semibold text-foreground">{formatCurrency(l.quantite * l.prixUnitaire)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="text-right text-lg font-bold text-foreground">Total : {formatCurrency(viewing.total)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} title="Supprimer cette facture ?" description="Cette action est irréversible." />
    </div>
  );
}

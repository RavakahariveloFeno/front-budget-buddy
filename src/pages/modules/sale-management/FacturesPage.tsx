import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Plus, Pencil, Trash2, Eye, PlusCircle, X, ArrowLeft, Link, Link2Off } from "lucide-react";
import type { Facture, FactureStatut, LigneFacture, Client, Produit } from "@/data/venteData";
import { formatCurrency, formatDate } from "@/data/staticData";
import Header from "@/components/layout/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FormFieldInput from "@/components/dialogs/FormField";
import SelectField from "@/components/dialogs/SelectField";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import FormDialog from "@/components/dialogs/FormDialog";
import ActionConfirmDialog from "@/components/dialogs/ActionConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient, createFacture, createProduit, deleteFacture, getClients, getFactures, getProduits, linkAllInvoicesIncome, linkInvoiceIncome, updateFacture } from "@/api/saleApi";
import type { FacturePayload } from "@/api/saleApi";

function clientNom(id: string, clients: Client[]) { return id ? (clients.find((c) => c.id === id)?.nom ?? "—") : "Sans client"; }
function produitNom(id: string, produits: Produit[]) { return produits.find((p) => p.id === id)?.nom ?? "—"; }

const NO_CLIENT_VALUE = "__NO_CLIENT__";
function paymentLabel(type?: "CASH" | "CARD") { return type === "CASH" ? "Espèces" : type === "CARD" ? "Carte" : "—"; }

const statutColor: Record<FactureStatut, string> = {
  "PAYÃ‰E": "default",
  "EN_ATTENTE": "secondary",
  "ANNULÃ‰E": "destructive",
};

const emptyLigne = (): LigneFacture => ({ produitId: "", quantite: 1, prixUnitaire: 0 });

type ViewMode = "list" | "form";
type EditableLigneFacture = LigneFacture & { _key: string };

let ligneKeyCounter = 0;

function createEditableLigne(source?: LigneFacture): EditableLigneFacture {
  return {
    ...emptyLigne(),
    ...source,
    _key: `ligne-${Date.now()}-${ligneKeyCounter++}`,
  };
}

export default function FacturesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Facture | null>(null);
  const [viewing, setViewing] = useState<Facture | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [newClientNom, setNewClientNom] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientTelephone, setNewClientTelephone] = useState("");
  const [newClientAdresse, setNewClientAdresse] = useState("");
  const [produitFormOpen, setProduitFormOpen] = useState(false);
  const [linkConfirmOpen, setLinkConfirmOpen] = useState(false);
  const [pendingCreatePayload, setPendingCreatePayload] = useState<FacturePayload | null>(null);
  const [newProdNom, setNewProdNom] = useState("");
  const [newProdRef, setNewProdRef] = useState("");
  const [newProdPrixAchat, setNewProdPrixAchat] = useState("");
  const [newProdPrixVente, setNewProdPrixVente] = useState("");

  const [numero, setNumero] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [statut, setStatut] = useState<string>("EN_ATTENTE");
  const [paymentType, setPaymentType] = useState<"CASH" | "CARD">("CASH");
  const [lignes, setLignes] = useState<EditableLigneFacture[]>([createEditableLigne()]);

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

  const addLigne = () => setLignes((prev) => [...prev, createEditableLigne()]);
  const removeLigne = (index: number) => setLignes((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const openAdd = () => {
    setEditing(null);
    setNumero(`FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, "0")}`);
    setClientId(""); setDate(new Date().toISOString().slice(0, 10)); setStatut("EN_ATTENTE");
    setPaymentType("CASH");
    setLignes([createEditableLigne()]);
    setViewMode("form");
  };
  const openEdit = (f: Facture) => {
    setEditing(f); setNumero(f.numero); setClientId(f.clientId); setDate(f.date ? f.date.split("T")[0] : ""); setStatut(f.statut);
    setPaymentType(f.paymentType || "CASH");
    setLignes(f.lignes.length > 0 ? f.lignes.map((ligne) => createEditableLigne(ligne)) : [createEditableLigne()]);
    setViewMode("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLignes = lignes.filter((l) => l.produitId && l.quantite > 0);
    if (validLignes.length === 0) { toast({ title: "Ajoutez au moins un produit", variant: "destructive" }); return; }
    if (!activityId) return;
    const payload = { numero, ...(clientId ? { clientId } : {}), date, statut: statut as FactureStatut, paymentType, lignes: validLignes };
    try {
      if (editing) {
        const updated = await updateFacture({ activityId }, editing.id, payload);
        setFactures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        toast({ title: "Facture modifiée" });
      } else {
        setPendingCreatePayload(payload);
        setLinkConfirmOpen(true);
        return;
      }
      setViewMode("list");
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const confirmCreateFacture = async (linkToGlobalIncome: boolean) => {
    if (!activityId || !pendingCreatePayload) return;
    try {
      const created = await createFacture(
        { activityId },
        { ...pendingCreatePayload, linkToGlobalIncome },
      );
      setFactures((prev) => [...prev, created]);
      setLinkConfirmOpen(false);
      setPendingCreatePayload(null);
      setViewMode("list");
      if (activityId) {
        navigate(`/activities/${activityId}/modules/mod-vente/factures`);
      }
      toast({ title: "Facture créée" });
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const handleLinkOne = async (facture: Facture) => {
    if (!activityId) return;
    const nextLinked = !Boolean(facture.linkedToGlobalIncome);
    if (nextLinked && facture.statut !== "PAYÃ‰E") {
      toast({ title: "Seules les factures payées peuvent être liées", variant: "destructive" });
      return;
    }
    try {
      await linkInvoiceIncome({ activityId }, facture.id, nextLinked);
      setFactures((prev) =>
        prev.map((row) =>
          row.id === facture.id
            ? { ...row, linkedToGlobalIncome: nextLinked }
            : row,
        ),
      );
      toast({
        title: nextLinked
          ? "Facture liée au revenu global"
          : "Liaison au compte global annulée",
      });
    } catch (error) {
      toast({ title: "Impossible de mettre à jour la liaison", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const handleLinkAll = async () => {
    if (!activityId) return;
    try {
      const linkedCount = await linkAllInvoicesIncome({ activityId });
      setFactures((prev) => prev.map((row) => (row.statut === "PAYÃ‰E" ? { ...row, linkedToGlobalIncome: true } : row)));
      toast({ title: `${linkedCount} facture(s) liée(s) au revenu global` });
    } catch (error) {
      toast({ title: "Impossible de lier toutes les factures", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
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

  const totalPayee = factures.filter((f) => f.statut === "PAYÃ‰E").reduce((s, f) => s + f.total, 0);
  const totalEnAttente = factures.filter((f) => f.statut === "EN_ATTENTE").reduce((s, f) => s + f.total, 0);

  const factureForm = (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormFieldInput label="Numéro" id="numero" value={numero} onChange={setNumero} required />
        <SelectField
          label="Client (optionnel)"
          value={clientId || NO_CLIENT_VALUE}
          onValueChange={(value) => setClientId(value === NO_CLIENT_VALUE ? "" : value)}
          options={[{ value: NO_CLIENT_VALUE, label: "Sans client" }, ...clients.map((c) => ({ value: c.id, label: c.nom }))]}
          placeholder="Choisir un client"
          onAddClick={() => {
            setNewClientNom("");
            setNewClientEmail("");
            setNewClientTelephone("");
            setNewClientAdresse("");
            setClientFormOpen(true);
          }}
        />
        <FormFieldInput label="Date" id="date" type="date" value={date} onChange={setDate} required />
        <SelectField
          label="Statut"
          value={statut}
          onValueChange={setStatut}
          options={[
            { value: "EN_ATTENTE", label: "En attente" },
            { value: "PAYÃ‰E", label: "Payée" },
            { value: "ANNULÃ‰E", label: "Annulée" },
          ]}
        />
        <SelectField
          label="Mode de paiement"
          value={paymentType}
          onValueChange={(v) => setPaymentType(v as "CASH" | "CARD")}
          options={[
            { value: "CASH", label: "Espèces" },
            { value: "CARD", label: "Carte" },
          ]}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display font-semibold text-foreground">Produits</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLigne}>
            <PlusCircle size={14} className="mr-1" /> Ajouter une ligne
          </Button>
        </div>
        <div className="space-y-3">
          {lignes.map((ligne, i) => (
            <div key={ligne._key} className="grid grid-cols-[1fr_90px_120px_32px] gap-3 items-end rounded-lg p-3 border border-border bg-muted/30">
              <SelectField
                label={i === 0 ? "Produit" : ""}
                value={ligne.produitId}
                onValueChange={(v) => updateLigne(i, "produitId", v)}
                options={produits.map((p) => ({ value: p.id, label: `${p.nom} (${formatCurrency(p.prixVente)})` }))}
                placeholder="Choisir un produit"
                onAddClick={() => {
                  setProduitFormOpen(true);
                  setNewProdNom("");
                  setNewProdRef("");
                  setNewProdPrixAchat("");
                  setNewProdPrixVente("");
                }}
              />
              <FormFieldInput label={i === 0 ? "Quantité" : ""} id={`qty-${i}`} type="number" value={String(ligne.quantite)} onChange={(v) => updateLigne(i, "quantite", v)} min="1" required />
              <FormFieldInput label={i === 0 ? "Prix unitaire" : ""} id={`pu-${i}`} type="number" value={String(ligne.prixUnitaire)} onChange={(v) => updateLigne(i, "prixUnitaire", v)} min="0" required />
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
  );

  // LIST VIEW
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
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleLinkAll}>
                <Link size={14} className="mr-1" /> Tout lier
              </Button>
              <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Nouvelle facture</Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paiement</TableHead>
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
                  <TableCell className="text-muted-foreground">{paymentLabel(f.paymentType)}</TableCell>
                  <TableCell><Badge variant={statutColor[f.statut] as any}>{f.statut.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => handleLinkOne(f)} disabled={f.statut !== "PAYÃ‰E" && !f.linkedToGlobalIncome} className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
                        {f.linkedToGlobalIncome ? <Link2Off size={14} className="text-destructive" /> : <Link size={14} className="text-primary" />}
                      </button>
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

      <FormDialog
        open={viewMode === "form"}
        onOpenChange={(open) => setViewMode(open ? "form" : "list")}
        title={editing ? "Modifier la facture" : "Nouvelle facture"}
        className="sm:max-w-4xl xl:max-w-6xl"
      >
        {factureForm}
      </FormDialog>

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
      <ActionConfirmDialog
        open={linkConfirmOpen}
        onOpenChange={setLinkConfirmOpen}
        title="Lier au compte global ?"
        description="Souhaitez-vous lier cette facture au revenu global (income) ?"
        confirmLabel="Oui, lier"
        cancelLabel="Non, ne pas lier"
        onCancelAction={() => { void confirmCreateFacture(false); }}
        onConfirm={() => { void confirmCreateFacture(true); }}
      />

      <FormDialog open={clientFormOpen} onOpenChange={setClientFormOpen} title="Nouveau client">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!activityId) return;
          try {
            const created = await createClient({ activityId }, { nom: newClientNom, email: newClientEmail, telephone: newClientTelephone, adresse: newClientAdresse });
            setClients((prev) => [...prev, created]);
            setClientId(created.id);
            setClientFormOpen(false);
            toast({ title: "Client ajouté" });
          } catch {
            toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
          }
        }} className="space-y-4">
          <FormFieldInput label="Nom" id="new-client-nom" value={newClientNom} onChange={setNewClientNom} placeholder="Ex: Rakoto Jean" required />
          <FormFieldInput label="Email" id="new-client-email" type="email" value={newClientEmail} onChange={setNewClientEmail} placeholder="email@exemple.mg" />
          <FormFieldInput label="Téléphone" id="new-client-tel" value={newClientTelephone} onChange={setNewClientTelephone} placeholder="034 12 345 67" required />
          <FormFieldInput label="Adresse" id="new-client-adr" value={newClientAdresse} onChange={setNewClientAdresse} placeholder="Quartier, Ville" required />
          <Button type="submit" className="w-full">Ajouter</Button>
        </form>
      </FormDialog>

      <FormDialog open={produitFormOpen} onOpenChange={setProduitFormOpen} title="Nouveau produit">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!activityId) return;
          try {
            const created = await createProduit({ activityId }, { nom: newProdNom, reference: newProdRef, prixAchat: +newProdPrixAchat, prixVente: +newProdPrixVente, categorie: "" });
            setProduits((prev) => [...prev, created]);
            setProduitFormOpen(false);
            toast({ title: "Produit ajouté" });
          } catch {
            toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
          }
        }} className="space-y-4">
          <FormFieldInput label="Nom" id="new-prod-nom" value={newProdNom} onChange={setNewProdNom} placeholder="Ex: Riz 50kg" required />
          <FormFieldInput label="Référence" id="new-prod-ref" value={newProdRef} onChange={setNewProdRef} placeholder="Ex: RIZ-050" />
          <div className="grid grid-cols-2 gap-3">
            <FormFieldInput label="Prix d'achat" id="new-prod-pa" type="number" value={newProdPrixAchat} onChange={setNewProdPrixAchat} min="0" required />
            <FormFieldInput label="Prix de vente" id="new-prod-pv" type="number" value={newProdPrixVente} onChange={setNewProdPrixVente} min="0" required />
          </div>
          <Button type="submit" className="w-full">Ajouter</Button>
        </form>
      </FormDialog>
    </div>
  );
}


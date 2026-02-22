import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Package, Boxes, ReceiptText, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import { formatCurrency, formatDate } from "@/data/staticData";
import type { Activity } from "@/data/staticData";
import { getActivities, getActivityStatsByUser } from "@/api/activityApi";
import type { ActivityStats } from "@/api/activityApi";
import { getActivityPremiumModules } from "@/api/premiumApi";
import {
  createSaleInvoice,
  createSaleProduct,
  deleteSaleInvoice,
  deleteSaleProduct,
  getSaleInvoices,
  getSaleProducts,
  purchaseSaleProductStock,
  updateSaleInvoice,
  updateSaleProduct,
} from "@/api/salesManagementApi";
import type { SaleInvoice, SaleProduct } from "@/api/salesManagementApi";
import { slugifyActivityName } from "@/lib/activityRoute";
import { toast } from "@/hooks/use-toast";

type SalesMenu = "products" | "stock" | "invoices";
type ActivityModuleCode = "SALES_MANAGEMENT";

interface DraftInvoiceLine {
  productId: string;
  quantity: string;
  unitSalePrice: string;
}

const EMPTY_LINE: DraftInvoiceLine = { productId: "", quantity: "1", unitSalePrice: "" };

export default function ActivityWorkspace() {
  const { activitySlug } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [enabledModules, setEnabledModules] = useState<ActivityModuleCode[]>([]);
  const [selectedModule, setSelectedModule] = useState<ActivityModuleCode | "">("");
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [salesMenu, setSalesMenu] = useState<SalesMenu>("products");

  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productStock, setProductStock] = useState("0");
  const [productPurchasePrice, setProductPurchasePrice] = useState("");
  const [productSalePrice, setProductSalePrice] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceNote, setInvoiceNote] = useState("");
  const [invoiceLines, setInvoiceLines] = useState<DraftInvoiceLine[]>([{ ...EMPTY_LINE }]);
  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductSku, setEditProductSku] = useState("");
  const [editProductPurchasePrice, setEditProductPurchasePrice] = useState("");
  const [editProductSalePrice, setEditProductSalePrice] = useState("");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editInvoiceReference, setEditInvoiceReference] = useState("");
  const [editInvoiceDate, setEditInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [editInvoiceNote, setEditInvoiceNote] = useState("");

  const totals = useMemo(
    () =>
      invoices.reduce(
        (acc, invoice) => {
          acc.totalPurchase += invoice.totalPurchase;
          acc.totalSale += invoice.totalSale;
          acc.totalProfit += invoice.profit;
          return acc;
        },
        { totalPurchase: 0, totalSale: 0, totalProfit: 0 },
      ),
    [invoices],
  );

  const loadSalesData = async (activityId: string) => {
    const [remoteProducts, remoteInvoices] = await Promise.all([getSaleProducts(activityId), getSaleInvoices(activityId)]);
    setProducts(remoteProducts);
    setInvoices(remoteInvoices);
  };

  const loadActivityStats = async (activityId: string) => {
    const allStats = await getActivityStatsByUser();
    const current = allStats.find((entry) => entry.activityId === activityId) || null;
    setActivityStats(current);
  };

  const refreshActivityData = async (activityId: string) => {
    await Promise.all([loadSalesData(activityId), loadActivityStats(activityId)]);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [activities, modules] = await Promise.all([getActivities(), getActivityPremiumModules()]);
        const matchedActivity =
          activities.find((item) => slugifyActivityName(item.name) === String(activitySlug || "")) || null;
        setActivity(matchedActivity);

        if (!matchedActivity) {
          setEnabledModules([]);
          setSelectedModule("");
          setProducts([]);
          setInvoices([]);
          return;
        }

        const activityModules = modules
          .filter((moduleAccess) => moduleAccess.activityId === matchedActivity.id && moduleAccess.isEnabled)
          .map((moduleAccess) => moduleAccess.module)
          .filter((moduleName): moduleName is ActivityModuleCode => moduleName === "SALES_MANAGEMENT");

        setEnabledModules(activityModules);
        const firstModule = activityModules[0] || "";
        setSelectedModule(firstModule);

        if (activityModules.includes("SALES_MANAGEMENT")) {
          await refreshActivityData(matchedActivity.id);
        } else {
          setProducts([]);
          setInvoices([]);
          setActivityStats(null);
        }
      } catch (error) {
        console.error("Impossible de charger l'espace activite.", error);
        toast({ title: "Erreur", description: "Chargement impossible pour le moment." });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [activitySlug]);

  const resetProductForm = () => {
    setProductName("");
    setProductSku("");
    setProductDescription("");
    setProductStock("0");
    setProductPurchasePrice("");
    setProductSalePrice("");
  };

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!activity) return;
    const stock = Number(productStock);
    const purchasePrice = Number(productPurchasePrice);
    const salePrice = Number(productSalePrice);

    if (!productName.trim() || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(purchasePrice) || purchasePrice < 0 || !Number.isFinite(salePrice) || salePrice < 0) {
      toast({ title: "Donnees invalides", description: "Verifie nom, stock et prix." });
      return;
    }

    try {
      setSubmittingProduct(true);
      const created = await createSaleProduct({
        activityId: activity.id,
        name: productName.trim(),
        sku: productSku.trim() || undefined,
        description: productDescription.trim() || undefined,
        stockQuantity: stock,
        purchasePrice,
        salePrice,
      });
      setProducts((prev) => [created, ...prev]);
      resetProductForm();
      setPurchaseProductId((prev) => prev || created.id);
      toast({ title: "Produit ajoute" });
    } catch (error) {
      console.error("Impossible de creer le produit.", error);
      toast({ title: "Erreur", description: "Creation du produit impossible." });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const patchProductStock = async (product: SaleProduct, nextStock: number) => {
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      toast({ title: "Stock invalide" });
      return;
    }
    try {
      const updated = await updateSaleProduct(product.id, { stockQuantity: nextStock });
      setProducts((prev) => prev.map((item) => (item.id === product.id ? updated : item)));
    } catch (error) {
      console.error("Impossible de mettre a jour le stock.", error);
      toast({ title: "Erreur", description: "Mise a jour stock impossible." });
    }
  };

  const quickPurchaseOneUnit = async (product: SaleProduct) => {
    if (!activity) return;
    try {
      await purchaseSaleProductStock(product.id, {
        quantity: 1,
        unitPurchasePrice: product.purchasePrice,
        date: new Date().toISOString().split("T")[0],
        note: "Achat rapide",
      });
      await refreshActivityData(activity.id);
      toast({
        title: "Achat enregistre",
        description: `Depense ajoutee: ${formatCurrency(product.purchasePrice)}`,
      });
    } catch (error) {
      console.error("Impossible d'enregistrer l'achat rapide.", error);
      toast({ title: "Erreur", description: "Achat rapide impossible." });
    }
  };

  const startEditProduct = (product: SaleProduct) => {
    setEditingProductId(product.id);
    setEditProductName(product.name);
    setEditProductSku(product.sku || "");
    setEditProductPurchasePrice(String(product.purchasePrice));
    setEditProductSalePrice(String(product.salePrice));
  };

  const submitEditProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingProductId || !activity) return;
    const purchasePrice = Number(editProductPurchasePrice);
    const salePrice = Number(editProductSalePrice);
    if (!editProductName.trim() || !Number.isFinite(purchasePrice) || purchasePrice < 0 || !Number.isFinite(salePrice) || salePrice < 0) {
      toast({ title: "Donnees invalides", description: "Verifie nom et prix." });
      return;
    }

    try {
      const updated = await updateSaleProduct(editingProductId, {
        name: editProductName.trim(),
        sku: editProductSku.trim() || undefined,
        purchasePrice,
        salePrice,
      });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingProductId(null);
      toast({ title: "Produit modifie" });
    } catch (error) {
      console.error("Impossible de modifier le produit.", error);
      toast({ title: "Erreur", description: "Modification produit impossible." });
    }
  };

  const removeProduct = async (productId: string) => {
    if (!activity) return;
    try {
      await deleteSaleProduct(productId);
      await refreshActivityData(activity.id);
      toast({ title: "Produit supprime" });
    } catch (error) {
      console.error("Impossible de supprimer le produit.", error);
      toast({ title: "Erreur", description: "Suppression produit impossible." });
    }
  };

  const startEditInvoice = (invoice: SaleInvoice) => {
    setEditingInvoiceId(invoice.id);
    setEditInvoiceReference(invoice.reference || "");
    setEditInvoiceDate(invoice.saleDate.split("T")[0]);
    setEditInvoiceNote(invoice.note || "");
  };

  const submitEditInvoice = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingInvoiceId || !activity) return;

    try {
      const updated = await updateSaleInvoice(editingInvoiceId, {
        reference: editInvoiceReference.trim() || undefined,
        saleDate: editInvoiceDate,
        note: editInvoiceNote.trim() || undefined,
      });
      setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      await refreshActivityData(activity.id);
      setEditingInvoiceId(null);
      toast({ title: "Facture modifiee" });
    } catch (error) {
      console.error("Impossible de modifier la facture.", error);
      toast({ title: "Erreur", description: "Modification facture impossible." });
    }
  };

  const removeInvoice = async (invoiceId: string) => {
    if (!activity) return;
    try {
      await deleteSaleInvoice(invoiceId);
      await refreshActivityData(activity.id);
      toast({ title: "Facture supprimee" });
    } catch (error) {
      console.error("Impossible de supprimer la facture.", error);
      toast({ title: "Erreur", description: "Suppression facture impossible." });
    }
  };

  const addInvoiceLine = () => setInvoiceLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeInvoiceLine = (index: number) => setInvoiceLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  const updateInvoiceLine = (index: number, field: keyof DraftInvoiceLine, value: string) =>
    setInvoiceLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));

  const resetInvoiceForm = () => {
    setInvoiceReference("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceNote("");
    setInvoiceLines([{ ...EMPTY_LINE }]);
  };

  const resetPurchaseForm = () => {
    setPurchaseQuantity("1");
    setPurchaseUnitPrice("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setPurchaseNote("");
  };

  const handlePurchaseStock = async (event: FormEvent) => {
    event.preventDefault();
    if (!activity) return;
    const quantity = Number(purchaseQuantity);
    const unitPrice = purchaseUnitPrice ? Number(purchaseUnitPrice) : undefined;
    if (!purchaseProductId) {
      toast({ title: "Produit requis", description: "Selectionne un produit." });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ title: "Quantite invalide", description: "La quantite doit etre > 0." });
      return;
    }
    if (unitPrice !== undefined && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
      toast({ title: "Prix invalide", description: "Le prix achat doit etre >= 0." });
      return;
    }

    try {
      setSubmittingPurchase(true);
      await purchaseSaleProductStock(purchaseProductId, {
        quantity,
        unitPurchasePrice: unitPrice,
        date: purchaseDate,
        note: purchaseNote.trim() || undefined,
      });
      await refreshActivityData(activity.id);
      resetPurchaseForm();
      toast({ title: "Achat stock enregistre", description: "Depense liee a l'activite creee." });
    } catch (error) {
      console.error("Impossible d'enregistrer l'achat de stock.", error);
      toast({ title: "Erreur", description: "Achat de stock impossible." });
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const handleCreateInvoice = async (event: FormEvent) => {
    event.preventDefault();
    if (!activity) return;
    const items = invoiceLines
      .map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitSalePrice: line.unitSalePrice ? Number(line.unitSalePrice) : undefined,
      }))
      .filter((line) => line.productId);

    if (items.length === 0 || items.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0)) {
      toast({ title: "Lignes invalides", description: "Ajoute des lignes valides." });
      return;
    }

    try {
      setSubmittingInvoice(true);
      await createSaleInvoice({
        activityId: activity.id,
        reference: invoiceReference.trim() || undefined,
        saleDate: invoiceDate,
        note: invoiceNote.trim() || undefined,
        items,
      });
      await refreshActivityData(activity.id);
      resetInvoiceForm();
      toast({ title: "Facture creee" });
    } catch (error) {
      console.error("Impossible de creer la facture.", error);
      toast({ title: "Erreur", description: "Creation facture impossible." });
    } finally {
      setSubmittingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="Espace activite" subtitle="Chargement..." />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="animate-fade-in">
        <Header title="Espace activite" subtitle="Activite introuvable" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title={activity.name} subtitle="Modules importes sur cette activite" />
      <div className="p-6 space-y-6">
        {enabledModules.length === 0 ? (
          <div className="stat-card">
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Aucun module actif
            </p>
            <p className="text-sm mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Active un module depuis la page Activites pour l'utiliser ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="stat-card">
              <p className="text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                Module lie a cette activite
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <select
                  className="input max-w-sm"
                  value={selectedModule}
                  onChange={(event) => setSelectedModule(event.target.value as ActivityModuleCode)}
                >
                  {enabledModules.map((moduleCode) => (
                    <option key={moduleCode} value={moduleCode}>
                      {moduleCode === "SALES_MANAGEMENT" ? "Gestion de vente" : moduleCode}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1 min-w-[320px]">
                  <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--border))" }}>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Revenus</p>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>{formatCurrency(activityStats?.income || 0)}</p>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--border))" }}>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Depenses</p>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(activityStats?.expense || 0)}</p>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--border))" }}>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Invest</p>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--info))" }}>{formatCurrency((activityStats?.receivedInvestment || 0) - (activityStats?.sentInvestment || 0))}</p>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--border))" }}>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Pret restant</p>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--warning))" }}>{formatCurrency(activityStats?.remainingLoan || 0)}</p>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "hsl(var(--border))" }}>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Solde dispo</p>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
                      {formatCurrency((activityStats?.income || 0) - (activityStats?.expense || 0) - (activityStats?.sentInvestment || 0) + (activityStats?.receivedInvestment || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedModule === "SALES_MANAGEMENT" ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="stat-card lg:col-span-1 lg:sticky lg:top-2 lg:self-start">
                  <p className="font-display font-semibold mb-3" style={{ color: "hsl(var(--foreground))" }}>
                    Menus gestion de vente
                  </p>
                  <div className="space-y-2">
                    <button className={`nav-item w-full ${salesMenu === "products" ? "active" : ""}`} onClick={() => setSalesMenu("products")}>
                      <Package size={16} />
                      <span>Produits</span>
                    </button>
                    <button className={`nav-item w-full ${salesMenu === "stock" ? "active" : ""}`} onClick={() => setSalesMenu("stock")}>
                      <Boxes size={16} />
                      <span>Stock</span>
                    </button>
                    <button className={`nav-item w-full ${salesMenu === "invoices" ? "active" : ""}`} onClick={() => setSalesMenu("invoices")}>
                      <ReceiptText size={16} />
                      <span>Factures</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Produits</p>
                  <p className="text-xl font-display font-bold">{products.length}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Ventes</p>
                  <p className="text-xl font-display font-bold">{formatCurrency(totals.totalSale)}</p>
                </div>
                <div className="stat-card">
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Benefice</p>
                  <p className="text-xl font-display font-bold">{formatCurrency(totals.totalProfit)}</p>
                </div>
              </div>

              {salesMenu === "products" ? (
                <div className="space-y-4">
                  <div className="stat-card">
                    <p className="font-display font-semibold mb-4">Ajouter produit</p>
                    <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input className="input" placeholder="Nom" value={productName} onChange={(e) => setProductName(e.target.value)} />
                      <input className="input" placeholder="SKU" value={productSku} onChange={(e) => setProductSku(e.target.value)} />
                      <input className="input sm:col-span-2" placeholder="Description" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
                      <input className="input" type="number" min="0" step="0.01" placeholder="Stock initial" value={productStock} onChange={(e) => setProductStock(e.target.value)} />
                      <input className="input" type="number" min="0" step="0.01" placeholder="Prix achat" value={productPurchasePrice} onChange={(e) => setProductPurchasePrice(e.target.value)} />
                      <input className="input" type="number" min="0" step="0.01" placeholder="Prix vente" value={productSalePrice} onChange={(e) => setProductSalePrice(e.target.value)} />
                      <button type="submit" disabled={submittingProduct} className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
                        {submittingProduct ? "Ajout..." : "Ajouter"}
                      </button>
                    </form>
                  </div>
                  <div className="stat-card">
                    <p className="font-display font-semibold mb-4">Liste produits</p>
                    <div className="overflow-x-auto">
                      <table className="w-full data-table">
                        <thead>
                          <tr>
                            <th className="text-left">Nom</th>
                            <th className="text-left">SKU</th>
                            <th className="text-right">Achat</th>
                            <th className="text-right">Vente</th>
                            <th className="text-right">Stock</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td>{product.sku || "-"}</td>
                              <td className="text-right">{formatCurrency(product.purchasePrice)}</td>
                              <td className="text-right">{formatCurrency(product.salePrice)}</td>
                              <td className="text-right">{product.stockQuantity}</td>
                              <td className="text-right">
                                <div className="flex justify-end gap-1">
                                  <button className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--border))" }} onClick={() => startEditProduct(product)}>Modifier</button>
                                  <button className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }} onClick={() => void removeProduct(product.id)}>Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {editingProductId ? (
                      <form onSubmit={submitEditProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <input className="input" placeholder="Nom" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} />
                        <input className="input" placeholder="SKU" value={editProductSku} onChange={(e) => setEditProductSku(e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" placeholder="Prix achat" value={editProductPurchasePrice} onChange={(e) => setEditProductPurchasePrice(e.target.value)} />
                        <input className="input" type="number" min="0" step="0.01" placeholder="Prix vente" value={editProductSalePrice} onChange={(e) => setEditProductSalePrice(e.target.value)} />
                        <div className="flex gap-2 sm:col-span-2">
                          <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>Enregistrer</button>
                          <button type="button" className="px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "hsl(var(--border))" }} onClick={() => setEditingProductId(null)}>Annuler</button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {salesMenu === "stock" ? (
                <div className="space-y-4">
                  <div className="stat-card">
                    <p className="font-display font-semibold mb-4">Achat stock (cree une depense)</p>
                    <form onSubmit={handlePurchaseStock} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select className="input" value={purchaseProductId} onChange={(e) => setPurchaseProductId(e.target.value)}>
                        <option value="">Produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input className="input" type="number" min="0.01" step="0.01" placeholder="Quantite" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} />
                      <input className="input" type="number" min="0" step="0.01" placeholder="Prix achat unitaire (optionnel)" value={purchaseUnitPrice} onChange={(e) => setPurchaseUnitPrice(e.target.value)} />
                      <input className="input" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                      <input className="input sm:col-span-2" placeholder="Note (optionnel)" value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)} />
                      <button type="submit" disabled={submittingPurchase} className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
                        {submittingPurchase ? "Enregistrement..." : "Enregistrer achat"}
                      </button>
                    </form>
                  </div>

                  <div className="stat-card">
                    <p className="font-display font-semibold mb-4">Gestion stock</p>
                    <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                      `+1` = achat rapide (cree une depense). `-1` = correction manuelle de stock (sans depense).
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full data-table">
                        <thead>
                          <tr>
                            <th className="text-left">Produit</th>
                            <th className="text-right">Stock</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td className="text-right">{product.stockQuantity}</td>
                              <td className="text-right">
                                <div className="flex justify-end gap-1">
                                  <button className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--border))" }} onClick={() => void quickPurchaseOneUnit(product)}>+1</button>
                                  <button className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--border))" }} onClick={() => void patchProductStock(product, Math.max(0, product.stockQuantity - 1))}>-1</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              {salesMenu === "invoices" ? (
                <div className="space-y-4">
                  <div className="stat-card">
                    <p className="font-display font-semibold mb-4">Nouvelle facture</p>
                    <form onSubmit={handleCreateInvoice} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input className="input" placeholder="Reference" value={invoiceReference} onChange={(e) => setInvoiceReference(e.target.value)} />
                        <input className="input" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                        <input className="input sm:col-span-2" placeholder="Note" value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        {invoiceLines.map((line, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <select className="input sm:col-span-6" value={line.productId} onChange={(e) => updateInvoiceLine(index, "productId", e.target.value)}>
                              <option value="">Produit</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} (Stock: {product.stockQuantity})
                                </option>
                              ))}
                            </select>
                            <input className="input sm:col-span-2" type="number" min="0.01" step="0.01" placeholder="Qt" value={line.quantity} onChange={(e) => updateInvoiceLine(index, "quantity", e.target.value)} />
                            <input className="input sm:col-span-3" type="number" min="0" step="0.01" placeholder="Prix (opt)" value={line.unitSalePrice} onChange={(e) => updateInvoiceLine(index, "unitSalePrice", e.target.value)} />
                            <button type="button" onClick={() => removeInvoiceLine(index)} className="sm:col-span-1 px-2 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>X</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={addInvoiceLine} className="px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                          <Plus size={12} className="inline mr-1" />
                          Ligne
                        </button>
                        <button type="submit" disabled={submittingInvoice} className="px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-60" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
                          {submittingInvoice ? "Creation..." : "Creer facture"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="stat-card">
                    <p className="font-display font-semibold mb-4">Factures</p>
                    <div className="overflow-x-auto">
                      <table className="w-full data-table">
                        <thead>
                          <tr>
                            <th className="text-left">Date</th>
                            <th className="text-left">Reference</th>
                            <th className="text-left">Articles</th>
                            <th className="text-right">Achat</th>
                            <th className="text-right">Vente</th>
                            <th className="text-right">Benefice</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td>{formatDate(invoice.saleDate)}</td>
                              <td>{invoice.reference || "-"}</td>
                              <td>{invoice.items.map((line) => `${line.product?.name || line.productId} x${line.quantity}`).join(", ")}</td>
                              <td className="text-right">{formatCurrency(invoice.totalPurchase)}</td>
                              <td className="text-right">{formatCurrency(invoice.totalSale)}</td>
                              <td className="text-right">{formatCurrency(invoice.profit)}</td>
                              <td className="text-right">
                                <div className="flex justify-end gap-1">
                                  <button className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--border))" }} onClick={() => startEditInvoice(invoice)}>Modifier</button>
                                  <button className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }} onClick={() => void removeInvoice(invoice.id)}>Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {editingInvoiceId ? (
                      <form onSubmit={submitEditInvoice} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <input className="input" placeholder="Reference" value={editInvoiceReference} onChange={(e) => setEditInvoiceReference(e.target.value)} />
                        <input className="input" type="date" value={editInvoiceDate} onChange={(e) => setEditInvoiceDate(e.target.value)} />
                        <input className="input" placeholder="Note" value={editInvoiceNote} onChange={(e) => setEditInvoiceNote(e.target.value)} />
                        <div className="flex gap-2 sm:col-span-3">
                          <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>Enregistrer</button>
                          <button type="button" className="px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "hsl(var(--border))" }} onClick={() => setEditingInvoiceId(null)}>Annuler</button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                </div>
              ) : null}
                </div>
              </div>
            ) : (
              <div className="stat-card">
                <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  Module non supporte dans cette version
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import type { Client, Facture, LigneFacture, Produit, StockItem } from "@/data/venteData";
import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const SALE_API_URL = `${import.meta.env.VITE_API_URL}/sale`;

async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as any;
    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length) {
      return String(message[0]);
    }
  } catch {
    // ignore
  }

  return `HTTP ${response.status}`;
}

export interface SaleContextParams {
  activityId: string;
  userId?: string;
}

function getContext(params: SaleContextParams): { userId: string; activityId: string } {
  const userId = params.userId ?? getRequiredUserId();
  if (!params.activityId) {
    throw new Error("activityId requis pour les appels vente");
  }
  return { userId, activityId: params.activityId };
}

// ── Mapping helpers ────────────────────────────────────────

function mapProduit(data: any): Produit {
  const categoryName =
    data?.productCategory && typeof data.productCategory === "object"
      ? String(data.productCategory.name ?? "")
      : String(data.category ?? "");

  return {
    id: String(data.id ?? ""),
    nom: String(data.name ?? ""),
    reference: String(data.reference ?? ""),
    prixAchat: Number(data.purchasePrice ?? 0),
    prixVente: Number(data.salePrice ?? 0),
    categorie: categoryName,
  };
}

function mapClient(data: any): Client {
  return {
    id: String(data.id ?? ""),
    nom: String(data.name ?? ""),
    email: String(data.email ?? ""),
    telephone: String(data.phone ?? ""),
    adresse: String(data.address ?? ""),
    totalAchats: Number(data.totalPurchases ?? 0),
  };
}

function mapFacture(data: any): Facture {
  const status = String(data.status ?? "PENDING");
  let statut: Facture["statut"] = "EN_ATTENTE";
  if (status === "PAID") statut = "PAYÉE";
  else if (status === "CANCELED") statut = "ANNULÉE";

  const lignes: LigneFacture[] = Array.isArray(data.lines)
    ? data.lines.map((l: any) => ({
        produitId: String(l.productId ?? ""),
        quantite: Number(l.quantity ?? 0),
        prixUnitaire: Number(l.unitPrice ?? 0),
      }))
    : [];

  const rawPaymentType = String(data?.paymentType ?? "").toUpperCase();
  const paymentType = rawPaymentType === "CASH" || rawPaymentType === "CARD" ? (rawPaymentType as "CASH" | "CARD") : undefined;

  return {
    id: String(data.id ?? ""),
    numero: String(data.number ?? ""),
    clientId: String(data.clientId ?? ""),
    date: String(data.date ?? ""),
    lignes,
    statut,
    total: Number(data.total ?? 0),
    ...(paymentType ? { paymentType } : {}),
  };
}

function mapStockItem(data: any): StockItem {
  const rawPaymentType = String(data?.paymentType ?? "").toUpperCase();
  const paymentType = rawPaymentType === "CASH" || rawPaymentType === "CARD" ? (rawPaymentType as "CASH" | "CARD") : undefined;

  return {
    id: String(data.id ?? ""),
    produitId: String(data.productId ?? ""),
    quantite: Number(data.quantity ?? 0),
    seuilAlerte: Number(data.alertThreshold ?? 0),
    emplacement: String(data.location ?? ""),
    derniereMaj: String(data.lastUpdated ?? ""),
    ...(paymentType ? { paymentType } : {}),
  };
}

// ── Produits ───────────────────────────────────────────────

export interface ProduitPayload {
  nom: string;
  reference: string;
  prixAchat: number;
  prixVente: number;
  categorie: string;
}

export interface ProductCategoryOption {
  id: string;
  name: string;
}

export async function getProduits(params: SaleContextParams): Promise<Produit[]> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/products?userId=${userId}&activityId=${activityId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapProduit(item));
}

export async function getProductCategories(params: SaleContextParams): Promise<ProductCategoryOption[]> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/product-categories?userId=${userId}&activityId=${activityId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((record: any) => ({
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
  })).filter((item) => item.id && item.name);
}

export async function createProductCategory(
  params: SaleContextParams,
  name: string,
): Promise<ProductCategoryOption> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/product-categories`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name,
      userId,
      activityId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: any = await response.json();
  return {
    id: String(data.id ?? ""),
    name: String(data.name ?? ""),
  };
}

export async function updateProductCategory(
  params: SaleContextParams,
  id: string,
  name: string,
): Promise<ProductCategoryOption> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/product-categories/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name,
      userId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: any = await response.json();
  return {
    id: String(data.id ?? ""),
    name: String(data.name ?? ""),
  };
}

export async function deleteProductCategory(
  params: SaleContextParams,
  id: string,
): Promise<void> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/product-categories/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export async function createProduit(params: SaleContextParams, payload: ProduitPayload): Promise<Produit> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/products`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name: payload.nom,
      reference: payload.reference,
      purchasePrice: payload.prixAchat,
      salePrice: payload.prixVente,
      category: payload.categorie,
      userId,
      activityId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  return mapProduit(data);
}

export async function updateProduit(
  params: SaleContextParams,
  id: string,
  payload: ProduitPayload,
): Promise<Produit> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/products/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name: payload.nom,
      reference: payload.reference,
      purchasePrice: payload.prixAchat,
      salePrice: payload.prixVente,
      category: payload.categorie,
      userId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  return mapProduit(data);
}

export async function deleteProduit(params: SaleContextParams, id: string): Promise<void> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/products/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// ── Clients ────────────────────────────────────────────────

export interface ClientPayload {
  nom: string;
  email?: string;
  telephone: string;
  adresse: string;
}

export async function getClients(params: SaleContextParams): Promise<Client[]> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/clients?userId=${userId}&activityId=${activityId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapClient(item));
}

export async function createClient(params: SaleContextParams, payload: ClientPayload): Promise<Client> {
  const { userId, activityId } = getContext(params);
  const email = payload.email?.trim();
  const response = await fetch(`${SALE_API_URL}/clients`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name: payload.nom,
      ...(email ? { email } : {}),
      phone: payload.telephone,
      address: payload.adresse,
      userId,
      activityId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  return mapClient(data);
}

export async function updateClient(
  params: SaleContextParams,
  id: string,
  payload: ClientPayload,
): Promise<Client> {
  const { userId } = getContext(params);
  const email = payload.email?.trim();
  const response = await fetch(`${SALE_API_URL}/clients/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      name: payload.nom,
      ...(email ? { email } : {}),
      phone: payload.telephone,
      address: payload.adresse,
      userId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  return mapClient(data);
}

export async function deleteClient(params: SaleContextParams, id: string): Promise<void> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/clients/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// ── Factures ───────────────────────────────────────────────

export type FactureStatutInput = "PAYÉE" | "EN_ATTENTE" | "ANNULÉE";

export interface FacturePayload {
  numero: string;
  clientId?: string;
  date: string;
  statut: FactureStatutInput;
  paymentType?: "CASH" | "CARD";
  lignes: LigneFacture[];
}

export async function getFactures(params: SaleContextParams): Promise<Facture[]> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/invoices?userId=${userId}&activityId=${activityId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapFacture(item));
}

export async function createFacture(params: SaleContextParams, payload: FacturePayload): Promise<Facture> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/invoices`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      number: payload.numero,
      ...(payload.clientId ? { clientId: payload.clientId } : {}),
      date: new Date(payload.date).toISOString(),
      status: payload.statut,
      paymentType: payload.paymentType,
      lines: payload.lignes.map((l) => ({
        productId: l.produitId,
        quantity: l.quantite,
        unitPrice: l.prixUnitaire,
      })),
      userId,
      activityId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  return mapFacture(data);
}

export async function updateFacture(
  params: SaleContextParams,
  id: string,
  payload: FacturePayload,
): Promise<Facture> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/invoices/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      number: payload.numero,
      clientId: payload.clientId ?? null,
      date: new Date(payload.date).toISOString(),
      status: payload.statut,
      paymentType: payload.paymentType,
      lines: payload.lignes.map((l) => ({
        productId: l.produitId,
        quantity: l.quantite,
        unitPrice: l.prixUnitaire,
      })),
      userId,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  return mapFacture(data);
}

export async function deleteFacture(params: SaleContextParams, id: string): Promise<void> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/invoices/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// ── Stock ──────────────────────────────────────────────────

export interface StockPayload {
  produitId: string;
  quantite: number;
  seuilAlerte: number;
  emplacement: string;
  paymentType?: "CASH" | "CARD";
}

export async function getStock(params: SaleContextParams): Promise<StockItem[]> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/stock?userId=${userId}&activityId=${activityId}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapStockItem(item));
}

export async function createStockItem(
  params: SaleContextParams,
  payload: StockPayload,
): Promise<StockItem> {
  const { userId, activityId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/stock`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      productId: payload.produitId,
      quantity: payload.quantite,
      alertThreshold: payload.seuilAlerte,
      location: payload.emplacement,
      paymentType: payload.paymentType,
      userId,
      activityId,
    }),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response));
  const data: unknown = await response.json();
  return mapStockItem(data);
}

export async function updateStockItem(
  params: SaleContextParams,
  id: string,
  payload: StockPayload,
): Promise<StockItem> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/stock/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      productId: payload.produitId,
      quantity: payload.quantite,
      alertThreshold: payload.seuilAlerte,
      location: payload.emplacement,
      paymentType: payload.paymentType,
      userId,
    }),
  });
  if (!response.ok) throw new Error(await readApiErrorMessage(response));
  const data: unknown = await response.json();
  return mapStockItem(data);
}

export async function deleteStockItem(params: SaleContextParams, id: string): Promise<void> {
  const { userId } = getContext(params);
  const response = await fetch(`${SALE_API_URL}/stock/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}


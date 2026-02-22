import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const SALES_API_URL = "http://localhost:3001/sales-management";

export interface SaleProduct {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  stockQuantity: number;
  purchasePrice: number;
  salePrice: number;
  activityId?: string;
  userId: string;
  createdAt?: string;
}

export interface SaleInvoiceItem {
  id: string;
  quantity: number;
  unitPurchasePrice: number;
  unitSalePrice: number;
  linePurchaseTotal: number;
  lineSaleTotal: number;
  lineProfit: number;
  productId: string;
  product?: SaleProduct;
}

export interface SaleInvoice {
  id: string;
  reference?: string;
  saleDate: string;
  note?: string;
  quantityTotal: number;
  totalPurchase: number;
  totalSale: number;
  profit: number;
  activityId?: string;
  userId: string;
  items: SaleInvoiceItem[];
}

export interface CreateSaleProductPayload {
  activityId: string;
  name: string;
  sku?: string;
  description?: string;
  stockQuantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface UpdateSaleProductPayload {
  name?: string;
  sku?: string;
  description?: string;
  stockQuantity?: number;
  purchasePrice?: number;
  salePrice?: number;
  activityId?: string;
}

export interface CreateSaleInvoiceLinePayload {
  productId: string;
  quantity: number;
  unitSalePrice?: number;
}

export interface CreateSaleInvoicePayload {
  activityId: string;
  reference?: string;
  saleDate?: string;
  note?: string;
  items: CreateSaleInvoiceLinePayload[];
}

export interface PurchaseStockPayload {
  quantity: number;
  unitPurchasePrice?: number;
  date?: string;
  note?: string;
}

export interface UpdateSaleInvoicePayload {
  reference?: string;
  saleDate?: string;
  note?: string;
}

function mapSaleProduct(item: unknown): SaleProduct | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  if (!id) {
    return null;
  }

  return {
    id,
    name: String(record.name ?? ""),
    stockQuantity: Number(record.stockQuantity ?? 0),
    purchasePrice: Number(record.purchasePrice ?? 0),
    salePrice: Number(record.salePrice ?? 0),
    userId: String(record.userId ?? ""),
    ...(record.sku ? { sku: String(record.sku) } : {}),
    ...(record.description ? { description: String(record.description) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
    ...(record.createdAt ? { createdAt: String(record.createdAt) } : {}),
  };
}

function mapSaleInvoiceItem(item: unknown): SaleInvoiceItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  if (!id) {
    return null;
  }

  const mappedProduct = mapSaleProduct(record.product);

  return {
    id,
    quantity: Number(record.quantity ?? 0),
    unitPurchasePrice: Number(record.unitPurchasePrice ?? 0),
    unitSalePrice: Number(record.unitSalePrice ?? 0),
    linePurchaseTotal: Number(record.linePurchaseTotal ?? 0),
    lineSaleTotal: Number(record.lineSaleTotal ?? 0),
    lineProfit: Number(record.lineProfit ?? 0),
    productId: String(record.productId ?? ""),
    ...(mappedProduct ? { product: mappedProduct } : {}),
  };
}

function mapSaleInvoice(item: unknown): SaleInvoice | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "");
  if (!id) {
    return null;
  }

  const items = Array.isArray(record.items)
    ? record.items.map((line) => mapSaleInvoiceItem(line)).filter((line): line is SaleInvoiceItem => Boolean(line))
    : [];

  return {
    id,
    saleDate: String(record.saleDate ?? ""),
    quantityTotal: Number(record.quantityTotal ?? 0),
    totalPurchase: Number(record.totalPurchase ?? 0),
    totalSale: Number(record.totalSale ?? 0),
    profit: Number(record.profit ?? 0),
    userId: String(record.userId ?? ""),
    items,
    ...(record.reference ? { reference: String(record.reference) } : {}),
    ...(record.note ? { note: String(record.note) } : {}),
    ...(record.activityId ? { activityId: String(record.activityId) } : {}),
  };
}

function toIsoDate(date?: string): string | undefined {
  if (!date) {
    return undefined;
  }
  return new Date(date).toISOString();
}

export async function getSaleProducts(activityId: string): Promise<SaleProduct[]> {
  const userId = getRequiredUserId();
  const suffix = `?activityId=${encodeURIComponent(activityId)}`;
  const response = await fetch(`${SALES_API_URL}/products/user/${userId}${suffix}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) => mapSaleProduct(item)).filter((item): item is SaleProduct => Boolean(item));
}

export async function createSaleProduct(payload: CreateSaleProductPayload): Promise<SaleProduct> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/products`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      ...payload,
      userId,
      sku: payload.sku || undefined,
      description: payload.description || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const mapped = mapSaleProduct(data);
  if (!mapped) {
    throw new Error("Invalid product response");
  }
  return mapped;
}

export async function updateSaleProduct(id: string, payload: UpdateSaleProductPayload): Promise<SaleProduct> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/products/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      ...payload,
      userId,
      activityId: payload.activityId === "none" ? null : payload.activityId || undefined,
      sku: payload.sku || undefined,
      description: payload.description || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const mapped = mapSaleProduct(data);
  if (!mapped) {
    throw new Error("Invalid product response");
  }
  return mapped;
}

export async function deleteSaleProduct(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/products/${id}/delete`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function getSaleInvoices(activityId: string): Promise<SaleInvoice[]> {
  const userId = getRequiredUserId();
  const suffix = `?activityId=${encodeURIComponent(activityId)}`;
  const response = await fetch(`${SALES_API_URL}/invoices/user/${userId}${suffix}`, {
    headers: buildAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) => mapSaleInvoice(item)).filter((item): item is SaleInvoice => Boolean(item));
}

export async function createSaleInvoice(payload: CreateSaleInvoicePayload): Promise<SaleInvoice> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/invoices`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      ...payload,
      userId,
      reference: payload.reference || undefined,
      note: payload.note || undefined,
      saleDate: toIsoDate(payload.saleDate),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  const mapped = mapSaleInvoice(data);
  if (!mapped) {
    throw new Error("Invalid invoice response");
  }
  return mapped;
}

export async function updateSaleInvoice(id: string, payload: UpdateSaleInvoicePayload): Promise<SaleInvoice> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/invoices/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      userId,
      reference: payload.reference || undefined,
      saleDate: toIsoDate(payload.saleDate),
      note: payload.note || undefined,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data: unknown = await response.json();
  const mapped = mapSaleInvoice(data);
  if (!mapped) {
    throw new Error("Invalid invoice response");
  }
  return mapped;
}

export async function deleteSaleInvoice(id: string): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/invoices/${id}/delete`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export async function purchaseSaleProductStock(productId: string, payload: PurchaseStockPayload): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${SALES_API_URL}/products/${productId}/purchase`, {
    method: "POST",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      userId,
      quantity: payload.quantity,
      unitPurchasePrice: payload.unitPurchasePrice,
      date: toIsoDate(payload.date),
      note: payload.note || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

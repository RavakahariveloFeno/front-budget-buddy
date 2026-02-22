export type ActivityType = "SALARY" | "BUSINESS" | "FREELANCE" | "OTHER";
export type PaymentType = "CASH" | "CARD";
export type BudgetPeriod = "DAY" | "WEEK" | "MONTH";
export type LoanType = "BANK" | "FRIEND" | "COMPANY" | "OTHER";
export type LoanStatus = "ACTIVE" | "PAID";

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  description?: string;
  startDate: string;
  userId: string;
}

export interface Investment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  fromActivityId: string;
  toActivityId: string;
}

export interface Income {
  id: string;
  amount: number;
  paymentType?: PaymentType;
  date: string;
  description?: string;
  activityId?: string;
  recurringIncomeId?: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  userId: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;
  activityId?: string;
  recurringExpenseId?: string;
  userId: string;
}

export interface Budget {
  id: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  userId: string;
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  loanId: string;
}

export interface Loan {
  id: string;
  totalAmount: number;
  remainingAmount: number;
  type: LoanType;
  lenderName: string;
  interestRate?: number;
  startDate: string;
  endDate?: string;
  status: LoanStatus;
  activityId?: string;
  userId: string;
  payments: LoanPayment[];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-MG", { style: "currency", currency: "MGA" }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Modules ──────────────────────────────────────────────
export interface ModuleMenu {
  id: string;
  label: string;
  icon: string; // lucide icon name
  path: string; // route segment
}

export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // CSS variable name
  menus: ModuleMenu[];
}

export const PREDEFINED_MODULES: AppModule[] = [
  {
    id: "mod-vente",
    name: "Gestion de vente",
    description: "Gestion des ventes, stocks, factures et produits",
    icon: "ShoppingCart",
    color: "primary",
    menus: [
      { id: "menu-stock", label: "Stock", icon: "Package", path: "stock" },
      { id: "menu-facture", label: "Factures", icon: "FileText", path: "factures" },
      { id: "menu-produit", label: "Produits", icon: "Box", path: "produits" },
      { id: "menu-client", label: "Clients", icon: "Users", path: "clients" },
    ],
  },
  {
    id: "mod-achat-revente",
    name: "Achat–revente de marchandises",
    description: "Suivi des achats et reventes de marchandises",
    icon: "Repeat",
    color: "purple",
    menus: [
      { id: "menu-achats", label: "Achats", icon: "ShoppingBag", path: "achats" },
      { id: "menu-reventes", label: "Reventes", icon: "DollarSign", path: "reventes" },
      { id: "menu-marge", label: "Marges", icon: "TrendingUp", path: "marges" },
      { id: "menu-fournisseur", label: "Fournisseurs", icon: "Truck", path: "fournisseurs" },
    ],
  },
];

// Many-to-many link between Activity and Module
export interface ActivityModuleLink {
  activityId: string;
  moduleId: string;
}


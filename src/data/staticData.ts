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
      { id: "menu-product-category", label: "Categories", icon: "Tags", path: "categories-produits" },
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
  {
    id: "mod-comptabilite",
    name: "Comptabilité",
    description: "Suivi comptable lié aux dépenses et revenus",
    icon: "BookOpen",
    color: "chart-2",
    menus: [
      { id: "menu-journal", label: "Journal", icon: "BookOpen", path: "journal" },
      { id: "menu-plan-comptable", label: "Plan comptable", icon: "List", path: "plan-comptable" },
      { id: "menu-bilan", label: "Bilan", icon: "BarChart3", path: "bilan" },
      { id: "menu-tresorerie", label: "Trésorerie", icon: "Landmark", path: "tresorerie" },
    ],
  },
  {
    id: "mod-paie",
    name: "Gestion de paie",
    description: "Gestion des employés, fiches de paie et charges",
    icon: "Wallet",
    color: "chart-3",
    menus: [
      { id: "menu-employes", label: "Employés", icon: "UserCheck", path: "employes" },
      { id: "menu-fiches-paie", label: "Fiches de paie", icon: "Receipt", path: "fiches-paie" },
      { id: "menu-charges", label: "Charges sociales", icon: "PiggyBank", path: "charges" },
      { id: "menu-conges", label: "Congés", icon: "Calendar", path: "conges" },
    ],
  },
  {
    id: "mod-tresorerie",
    name: "Suivi de trésorerie",
    description: "Encaissements, décaissements et prévisions financières",
    icon: "TrendingUp",
    color: "chart-4",
    menus: [
      { id: "menu-encaissements", label: "Encaissements", icon: "ArrowDownLeft", path: "encaissements" },
      { id: "menu-decaissements", label: "Décaissements", icon: "ArrowUpRight", path: "decaissements" },
      { id: "menu-previsions", label: "Prévisions", icon: "LineChart", path: "previsions" },
      { id: "menu-rapports", label: "Rapports", icon: "FileBarChart", path: "rapports" },
    ],
  },
];

// Many-to-many link between Activity and Module
export interface ActivityModuleLink {
  activityId: string;
  moduleId: string;
}


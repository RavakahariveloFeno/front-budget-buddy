export type MenuAccessKey =
  | "dashboard"
  | "activities"
  | "modules"
  | "incomes"
  | "expenses"
  | "categories"
  | "budgets"
  | "loans"
  | "investments"
  | "settings";

export const MENU_ACCESS_ITEMS: Array<{ key: MenuAccessKey; label: string; path: string }> = [
  { key: "dashboard", label: "Tableau de bord", path: "/" },
  { key: "activities", label: "Activités", path: "/activities" },
  { key: "modules", label: "Modules", path: "/modules" },
  { key: "incomes", label: "Revenus", path: "/incomes" },
  { key: "expenses", label: "Dépenses", path: "/expenses" },
  { key: "categories", label: "Catégories", path: "/categories" },
  { key: "budgets", label: "Budgets", path: "/budgets" },
  { key: "loans", label: "Prêts", path: "/loans" },
  { key: "investments", label: "Investissements", path: "/investments" },
  { key: "settings", label: "Paramètres", path: "/settings" },
];

export function getFirstAllowedMenuPath(keys: string[]): string {
  const allowed = new Set(keys);
  const match = MENU_ACCESS_ITEMS.find((item) => allowed.has(item.key));
  return match?.path ?? "/";
}


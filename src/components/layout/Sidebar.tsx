import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Tag,
  PiggyBank,
  CreditCard,
  ArrowLeftRight,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getCurrentUser } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";

const navItems = [
  { key: "dashboard", to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { key: "activities", to: "/activities", icon: Briefcase, label: "Activités" },
  { key: "incomes", to: "/incomes", icon: TrendingUp, label: "Revenus" },
  { key: "expenses", to: "/expenses", icon: TrendingDown, label: "Dépenses" },
  { key: "categories", to: "/categories", icon: Tag, label: "Catégories" },
  { key: "budgets", to: "/budgets", icon: PiggyBank, label: "Budgets" },
  { key: "loans", to: "/loans", icon: CreditCard, label: "Prêts" },
  { key: "investments", to: "/investments", icon: ArrowLeftRight, label: "Investissements" },
  { key: "settings", to: "/settings", icon: Settings, label: "Paramètres" },
];

export default function Sidebar() {
  const currentUser = getCurrentUser();
  const isManagedProfile = Boolean(currentUser?.profileId);
  const { data: managedProfile } = useActiveManagedProfile();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const visibleNavItems = useMemo(() => {
    if (!isManagedProfile) {
      return navItems;
    }
    const allowed = new Set(managedProfile?.menuAccess ?? []);
    return navItems.filter((item) => allowed.has(item.key));
  }, [isManagedProfile, managedProfile?.menuAccess]);

  return (
    <aside
      className="relative flex flex-col h-screen transition-all duration-300 border-r"
      style={{
        width: collapsed ? "72px" : "240px",
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        >
          <img src="/pilgo-logo.png" alt="Pilgo logo" className="w-full h-full object-cover rounded-lg" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="font-display font-bold text-sm" style={{ color: "hsl(var(--sidebar-accent-foreground))" }}>Pilgo</p>
            <p className="text-xs" style={{ color: "hsl(var(--sidebar-foreground))" }}>Pilotage budgetaire</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}>
              <div className={`nav-item ${isActive ? "active" : ""}`} title={collapsed ? label : undefined}>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="animate-fade-in truncate">{label}</span>}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-20 flex items-center justify-center w-7 h-7 rounded-full border z-10 transition-all hover:scale-110"
        style={{
          background: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}

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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const baseNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/activities", icon: Briefcase, label: "Activites" },
  { to: "/incomes", icon: TrendingUp, label: "Revenus" },
  { to: "/expenses", icon: TrendingDown, label: "Depenses" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/budgets", icon: PiggyBank, label: "Budgets" },
  { to: "/loans", icon: CreditCard, label: "Prets" },
  { to: "/investments", icon: ArrowLeftRight, label: "Investissements" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navItems = useMemo(() => baseNavItems, []);

  return (
    <aside
      className="relative flex flex-col h-screen transition-all duration-300 border-r"
      style={{
        width: collapsed ? "72px" : "240px",
        background: "hsl(var(--sidebar-background))",
        borderColor: "hsl(var(--sidebar-border))",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <span className="text-base font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>
            $
          </span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="font-display font-bold text-sm" style={{ color: "hsl(var(--sidebar-accent-foreground))" }}>
              FinanceFlow
            </p>
            <p className="text-xs" style={{ color: "hsl(var(--sidebar-foreground))" }}>
              Gestion personnelle
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
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

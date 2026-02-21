import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  LogOut,
} from "lucide-react";
import { clearSessionToken, getCurrentUser } from "@/api/authApi";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/activities", icon: Briefcase, label: "Activités" },
  { to: "/incomes", icon: TrendingUp, label: "Revenus" },
  { to: "/expenses", icon: TrendingDown, label: "Dépenses" },
  { to: "/categories", icon: Tag, label: "Catégories" },
  { to: "/budgets", icon: PiggyBank, label: "Budgets" },
  { to: "/loans", icon: CreditCard, label: "Prêts" },
  { to: "/investments", icon: ArrowLeftRight, label: "Investissements" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Mon compte";
  const userEmail = currentUser?.email ?? "-";
  const userInitials = currentUser
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
    : "MC";

  const handleLogout = () => {
    clearSessionToken();
    navigate("/signin", { replace: true });
  };

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
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <span className="text-base font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>₣</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="font-display font-bold text-sm" style={{ color: "hsl(var(--sidebar-accent-foreground))" }}>FinanceFlow</p>
            <p className="text-xs" style={{ color: "hsl(var(--sidebar-foreground))" }}>Gestion personnelle</p>
          </div>
        )}
      </div>

      {/* Nav */}
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

      {/* User */}
      <div className="border-t px-2 py-3" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            {userInitials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--sidebar-accent-foreground))" }}>
                {userName}
              </p>
              <p className="text-xs truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                {userEmail}
              </p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="p-1 rounded-md hover:bg-secondary/30 transition-colors" title="Se deconnecter">
              <LogOut size={14} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--sidebar-foreground))" }} />
            </button>
          )}
        </div>
      </div>

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

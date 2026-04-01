import { useMemo, useState, type ComponentType, type CSSProperties } from "react";
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
  Shield,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { getCurrentUser } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";
import { useActivityFilterStore } from "@/stores/activityFilterStore";
import { useQuery } from "@tanstack/react-query";
import { getActivityModules } from "@/api/moduleApi";
import { PREDEFINED_MODULES } from "@/data/staticData";
import * as Icons from "lucide-react";

const superAdminNavItem = { key: "superadmin", to: "/superadmin", icon: Shield, label: "Superadmin" };

const navItems = [
  { key: "dashboard", to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { key: "activities", to: "/activities", icon: Briefcase, label: "Activités" },
  { key: "modules", permissionKey: "activities", to: "/modules", icon: LayoutGrid, label: "Modules" },
  { key: "incomes", to: "/incomes", icon: TrendingUp, label: "Revenus" },
  { key: "expenses", to: "/expenses", icon: TrendingDown, label: "Dépenses" },
  { key: "categories", to: "/categories", icon: Tag, label: "Catégories" },
  { key: "budgets", to: "/budgets", icon: PiggyBank, label: "Budgets" },
  { key: "loans", to: "/loans", icon: CreditCard, label: "Prêts" },
  { key: "investments", to: "/investments", icon: ArrowLeftRight, label: "Investissements" },
  { key: "settings", to: "/settings", icon: Settings, label: "Paramètres" },
];

function DynamicIcon({ name, ...props }: { name: string; size?: number; className?: string; style?: CSSProperties }) {
  const Icon = (Icons as unknown as Record<string, ComponentType<any>>)[name];
  return Icon ? <Icon {...props} /> : <LayoutGrid {...props} />;
}

export default function Sidebar({
  mode = "desktop",
  onNavigate,
}: {
  mode?: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  const currentUser = getCurrentUser();
  const isManagedProfile = Boolean(currentUser?.profileId);
  const isSuperAdminUser = currentUser?.role === "SUPERADMIN";
  const { data: managedProfile } = useActiveManagedProfile();
  const selectedActivityId = useActivityFilterStore((state) => state.selectedActivityId);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isDrawer = mode === "drawer";
  const effectiveCollapsed = isDrawer ? false : collapsed;

  const { data: selectedActivityModuleIds = [] } = useQuery({
    queryKey: ["activityModules", selectedActivityId],
    queryFn: () => getActivityModules(selectedActivityId!),
    enabled: Boolean(selectedActivityId),
    staleTime: 30_000,
  });

  const visibleModules = useMemo(() => {
    if (!selectedActivityId) {
      return [];
    }

    const linked = PREDEFINED_MODULES.filter((module) => selectedActivityModuleIds.includes(module.id));
    if (!isManagedProfile) {
      return linked;
    }

    const allowedLinks = new Set(managedProfile?.moduleLinks ?? []);
    return linked.filter((module) => allowedLinks.has(`${selectedActivityId}::${module.id}`));
  }, [isManagedProfile, managedProfile?.moduleLinks, selectedActivityId, selectedActivityModuleIds]);

  const visibleNavItems = useMemo(() => {
    const baseItems = [...navItems, ...(isSuperAdminUser ? [superAdminNavItem] : [])];
    const effectiveItems = selectedActivityId ? baseItems.filter((item) => item.key !== "activities") : baseItems;
    if (!isManagedProfile) {
      return effectiveItems;
    }
    const allowed = new Set(managedProfile?.menuAccess ?? []);
    return effectiveItems.filter((item) => {
      const permissionKey = "permissionKey" in item ? item.permissionKey : item.key;
      return allowed.has(permissionKey);
    });
  }, [isManagedProfile, isSuperAdminUser, managedProfile?.menuAccess, selectedActivityId]);

  return (
    <aside
      className="relative flex flex-col h-screen transition-all duration-300 border-r"
      style={{
        width: effectiveCollapsed ? "72px" : "240px",
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
        {!effectiveCollapsed && (
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
            <NavLink key={to} to={to} onClick={onNavigate}>
              <div className={`nav-item ${isActive ? "active" : ""}`} title={effectiveCollapsed ? label : undefined}>
                <Icon size={18} className="flex-shrink-0" />
                {!effectiveCollapsed && <span className="animate-fade-in truncate">{label}</span>}
              </div>
            </NavLink>
          );
        })}

        {selectedActivityId && visibleModules.length > 0 && (
          <div className="pt-3 mt-3 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            {!effectiveCollapsed && (
              <p className="px-3 pb-2 text-[11px] uppercase tracking-wide" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                Modules
              </p>
            )}
            {visibleModules.map((module) => {
              const firstMenuPath = module.menus[0]?.path ?? "stock";
              const to = `/activities/${selectedActivityId}/modules/${module.id}/${firstMenuPath}`;
              const isActive = location.pathname.startsWith(`/activities/${selectedActivityId}/modules/${module.id}`);
              return (
                <NavLink key={module.id} to={to} onClick={onNavigate}>
                  <div className={`nav-item ${isActive ? "active" : ""}`} title={effectiveCollapsed ? module.name : undefined}>
                    <DynamicIcon name={module.icon} size={18} className="flex-shrink-0" style={{ color: `hsl(var(--${module.color}))` }} />
                    {!effectiveCollapsed && <span className="animate-fade-in truncate">{module.name}</span>}
                  </div>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      {!isDrawer && (
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
      )}
    </aside>
  );
}

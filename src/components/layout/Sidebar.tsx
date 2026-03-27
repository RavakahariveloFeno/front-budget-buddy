import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import * as Icons from "lucide-react";
import { getCurrentUser } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";
import { PREDEFINED_MODULES } from "@/data/staticData";
import { getActivityModules } from "@/api/moduleApi";

const superAdminNavItem = { key: "superadmin", to: "/superadmin", icon: Shield, label: "Superadmin" };

const navItems = [
  { key: "dashboard", to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { key: "activities", to: "/activities", icon: Briefcase, label: "Activités" },
  { key: "investments", to: "/investments", icon: ArrowLeftRight, label: "Investissements" },
  { key: "settings", to: "/settings", icon: Settings, label: "Paramètres" },
];

function DynamicIcon({ name, ...props }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<any>>)[name];
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
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isDrawer = mode === "drawer";
  const effectiveCollapsed = isDrawer ? false : collapsed;
  const [linkedModuleIds, setLinkedModuleIds] = useState<string[]>([]);

  const routeContext = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const activityId = segments[0] === "activities" && segments[1] ? segments[1] : null;
    const modulesIndex = segments.indexOf("modules");
    const moduleId = modulesIndex >= 0 && segments.length > modulesIndex + 1 ? segments[modulesIndex + 1] : null;
    const menuPath = modulesIndex >= 0 && segments.length > modulesIndex + 2 ? segments[modulesIndex + 2] : null;
    return { activityId, moduleId, menuPath };
  }, [location.pathname]);

  useEffect(() => {
    if (!routeContext.activityId) {
      setLinkedModuleIds([]);
      return;
    }

    let cancelled = false;
    getActivityModules(routeContext.activityId)
      .then((ids) => {
        if (!cancelled) {
          setLinkedModuleIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLinkedModuleIds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeContext.activityId]);

  const visibleNavItems = useMemo(() => {
    const baseItems = [...navItems, ...(isSuperAdminUser ? [superAdminNavItem] : [])];
    if (!isManagedProfile) {
      return baseItems;
    }
    const allowed = new Set(managedProfile?.menuAccess ?? []);
    return baseItems.filter((item) => allowed.has(item.key));
  }, [isManagedProfile, isSuperAdminUser, managedProfile?.menuAccess]);

  const visibleModules = useMemo(() => {
    const { activityId } = routeContext;
    if (!activityId) {
      return [];
    }

    const baseLinked = linkedModuleIds;
    if (!isManagedProfile) {
      return PREDEFINED_MODULES.filter((m) => baseLinked.includes(m.id));
    }

    const allowedLinks = new Set(managedProfile?.moduleLinks ?? []);
    const allowedModuleIds = baseLinked.filter((moduleId) => allowedLinks.has(`${activityId}::${moduleId}`));
    return PREDEFINED_MODULES.filter((m) => allowedModuleIds.includes(m.id));
  }, [routeContext, linkedModuleIds, isManagedProfile, managedProfile?.moduleLinks]);

  const activeModule = useMemo(() => {
    if (!routeContext.moduleId) {
      return null;
    }

    return visibleModules.find((m) => m.id === routeContext.moduleId) ?? null;
  }, [routeContext.moduleId, visibleModules]);

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

        {routeContext.activityId && visibleModules.length ? (
          <div className="pt-3 mt-3 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            {!effectiveCollapsed && (
              <div className="px-3 pb-2 text-[10px] uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                Modules
              </div>
            )}

            {visibleModules.map((mod) => {
              const to = `/activities/${routeContext.activityId}/modules/${mod.id}/${mod.menus[0]?.path ?? ""}`;
              const isActive = Boolean(routeContext.moduleId && mod.id === routeContext.moduleId);
              return (
                <NavLink key={mod.id} to={to} onClick={onNavigate}>
                  <div className={`nav-item ${isActive ? "active" : ""}`} title={effectiveCollapsed ? mod.name : undefined}>
                    <DynamicIcon name={mod.icon} size={18} className="flex-shrink-0" />
                    {!effectiveCollapsed && <span className="animate-fade-in truncate">{mod.name}</span>}
                  </div>
                </NavLink>
              );
            })}

            {activeModule ? (
              <div className="mt-1">
                {activeModule.menus.map((menu) => {
                  const to = `/activities/${routeContext.activityId}/modules/${activeModule.id}/${menu.path}`;
                  const isActive = routeContext.menuPath === menu.path;
                  return (
                    <NavLink key={menu.id} to={to} onClick={onNavigate}>
                      <div
                        className={`nav-item ${isActive ? "active" : ""}`}
                        title={effectiveCollapsed ? menu.label : undefined}
                        style={{ paddingLeft: effectiveCollapsed ? undefined : "42px" }}
                      >
                        <DynamicIcon name={menu.icon} size={16} className="flex-shrink-0" />
                        {!effectiveCollapsed && <span className="animate-fade-in truncate">{menu.label}</span>}
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
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

import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import * as Icons from "lucide-react";
import Header from "@/components/layout/Header";
import { PREDEFINED_MODULES } from "@/data/staticData";
import { getCurrentUser } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";
import { useActivityFilterStore } from "@/stores/activityFilterStore";
import {
  getModuleStatusLabel,
  isModuleBlockedByStatus,
  useModuleCatalogStore,
} from "@/stores/moduleCatalogStore";

// ── Vente ──
import StockPage from "@/pages/modules/sale-management/StockPage";
import FacturesPage from "@/pages/modules/sale-management/FacturesPage";
import ProduitsPage from "@/pages/modules/sale-management/ProduitsPage";
import ClientsPage from "@/pages/modules/sale-management/ClientsPage";
import ProductCategoriesPage from "@/pages/modules/sale-management/ProductCategoriesPage";

// ── Comptabilité ──
import JournalPage from "@/pages/modules/accounting-management/JournalPage";
import PlanComptablePage from "@/pages/modules/accounting-management/PlanComptablePage";
import BilanPage from "@/pages/modules/accounting-management/BilanPage";
import TresoreriePage from "@/pages/modules/accounting-management/TresoreriePage";

// ── Paie ──
import EmployesPage from "@/pages/modules/payroll-management/EmployesPage";
import FichesPaiePage from "@/pages/modules/payroll-management/FichesPaiePage";
import ChargesPage from "@/pages/modules/payroll-management/ChargesPage";
import CongesPage from "@/pages/modules/payroll-management/CongesPage";

// ── Trésorerie ──
import EncaissementsPage from "@/pages/modules/cash-management/EncaissementsPage";
import DecaissementsPage from "@/pages/modules/cash-management/DecaissementsPage";
import PrevisionsPage from "@/pages/modules/cash-management/PrevisionsPage";
import RapportsPage from "@/pages/modules/cash-management/RapportsPage";

const PAGE_MAP: Record<string, React.ComponentType> = {
  // Vente
  stock: StockPage,
  factures: FacturesPage,
  produits: ProduitsPage,
  clients: ClientsPage,
  "categories-produits": ProductCategoriesPage,
  // Comptabilité
  journal: JournalPage,
  "plan-comptable": PlanComptablePage,
  bilan: BilanPage,
  tresorerie: TresoreriePage,
  // Paie
  employes: EmployesPage,
  "fiches-paie": FichesPaiePage,
  charges: ChargesPage,
  conges: CongesPage,
  // Trésorerie
  encaissements: EncaissementsPage,
  decaissements: DecaissementsPage,
  previsions: PrevisionsPage,
  rapports: RapportsPage,
};

function DynamicIcon({ name, ...props }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<any>>)[name];
  return Icon ? <Icon {...props} /> : <LayoutGrid {...props} />;
}

export default function ModuleMenuPage() {
  const { activityId, moduleId, menuPath } = useParams<{ activityId: string; moduleId: string; menuPath: string }>();
  const navigate = useNavigate();
  const setSelectedActivityId = useActivityFilterStore((s) => s.setSelectedActivityId);
  const currentUser = getCurrentUser();
  const isManagedProfile = Boolean(currentUser?.profileId);
  const { data: managedProfile, isLoading: isLoadingManagedProfile } = useActiveManagedProfile();
  const getModuleStatus = useModuleCatalogStore((s) => s.getModuleStatus);

  useEffect(() => {
    if (activityId) {
      setSelectedActivityId(activityId);
    }
  }, [activityId, setSelectedActivityId]);

  const module = PREDEFINED_MODULES.find((m) => m.id === moduleId);
  const menu = module?.menus.find((m) => m.path === menuPath);
  const moduleStatus = moduleId ? getModuleStatus(moduleId) : "FREE";
  const moduleBlocked = isModuleBlockedByStatus(moduleStatus);

  if (moduleBlocked) {
    return (
      <div className="animate-fade-in p-6">
        <button onClick={() => navigate(`/activities/${activityId}`)} className="flex items-center gap-2 text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Ce module est indisponible ({getModuleStatusLabel(moduleStatus)}).
        </p>
      </div>
    );
  }

  if (isManagedProfile) {
    if (isLoadingManagedProfile) {
      return null;
    }

    const allowed = Boolean(managedProfile?.moduleLinks?.includes(`${activityId}::${moduleId}`));
    if (!allowed) {
      return (
        <div className="animate-fade-in p-6">
          <button onClick={() => navigate(`/activities/${activityId}`)} className="flex items-center gap-2 text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft size={16} /> Retour
          </button>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Acces refuse.</p>
        </div>
      );
    }
  }

  if (!module || !menu) {
    return (
      <div className="animate-fade-in p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>Page introuvable.</p>
      </div>
    );
  }

  const PageComponent = PAGE_MAP[menuPath!];

  return (
    <div className="animate-fade-in">
      {/* Top bar: back + module name */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(`/activities/${activityId}`)}
          className="flex items-center gap-1.5 text-sm hover:underline"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft size={14} /> Retour
        </button>
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>|</span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <DynamicIcon name={module.icon} size={16} style={{ color: `hsl(var(--${module.color}))` }} />
          <span className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{module.name}</span>
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {moduleId?.startsWith("mod-comptabilite-") && <span className="badge-warning text-[10px]">En cours</span>}
            {moduleId === "mod-vente" && <span className="badge-income text-[10px]">Disponible</span>}
          </div>
        </div>
      </div>

      {/* Menu navigation tabs */}
      <div className="px-6 pb-2">
        <div
          className="flex gap-1 overflow-x-auto rounded-lg p-1"
          style={{ background: "hsl(var(--secondary))" }}
        >
          {module.menus.map((m) => {
            const isActive = m.path === menuPath;
            return (
              <Link
                key={m.id}
                to={`/activities/${activityId}/modules/${moduleId}/${m.path}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: isActive ? "hsl(var(--background))" : "transparent",
                  color: isActive ? `hsl(var(--${module.color}))` : "hsl(var(--muted-foreground))",
                  boxShadow: isActive ? "0 1px 3px hsl(var(--foreground) / 0.1)" : "none",
                }}
              >
                <DynamicIcon name={m.icon} size={14} />
                {m.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      {PageComponent ? (
        <PageComponent />
      ) : (
        <div className="p-6">
          <div className="stat-card text-center py-16">
            <DynamicIcon name={menu.icon} size={48} className="mx-auto mb-4" style={{ color: `hsl(var(--${module.color}))` }} />
            <p className="font-display font-semibold text-lg" style={{ color: "hsl(var(--foreground))" }}>
              {menu.label}
            </p>
            <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
              Cette page est prête à accueillir les fonctionnalités de <strong>{menu.label}</strong>.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
              <LayoutGrid size={14} />
              Contenu à venir
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

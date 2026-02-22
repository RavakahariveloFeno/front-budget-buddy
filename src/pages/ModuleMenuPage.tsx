import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import * as Icons from "lucide-react";
import Header from "@/components/layout/Header";
import { PREDEFINED_MODULES } from "@/data/staticData";
import StockPage from "@/pages/modules/StockPage";
import FacturesPage from "@/pages/modules/FacturesPage";
import ProduitsPage from "@/pages/modules/ProduitsPage";
import ClientsPage from "@/pages/modules/ClientsPage";

const PAGE_MAP: Record<string, React.ComponentType> = {
  stock: StockPage,
  factures: FacturesPage,
  produits: ProduitsPage,
  clients: ClientsPage,
};

function DynamicIcon({ name, ...props }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<any>>)[name];
  return Icon ? <Icon {...props} /> : <LayoutGrid {...props} />;
}

export default function ModuleMenuPage() {
  const { activityId, moduleId, menuPath } = useParams<{ activityId: string; moduleId: string; menuPath: string }>();
  const navigate = useNavigate();

  const module = PREDEFINED_MODULES.find((m) => m.id === moduleId);
  const menu = module?.menus.find((m) => m.path === menuPath);

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

  // If a dedicated page exists, render it
  const PageComponent = PAGE_MAP[menuPath!];
  if (PageComponent) {
    return <PageComponent />;
  }

  // Fallback placeholder
  return (
    <div className="animate-fade-in">
      <Header title={menu.label} subtitle={`Module : ${module.name}`} />
      <div className="p-6 space-y-6">
        <button
          onClick={() => navigate(`/activities/${activityId}`)}
          className="flex items-center gap-2 text-sm hover:underline"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft size={16} /> Retour au module
        </button>

        <div className="stat-card text-center py-16">
          <DynamicIcon name={menu.icon} size={48} className="mx-auto mb-4" style={{ color: `hsl(var(--${module.color}))` }} />
          <p className="font-display font-semibold text-lg" style={{ color: "hsl(var(--foreground))" }}>
            {menu.label}
          </p>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            Cette page est prête à accueillir les fonctionnalités de <strong>{menu.label}</strong> du module <strong>{module.name}</strong>.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
            <LayoutGrid size={14} />
            Contenu à venir
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Briefcase, LayoutGrid } from "lucide-react";
import * as Icons from "lucide-react";
import Header from "@/components/layout/Header";
import { PREDEFINED_MODULES, type Activity, type AppModule } from "@/data/staticData";
import { getActivities } from "@/api/activityApi";
import { useModuleStore } from "@/stores/moduleStore";
import { useActivityFilterStore } from "@/stores/activityFilterStore";
import { getActivityModules } from "@/api/moduleApi";
import { getCurrentUser } from "@/api/authApi";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";
import { isModuleBlockedByStatus, useModuleCatalogStore } from "@/stores/moduleCatalogStore";

function DynamicIcon({ name, ...props }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<any>>)[name];
  return Icon ? <Icon {...props} /> : <LayoutGrid {...props} />;
}

export default function ActivityDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const setSelectedActivityId = useActivityFilterStore((s) => s.setSelectedActivityId);
  const [activity, setActivity] = useState<Activity | null>(null);
  const getModuleIds = useModuleStore((s) => s.getModuleIds);
  const setLinks = useModuleStore((s) => s.setLinks);
  const currentUser = getCurrentUser();
  const getModuleStatus = useModuleCatalogStore((s) => s.getModuleStatus);
  const isManagedProfile = Boolean(currentUser?.profileId);
  const { data: managedProfile, isLoading: isLoadingManagedProfile } = useActiveManagedProfile();

  useEffect(() => {
    if (activityId) {
      setSelectedActivityId(activityId);
    }
  }, [activityId, setSelectedActivityId]);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getActivities();
        const found = all.find((a) => a.id === activityId);
        setActivity(found || null);

        if (found) {
          try {
            const ids = await getActivityModules(found.id);
            setLinks(found.id, ids);
          } catch {
            setLinks(found.id, []);
          }
        }
      } catch {
        setActivity(null);
      }
    };
    load();
  }, [activityId]);

  if (!activity) {
    return (
      <div className="animate-fade-in p-6">
        <button onClick={() => navigate("/activities")} className="flex items-center gap-2 text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          <ArrowLeft size={16} /> Retour aux activités
        </button>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>Activité introuvable.</p>
      </div>
    );
  }

  const linkedModuleIds = getModuleIds(activity.id);
  const allowedModuleIds =
    !isManagedProfile
      ? linkedModuleIds
      : (!managedProfile || isLoadingManagedProfile)
        ? []
        : linkedModuleIds.filter((moduleId) => managedProfile.moduleLinks.includes(`${activity.id}::${moduleId}`));

  const linkedModules = PREDEFINED_MODULES
    .filter((m) => allowedModuleIds.includes(m.id))
    .filter((m) => !isModuleBlockedByStatus(getModuleStatus(m.id)));

  return (
    <div className="animate-fade-in">
      <Header title={activity.name} subtitle="Modules et menus associés" />
      <div className="p-6 space-y-6">
        <button onClick={() => navigate("/activities")} className="flex items-center gap-2 text-sm hover:underline" style={{ color: "hsl(var(--muted-foreground))" }}>
          <ArrowLeft size={16} /> Retour aux activités
        </button>

        {linkedModules.length === 0 ? (
          <div className="stat-card text-center py-12">
            <LayoutGrid size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Aucun module lié
            </p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              Modifiez cette activité pour y associer des modules.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {linkedModules.map((mod) => (
              <ModuleCard key={mod.id} module={mod} activityId={activity.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleCard({ module, activityId }: { module: AppModule; activityId: string }) {
  const isAccounting = module.id === "mod-comptabilite";
  const isSaleManagement = module.id === "mod-vente";
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--${module.color}-dim))` }}>
          <DynamicIcon name={module.icon} size={18} style={{ color: `hsl(var(--${module.color}))` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
              {module.name}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAccounting && <span className="badge-warning text-[10px]">En cours</span>}
              {isSaleManagement && <span className="badge-income text-[10px]">Disponible</span>}
            </div>
          </div>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {module.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {module.menus.map((menu) => (
          <Link
            key={menu.id}
            to={`/activities/${activityId}/modules/${module.id}/${menu.path}`}
            className="flex items-center gap-2.5 p-3 rounded-lg transition-all hover:scale-[1.02]"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
          >
            <DynamicIcon name={menu.icon} size={16} style={{ color: `hsl(var(--${module.color}))` }} />
            <span className="text-sm font-medium">{menu.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

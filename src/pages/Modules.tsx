import { useEffect, useMemo, useState } from "react";
import { Download, LayoutGrid, Unlink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { PREDEFINED_MODULES, type Activity } from "@/data/staticData";
import { getActivities } from "@/api/activityApi";
import { getActivityModules, setActivityModules } from "@/api/moduleApi";
import { toast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/api/authApi";
import { useModuleStore } from "@/stores/moduleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  getModuleStatusLabel,
  isModuleBlockedByStatus,
  type ModuleCatalogStatus,
  useModuleCatalogStore,
} from "@/stores/moduleCatalogStore";

const ALLOWED_MODULE_IDS = new Set(["mod-vente", "mod-calendrier"]);

function getStatusStyles(status: ModuleCatalogStatus): { bg: string; color: string; border: string } {
  switch (status) {
    case "COMING_SOON":
      return {
        bg: "hsl(var(--warning-dim))",
        color: "hsl(var(--warning))",
        border: "hsl(var(--warning) / 0.35)",
      };
    case "SOON":
      return {
        bg: "hsl(var(--secondary))",
        color: "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
      };
    case "PAID":
      return {
        bg: "hsl(var(--purple-dim))",
        color: "hsl(var(--purple))",
        border: "hsl(var(--purple) / 0.35)",
      };
    case "FREE":
    default:
      return {
        bg: "hsl(var(--primary-dim))",
        color: "hsl(var(--primary))",
        border: "hsl(var(--primary) / 0.35)",
      };
  }
}

export default function Modules() {
  const queryClient = useQueryClient();
  const isManagedProfile = Boolean(getCurrentUser()?.profileId);
  const setLinks = useModuleStore((s) => s.setLinks);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modulesByActivityId, setModulesByActivityId] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [modalMode, setModalMode] = useState<"import" | "remove">("import");
  const getModuleStatus = useModuleCatalogStore((s) => s.getModuleStatus);
  const getModulePrice = useModuleCatalogStore((s) => s.getModulePrice);
  const visibleModules = useMemo(
    () => PREDEFINED_MODULES.filter((module) => ALLOWED_MODULE_IDS.has(module.id)),
    [],
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await getActivities();
        setActivities(list);
        const all = await Promise.all(
          list.map(async (activity) => {
            try {
              const moduleIds = await getActivityModules(activity.id);
              return [activity.id, moduleIds] as const;
            } catch {
              return [activity.id, []] as const;
            }
          }),
        );
        setModulesByActivityId(Object.fromEntries(all));
      } catch (error) {
        console.error("Impossible de charger les modules.", error);
        setActivities([]);
        setModulesByActivityId({});
        toast({ title: "Erreur", description: "Impossible de charger les modules." });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const moduleActivityCount = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleModules.forEach((module) => {
      counts[module.id] = activities.reduce((acc, activity) => {
        const linked = modulesByActivityId[activity.id] ?? [];
        return acc + (linked.includes(module.id) ? 1 : 0);
      }, 0);
    });
    return counts;
  }, [activities, modulesByActivityId, visibleModules]);

  const sortedModules = useMemo(
    () =>
      [...visibleModules].sort(
        (a, b) => (moduleActivityCount[b.id] ?? 0) - (moduleActivityCount[a.id] ?? 0),
      ),
    [moduleActivityCount, visibleModules],
  );

  const activeModule = useMemo(
    () => visibleModules.find((module) => module.id === activeModuleId) ?? null,
    [activeModuleId, visibleModules],
  );
  const linkedActivitiesForActiveModule = useMemo(
    () =>
      !activeModuleId
        ? []
        : activities.filter((activity) => (modulesByActivityId[activity.id] ?? []).includes(activeModuleId)),
    [activeModuleId, activities, modulesByActivityId],
  );

  const openImportModal = (moduleId: string) => {
    setModalMode("import");
    setActiveModuleId(moduleId);
    setSelectedActivityIds([]);
    setModalOpen(true);
  };

  const openRemoveModal = (moduleId: string) => {
    setModalMode("remove");
    setActiveModuleId(moduleId);
    // Retrait par selection: aucune activite cochee au depart.
    setSelectedActivityIds([]);
    setModalOpen(true);
  };

  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId],
    );
  };

  const handleImportModule = async () => {
    if (!activeModuleId || selectedActivityIds.length === 0) {
      return;
    }

    if (isManagedProfile) {
      toast({ title: "Acces refuse", description: "Seul le compte principal peut modifier les modules." });
      return;
    }

    setSavingKey(activeModuleId);
    const snapshot = { ...modulesByActivityId };
    const nextState = { ...modulesByActivityId };
    selectedActivityIds.forEach((activityId) => {
      const current = nextState[activityId] ?? [];
      if (!current.includes(activeModuleId)) {
        nextState[activityId] = [...current, activeModuleId];
      }
    });
    setModulesByActivityId(nextState);

    try {
      await Promise.all(
        selectedActivityIds.map(async (activityId) => {
          const nextModules = nextState[activityId] ?? [];
          await setActivityModules(activityId, nextModules);
          setLinks(activityId, nextModules);
        }),
      );
      await Promise.all(
        selectedActivityIds.map((activityId) =>
          queryClient.invalidateQueries({ queryKey: ["activityModules", activityId] }),
        ),
      );
      toast({ title: "Import effectue", description: "Module assigne aux activites selectionnees." });
      setModalOpen(false);
      setSelectedActivityIds([]);
    } catch (error) {
      console.error("Impossible d'importer le module.", error);
      setModulesByActivityId(snapshot);
      toast({ title: "Erreur", description: "Import impossible pour le moment." });
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemoveModule = async () => {
    if (!activeModuleId || selectedActivityIds.length === 0) {
      return;
    }

    if (isManagedProfile) {
      toast({ title: "Acces refuse", description: "Seul le compte principal peut modifier les modules." });
      return;
    }

    setSavingKey(activeModuleId);
    const snapshot = { ...modulesByActivityId };
    const nextState = { ...modulesByActivityId };

    // Securite: ne retirer que sur les activites liees actuellement.
    const linkedIds = new Set(
      activities
        .filter((activity) => (modulesByActivityId[activity.id] ?? []).includes(activeModuleId))
        .map((activity) => activity.id),
    );
    const toRemoveIds = selectedActivityIds.filter((activityId) => linkedIds.has(activityId));
    if (toRemoveIds.length === 0) {
      setSavingKey(null);
      return;
    }

    toRemoveIds.forEach((activityId) => {
      const current = nextState[activityId] ?? [];
      nextState[activityId] = current.filter((id) => id !== activeModuleId);
    });
    setModulesByActivityId(nextState);

    try {
      await Promise.all(
        toRemoveIds.map(async (activityId) => {
          const nextModules = nextState[activityId] ?? [];
          await setActivityModules(activityId, nextModules);
          setLinks(activityId, nextModules);
        }),
      );
      await Promise.all(
        toRemoveIds.map((activityId) =>
          queryClient.invalidateQueries({ queryKey: ["activityModules", activityId] }),
        ),
      );
      toast({ title: "Suppression effectuee", description: "Liaison module/activite supprimee." });
      setModalOpen(false);
      setSelectedActivityIds([]);
    } catch (error) {
      console.error("Impossible de supprimer la liaison module/activite.", error);
      setModulesByActivityId(snapshot);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Modules" subtitle="Assigner les modules aux activités" />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="stat-card text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Chargement des activités...
          </div>
        ) : activities.length === 0 ? (
          <div className="stat-card text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Aucune activité disponible.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedModules.map((module) => {
              const isSaving = savingKey === module.id;
              const moduleStatus = getModuleStatus(module.id);
              const modulePrice = getModulePrice(module.id);
              const isBlocked = isModuleBlockedByStatus(moduleStatus);
              const statusStyle = getStatusStyles(moduleStatus);
              return (
                <div
                  key={module.id}
                  className="rounded-2xl border p-5 transition-all"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `hsl(var(--${module.color}-dim))`, color: `hsl(var(--${module.color}))` }}
                    >
                      <LayoutGrid size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
                        {module.name}
                      </p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {module.description}
                      </p>
                      <p className="text-[11px] mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {module.menus.map((menu) => menu.label).join(" • ")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {moduleActivityCount[module.id] ?? 0} activite(s) utilisent ce module
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full border font-medium"
                        style={{
                          borderColor: statusStyle.border,
                          color: statusStyle.color,
                          background: statusStyle.bg,
                        }}
                      >
                        {getModuleStatusLabel(moduleStatus, modulePrice)}
                      </span>
                      {(moduleActivityCount[module.id] ?? 0) > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => openRemoveModal(module.id)}
                          disabled={isManagedProfile || isSaving}
                          className="h-9 w-9 p-0 border-border hover:bg-secondary"
                          title="Retirer des activites"
                          aria-label="Retirer des activites"
                        >
                          <Unlink size={14} />
                        </Button>
                      )}
                      <Button
                        onClick={() => openImportModal(module.id)}
                        disabled={isManagedProfile || isSaving}
                        className="h-9 w-9 p-0"
                        title={isBlocked ? "Module indisponible pour le moment (mais assignable aux activites)" : undefined}
                        aria-label="Importer vers des activites"
                        style={{
                          background: isBlocked ? "hsl(var(--secondary))" : `hsl(var(--${module.color}))`,
                          color: isBlocked ? "hsl(var(--muted-foreground))" : "hsl(var(--background))",
                        }}
                      >
                        {isSaving ? <span className="text-[11px]">...</span> : <Download size={14} />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-border max-h-[85vh] overflow-y-auto" style={{ background: "hsl(225, 27%, 10%)" }}>
          <DialogHeader>
            <DialogTitle className="font-display">
              {modalMode === "import" ? "Importer" : "Retirer"} {activeModule?.name ?? "le module"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            {(modalMode === "remove" ? linkedActivitiesForActiveModule : activities).map((activity) => {
              const alreadyAssigned = activeModuleId
                ? (modulesByActivityId[activity.id] ?? []).includes(activeModuleId)
                : false;
              const isDisabledForMode =
                modalMode === "import"
                  ? alreadyAssigned || Boolean(savingKey)
                  : !alreadyAssigned || Boolean(savingKey);
              const checked = selectedActivityIds.includes(activity.id);
              return (
                <label
                  key={activity.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{
                    borderColor: "hsl(var(--border))",
                    background: isDisabledForMode ? "hsl(var(--secondary))" : "transparent",
                    opacity: isDisabledForMode ? 0.55 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={isDisabledForMode}
                      onCheckedChange={() => toggleActivitySelection(activity.id)}
                    />
                    <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                      {activity.name}
                    </span>
                  </div>
                  {modalMode === "import" && alreadyAssigned && (
                    <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                      Deja utilise
                    </span>
                  )}
                </label>
              );
            })}
            {modalMode === "remove" && linkedActivitiesForActiveModule.length === 0 && (
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Aucune activite liee a ce module.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={Boolean(savingKey)}>
              Annuler
            </Button>
            <Button
              onClick={() => void (modalMode === "import" ? handleImportModule() : handleRemoveModule())}
              disabled={
                Boolean(savingKey) ||
                (modalMode === "import"
                  ? selectedActivityIds.length === 0
                  : selectedActivityIds.length === 0)
              }
            >
              {modalMode === "import" ? "Importer" : "Supprimer les liaisons"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

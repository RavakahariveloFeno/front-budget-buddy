import { useEffect, useMemo, useState } from "react";
import { Check, LayoutGrid } from "lucide-react";
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

export default function Modules() {
  const isManagedProfile = Boolean(getCurrentUser()?.profileId);
  const setLinks = useModuleStore((s) => s.setLinks);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modulesByActivityId, setModulesByActivityId] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

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
    PREDEFINED_MODULES.forEach((module) => {
      counts[module.id] = activities.reduce((acc, activity) => {
        const linked = modulesByActivityId[activity.id] ?? [];
        return acc + (linked.includes(module.id) ? 1 : 0);
      }, 0);
    });
    return counts;
  }, [activities, modulesByActivityId]);

  const sortedModules = useMemo(
    () =>
      [...PREDEFINED_MODULES].sort(
        (a, b) => (moduleActivityCount[b.id] ?? 0) - (moduleActivityCount[a.id] ?? 0),
      ),
    [moduleActivityCount],
  );

  const activeModule = useMemo(
    () => PREDEFINED_MODULES.find((module) => module.id === activeModuleId) ?? null,
    [activeModuleId],
  );

  const toggleAssignment = async (activityId: string, moduleId: string) => {
    if (isManagedProfile) {
      toast({ title: "Acces refuse", description: "Seul le compte principal peut modifier les modules." });
      return;
    }
    const key = `${activityId}::${moduleId}`;
    const current = modulesByActivityId[activityId] ?? [];
    const next = current.includes(moduleId)
      ? current.filter((id) => id !== moduleId)
      : [...current, moduleId];

    setSavingKey(key);
    setModulesByActivityId((prev) => ({ ...prev, [activityId]: next }));
    try {
      await setActivityModules(activityId, next);
      setLinks(activityId, next);
    } catch (error) {
      console.error("Impossible de modifier l'association module/activite.", error);
      setModulesByActivityId((prev) => ({ ...prev, [activityId]: current }));
      toast({ title: "Erreur", description: "Modification impossible pour le moment." });
    } finally {
      setSavingKey(null);
    }
  };

  const openImportModal = (moduleId: string) => {
    setActiveModuleId(moduleId);
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
                    <Button
                      onClick={() => openImportModal(module.id)}
                      disabled={isManagedProfile || isSaving}
                      className="h-8"
                    >
                      {isSaving ? "Import..." : "Importer"}
                    </Button>
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
              Importer {activeModule?.name ?? "le module"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            {activities.map((activity) => {
              const alreadyAssigned = activeModuleId
                ? (modulesByActivityId[activity.id] ?? []).includes(activeModuleId)
                : false;
              const checked = selectedActivityIds.includes(activity.id);
              return (
                <label
                  key={activity.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{
                    borderColor: "hsl(var(--border))",
                    background: alreadyAssigned ? "hsl(var(--secondary))" : "transparent",
                    opacity: alreadyAssigned ? 0.55 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={alreadyAssigned || Boolean(savingKey)}
                      onCheckedChange={() => toggleActivitySelection(activity.id)}
                    />
                    <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                      {activity.name}
                    </span>
                  </div>
                  {alreadyAssigned && (
                    <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                      Deja utilise
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={Boolean(savingKey)}>
              Annuler
            </Button>
            <Button onClick={() => void handleImportModule()} disabled={selectedActivityIds.length === 0 || Boolean(savingKey)}>
              Importer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

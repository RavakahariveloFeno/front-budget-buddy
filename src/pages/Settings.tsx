import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { User, Lock, Users, Pencil, Trash2, Plus, Shield, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PREDEFINED_MODULES } from "@/data/staticData";
import type { Activity } from "@/data/staticData";
import { changePassword, clearSessionToken, getCurrentUser, updateCachedCurrentUserProfile } from "@/api/authApi";
import { updateCurrentUserProfile } from "@/api/userApi";
import { useToast } from "@/hooks/use-toast";
import { getActivities } from "@/api/activityApi";
import { getActivityModules } from "@/api/moduleApi";
import {
  createManagedProfile,
  deleteManagedProfile,
  getManagedProfiles,
  updateManagedProfile,
} from "@/api/profileApi";
import type { ManagedProfile, ProfileRole } from "@/api/profileApi";

const ROLE_OPTIONS: { value: ProfileRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "Utilisateur" },
];

const ROLE_COLORS: Record<ProfileRole, string> = {
  admin: "bg-destructive/20 text-destructive border-destructive/30",
  manager: "bg-warning/20 text-warning border-warning/30",
  user: "bg-primary/20 text-primary border-primary/30",
};

type ManagedProfileFormState = Omit<ManagedProfile, "id"> & { password: string };

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [firstName, setFirstName] = useState(currentUser?.firstName || "Admin");
  const [lastName, setLastName] = useState(currentUser?.lastName || "Pilgo");
  const [email] = useState(currentUser?.email || "admin@pilgo.mg");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profiles, setProfiles] = useState<ManagedProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSavingManagedProfile, setIsSavingManagedProfile] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<ManagedProfile | null>(null);
  const [showManagedProfilePassword, setShowManagedProfilePassword] = useState(false);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityModulesById, setActivityModulesById] = useState<Record<string, string[]>>({});
  const [isLoadingModulesById, setIsLoadingModulesById] = useState<Record<string, boolean>>({});
  const [formProfile, setFormProfile] = useState<ManagedProfileFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
    activities: [],
    moduleLinks: [],
  });

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoadingActivities(true);
        const remoteActivities = await getActivities();
        setActivityList(remoteActivities);
      } catch (error) {
        console.error("Impossible de charger les activites depuis l'API.", error);
        setActivityList([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    loadActivities();
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setIsLoadingProfiles(true);
        const remoteProfiles = await getManagedProfiles();
        setProfiles(remoteProfiles);
      } catch (error) {
        console.error("Impossible de charger les profils depuis l'API.", error);
        setProfiles([]);
        toast({
          title: "Erreur",
          description: "Impossible de charger les profils.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    void loadProfiles();
  }, [toast]);

  useEffect(() => {
    if (activityList.length === 0) {
      return;
    }
    const idByName = new Map(activityList.map((act) => [act.name, act.id]));
    setFormProfile((prev) => {
      const normalizedActivities = prev.activities.map((value) => idByName.get(value) ?? value);
      const normalizedLinks = prev.moduleLinks.map((link) => {
        const [activityId, moduleId] = link.split("::");
        if (!moduleId) {
          return link;
        }
        const mappedId = idByName.get(activityId);
        return mappedId ? `${mappedId}::${moduleId}` : link;
      });
      const dedupActivities = Array.from(new Set(normalizedActivities));
      const dedupLinks = Array.from(new Set(normalizedLinks));
      const sameActivities =
        dedupActivities.length === prev.activities.length &&
        dedupActivities.every((value, index) => value === prev.activities[index]);
      const sameLinks =
        dedupLinks.length === prev.moduleLinks.length &&
        dedupLinks.every((value, index) => value === prev.moduleLinks[index]);
      if (sameActivities && sameLinks) {
        return prev;
      }
      return {
        ...prev,
        activities: dedupActivities,
        moduleLinks: dedupLinks,
      };
    });
  }, [activityList]);

  const selectedActivityIds = useMemo(() => {
    if (activityList.length === 0 || formProfile.activities.length === 0) {
      return [];
    }
    const idByName = new Map(activityList.map((act) => [act.name, act.id]));
    const validIds = new Set(activityList.map((act) => act.id));
    const ids = new Set<string>();
    formProfile.activities.forEach((value) => {
      if (validIds.has(value)) {
        ids.add(value);
        return;
      }
      const mapped = idByName.get(value);
      if (mapped) {
        ids.add(mapped);
      }
    });
    return Array.from(ids);
  }, [activityList, formProfile.activities]);

  const activityNameById = useMemo(() => {
    const map = new Map<string, string>();
    activityList.forEach((act) => map.set(act.id, act.name));
    return map;
  }, [activityList]);

  const moduleActivityPairs = useMemo(() => {
    const pairs: Array<{ moduleId: string; activityId: string; activityName: string }> = [];
    for (const activityId of selectedActivityIds) {
      const modules = activityModulesById[activityId];
      if (!modules) {
        continue;
      }
      const activityName = activityNameById.get(activityId) ?? activityId;
      for (const moduleId of modules) {
        pairs.push({ moduleId, activityId, activityName });
      }
    }
    return pairs;
  }, [activityModulesById, activityNameById, selectedActivityIds]);

  const isLoadingModules = selectedActivityIds.some((id) => isLoadingModulesById[id]);

  const fetchActivityModules = useCallback(async (activityId: string) => {
    if (activityModulesById[activityId] || isLoadingModulesById[activityId]) {
      return;
    }
    setIsLoadingModulesById((prev) => ({ ...prev, [activityId]: true }));
    try {
      const ids = await getActivityModules(activityId);
      setActivityModulesById((prev) => ({ ...prev, [activityId]: ids }));
    } catch (error) {
      console.error("Impossible de charger les modules lies a l'activite.", error);
      setActivityModulesById((prev) => ({ ...prev, [activityId]: [] }));
    } finally {
      setIsLoadingModulesById((prev) => ({ ...prev, [activityId]: false }));
    }
  }, [activityModulesById, isLoadingModulesById]);

  useEffect(() => {
    selectedActivityIds.forEach((id) => {
      void fetchActivityModules(id);
    });
  }, [fetchActivityModules, selectedActivityIds]);

  useEffect(() => {
    setFormProfile((prev) => {
      if (selectedActivityIds.length === 0) {
        return prev.moduleLinks.length === 0 ? prev : { ...prev, moduleLinks: [] };
      }
      const allowed = new Set<string>();
      const selectedSet = new Set(selectedActivityIds);
      selectedActivityIds.forEach((activityId) => {
        const modules = activityModulesById[activityId];
        if (!modules) {
          return;
        }
        modules.forEach((moduleId) => allowed.add(`${activityId}::${moduleId}`));
      });
      const filtered = prev.moduleLinks.filter((link) => {
        const [activityId] = link.split("::");
        if (!selectedSet.has(activityId)) {
          return false;
        }
        if (!activityModulesById[activityId]) {
          return true;
        }
        return allowed.has(link);
      });
      if (filtered.length === prev.moduleLinks.length) {
        return prev;
      }
      return { ...prev, moduleLinks: filtered };
    });
  }, [activityModulesById, selectedActivityIds]);

  const handleSaveProfile = async () => {
    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();

    if (!nextFirstName || !nextLastName) {
      toast({ title: "Erreur", description: "Le prenom et le nom sont obligatoires.", variant: "destructive" });
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateCurrentUserProfile({
        firstName: nextFirstName,
        lastName: nextLastName,
      });
      updateCachedCurrentUserProfile({
        firstName: nextFirstName,
        lastName: nextLastName,
      });
      setFirstName(nextFirstName);
      setLastName(nextLastName);
      toast({ title: "Profil mis a jour", description: "Vos informations ont ete enregistrees." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre a jour le profil.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caracteres.", variant: "destructive" });
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      clearSessionToken();
      navigate("/signin", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("401")
          ? "Le mot de passe actuel est incorrect."
          : "Impossible de modifier le mot de passe.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openAddProfile = () => {
    setEditingProfile(null);
    setShowManagedProfilePassword(false);
    setFormProfile({ firstName: "", lastName: "", email: "", password: "", role: "user", activities: [], moduleLinks: [] });
    setDialogOpen(true);
  };

  const openEditProfile = (profile: ManagedProfile) => {
    setEditingProfile(profile);
    setShowManagedProfilePassword(false);
    setFormProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      password: "",
      role: profile.role,
      activities: [...profile.activities],
      moduleLinks: [...profile.moduleLinks],
    });
    setDialogOpen(true);
  };

  const handleSaveManagedProfile = async () => {
    if (!formProfile.firstName || !formProfile.lastName || !formProfile.email) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    if (!formProfile.role) {
      toast({ title: "Erreur", description: "Veuillez selectionner un role.", variant: "destructive" });
      return;
    }
    if (formProfile.activities.length === 0) {
      toast({ title: "Erreur", description: "Veuillez selectionner au moins une activite.", variant: "destructive" });
      return;
    }
    if (formProfile.moduleLinks.length === 0) {
      toast({ title: "Erreur", description: "Veuillez selectionner au moins un module.", variant: "destructive" });
      return;
    }

    const password = formProfile.password.trim();
    if (!editingProfile && !password) {
      toast({ title: "Erreur", description: "Le mot de passe est obligatoire lors de l'ajout.", variant: "destructive" });
      return;
    }
    if (password && password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caracteres.", variant: "destructive" });
      return;
    }

    try {
      setIsSavingManagedProfile(true);
      const basePayload = {
        firstName: formProfile.firstName.trim(),
        lastName: formProfile.lastName.trim(),
        email: formProfile.email.trim(),
        role: formProfile.role,
        activities: formProfile.activities,
        moduleLinks: formProfile.moduleLinks,
      };

      if (editingProfile) {
        const updated = await updateManagedProfile(editingProfile.id, {
          ...basePayload,
          ...(password ? { password } : {}),
        });
        setProfiles((prev) => prev.map((item) => (item.id === editingProfile.id ? updated : item)));
        toast({ title: "Profil modifie", description: `${updated.firstName} ${updated.lastName} a ete mis a jour.` });
      } else {
        const created = await createManagedProfile({ ...basePayload, password });
        setProfiles((prev) => [...prev, created]);
        toast({ title: "Profil ajoute", description: `${created.firstName} ${created.lastName} a ete cree.` });
      }

      setDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error && error.message.includes("409")
        ? "Cet email existe deja."
        : "Impossible d'enregistrer le profil.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSavingManagedProfile(false);
    }
  };

  const openDeleteProfile = (profile: ManagedProfile) => {
    setDeleteTarget(profile);
    setDeleteOpen(true);
  };

  const handleDeleteProfile = async () => {
    if (!deleteTarget) {
      setDeleteOpen(false);
      return;
    }
    try {
      await deleteManagedProfile(deleteTarget.id);
      setProfiles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast({ title: "Profil supprime" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le profil.", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleModule = (activityId: string, moduleId: string) => {
    const linkId = `${activityId}::${moduleId}`;
    setFormProfile((prev) => ({
      ...prev,
      moduleLinks: prev.moduleLinks.includes(linkId)
        ? prev.moduleLinks.filter((id) => id !== linkId)
        : [...prev.moduleLinks, linkId],
    }));
  };

  const toggleActivity = (activity: Activity) => {
    const activityId = activity.id;
    const activityName = activity.name;
    setFormProfile((prev) => ({
      ...prev,
      activities: prev.activities.includes(activityId) || prev.activities.includes(activityName)
        ? prev.activities.filter((a) => a !== activityId && a !== activityName)
        : [...prev.activities, activityId],
    }));
  };

  const getActivityLabel = (value: string) => activityNameById.get(value) ?? value;
  const isActivityChecked = (activity: Activity) =>
    formProfile.activities.includes(activity.id) || formProfile.activities.includes(activity.name);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Parametres</h1>
        <p className="page-subtitle">Gerez votre profil, securite et profiles</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
            <User size={16} /> Profil
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
            <Lock size={16} /> Mot de passe
          </TabsTrigger>
          <TabsTrigger value="profiles" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
            <Users size={16} /> Profiles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border" style={{ background: "hsl(var(--card))" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User size={20} className="text-primary" /> Informations personnelles
              </CardTitle>
              <CardDescription>Modifiez vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-muted-foreground text-sm">Prenom</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-border bg-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-muted-foreground text-sm">Nom</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-border bg-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-muted-foreground text-sm">Email</Label>
                <Input id="email" value={email} disabled className="border-border bg-input opacity-60" />
              </div>
              <Button onClick={handleSaveProfile} className="mt-2" disabled={isSavingProfile}>
                {isSavingProfile ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="border-border" style={{ background: "hsl(var(--card))" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock size={20} className="text-primary" /> Changer le mot de passe
              </CardTitle>
              <CardDescription>Mettez a jour votre mot de passe de connexion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="currentPwd" className="text-muted-foreground text-sm">Mot de passe actuel</Label>
                <Input id="currentPwd" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border-border bg-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPwd" className="text-muted-foreground text-sm">Nouveau mot de passe</Label>
                <Input id="newPwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border-border bg-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPwd" className="text-muted-foreground text-sm">Confirmer le mot de passe</Label>
                <Input id="confirmPwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border-border bg-input" />
              </div>
              <Button onClick={handleChangePassword} className="mt-2" disabled={isChangingPassword}>
                {isChangingPassword ? "Modification..." : "Modifier le mot de passe"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <Card className="border-border" style={{ background: "hsl(var(--card))" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield size={20} className="text-primary" /> Gestion des profiles
                </CardTitle>
                <CardDescription>Ajoutez des profiles et assignez leurs roles, activities et modules</CardDescription>
              </div>
              <Button onClick={openAddProfile} size="sm" className="gap-1.5">
                <Plus size={16} /> Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Nom</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-muted-foreground">Activities</TableHead>
                      <TableHead className="text-muted-foreground">Modules</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingProfiles ? (
                      <TableRow className="border-border">
                        <TableCell className="text-muted-foreground" colSpan={6}>Chargement des profils...</TableCell>
                      </TableRow>
                    ) : profiles.length === 0 ? (
                      <TableRow className="border-border">
                        <TableCell className="text-muted-foreground" colSpan={6}>Aucun profil disponible.</TableCell>
                      </TableRow>
                    ) : profiles.map((profile) => (
                      <TableRow key={profile.id} className="border-border">
                        <TableCell className="font-medium">{profile.firstName} {profile.lastName}</TableCell>
                        <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_COLORS[profile.role]}>
                            {ROLE_OPTIONS.find((r) => r.value === profile.role)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {profile.activities.map((activity) => (
                              <Badge key={activity} variant="outline" className="text-xs bg-secondary/50 text-foreground border-border">
                                {getActivityLabel(activity)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {profile.moduleLinks.map((link) => {
                              const [activityIdRaw, moduleIdRaw] = link.split("::");
                              const activityId = moduleIdRaw ? activityIdRaw : "";
                              const moduleId = moduleIdRaw ?? activityIdRaw;
                              const mod = PREDEFINED_MODULES.find((m) => m.id === moduleId);
                              if (!mod) {
                                return null;
                              }
                              const label = activityId ? `${mod.name} · ${getActivityLabel(activityId)}` : mod.name;
                              return (
                                <Badge key={link} variant="outline" className="text-xs bg-secondary/50 text-foreground border-border">
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditProfile(profile)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Pencil size={15} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteProfile(profile)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDeleteProfile}
        title="Supprimer ce profil ?"
        description={deleteTarget
          ? `Supprimer le profil de \"${deleteTarget.firstName} ${deleteTarget.lastName}\" ? Cette action est irréversible.`
          : "Cette action est irréversible."}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border max-h-[85vh] overflow-y-auto" style={{ background: "hsl(225, 27%, 10%)" }}>
          <DialogHeader>
            <DialogTitle className="font-display">{editingProfile ? "Modifier le profil" : "Ajouter un profil"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm">Prenom</Label>
                <Input value={formProfile.firstName} onChange={(e) => setFormProfile((p) => ({ ...p, firstName: e.target.value }))} className="border-border bg-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm">Nom</Label>
                <Input value={formProfile.lastName} onChange={(e) => setFormProfile((p) => ({ ...p, lastName: e.target.value }))} className="border-border bg-input" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-sm">Email</Label>
              <Input type="email" value={formProfile.email} onChange={(e) => setFormProfile((p) => ({ ...p, email: e.target.value }))} className="border-border bg-input" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-muted-foreground text-sm">Mot de passe</Label>
                {editingProfile ? (
                  <span className="text-xs text-muted-foreground">Optionnel</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Obligatoire</span>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showManagedProfilePassword ? "text" : "password"}
                  value={formProfile.password}
                  onChange={(e) => setFormProfile((p) => ({ ...p, password: e.target.value }))}
                  placeholder={editingProfile ? "Laisser vide pour ne pas modifier" : "Minimum 6 caracteres"}
                  className="border-border bg-input pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowManagedProfilePassword((prev) => !prev)}
                  aria-label={showManagedProfilePassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showManagedProfilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {editingProfile
                  ? "Laissez vide pour conserver le mot de passe actuel."
                  : "Choisissez un mot de passe pour ce profil (minimum 6 caracteres)."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-sm">Role</Label>
              <Select value={formProfile.role} onValueChange={(value) => setFormProfile((p) => ({ ...p, role: value as ProfileRole }))}>
                <SelectTrigger className="border-border bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "hsl(225, 27%, 12%)", borderColor: "hsl(var(--border))" }}>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Activities</Label>
              <div className="space-y-2 rounded-lg border border-border p-3" style={{ background: "hsl(var(--input))" }}>
                {activityList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isLoadingActivities ? "Chargement des activites..." : "Aucune activite disponible."}
                  </p>
                ) : (
                  activityList.map((activity) => (
                    <label key={activity.id} className="flex items-center gap-3 cursor-pointer py-1">
                      <Checkbox
                        checked={isActivityChecked(activity)}
                        onCheckedChange={() => toggleActivity(activity)}
                      />
                      <span className="text-sm">{activity.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Modules assignes</Label>
              <div className="space-y-2 rounded-lg border border-border p-3" style={{ background: "hsl(var(--input))" }}>
                {selectedActivityIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Selectionnez une activite pour afficher ses modules.</p>
                ) : moduleActivityPairs.length === 0 && isLoadingModules ? (
                  <p className="text-sm text-muted-foreground">Chargement des modules...</p>
                ) : moduleActivityPairs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun module lie aux activites selectionnees.</p>
                ) : (
                  moduleActivityPairs.map(({ moduleId, activityId, activityName }) => {
                    const mod = PREDEFINED_MODULES.find((m) => m.id === moduleId);
                    if (!mod) {
                      return null;
                    }
                    const linkId = `${activityId}::${moduleId}`;
                    return (
                      <label
                        key={linkId}
                        className="flex items-center justify-between gap-3 cursor-pointer py-1"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={formProfile.moduleLinks.includes(linkId)}
                            onCheckedChange={() => toggleModule(activityId, mod.id)}
                          />
                          <span className="text-sm">{mod.name}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium tracking-tight bg-primary/10 text-primary border-primary/20 shadow-sm"
                        >
                          {activityName}
                        </Badge>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSavingManagedProfile}>Annuler</Button>
              <Button onClick={() => void handleSaveManagedProfile()} disabled={isSavingManagedProfile}>
                {isSavingManagedProfile ? "Enregistrement..." : editingProfile ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

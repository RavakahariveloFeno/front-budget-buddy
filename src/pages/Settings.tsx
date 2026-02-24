import { useState } from "react";
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
import { User, Lock, Users, Pencil, Trash2, Plus, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PREDEFINED_MODULES } from "@/data/staticData";
import { changePassword, clearSessionToken, getCurrentUser, updateCachedCurrentUserProfile } from "@/api/authApi";
import { updateCurrentUserProfile } from "@/api/userApi";
import { useToast } from "@/hooks/use-toast";

type AppRole = "admin" | "manager" | "user";

interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AppRole;
  moduleIds: string[];
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "Utilisateur" },
];

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-destructive/20 text-destructive border-destructive/30",
  manager: "bg-warning/20 text-warning border-warning/30",
  user: "bg-primary/20 text-primary border-primary/30",
};

// Static data
const initialUsers: ManagedUser[] = [
  { id: "u1", firstName: "Jean", lastName: "Dupont", email: "jean@pilgo.mg", role: "admin", moduleIds: ["mod-vente", "mod-comptabilite", "mod-paie", "mod-tresorerie", "mod-achat-revente"] },
  { id: "u2", firstName: "Marie", lastName: "Rakoto", email: "marie@pilgo.mg", role: "manager", moduleIds: ["mod-vente", "mod-comptabilite"] },
  { id: "u3", firstName: "Hery", lastName: "Andria", email: "hery@pilgo.mg", role: "user", moduleIds: ["mod-vente"] },
];

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Profile state
  const [firstName, setFirstName] = useState(currentUser?.firstName || "Admin");
  const [lastName, setLastName] = useState(currentUser?.lastName || "Pilgo");
  const [email] = useState(currentUser?.email || "admin@pilgo.mg");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User management state
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formUser, setFormUser] = useState<Omit<ManagedUser, "id">>({ firstName: "", lastName: "", email: "", role: "user", moduleIds: [] });

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
      const message = error instanceof Error && error.message.includes("401")
        ? "Le mot de passe actuel est incorrect."
        : "Impossible de modifier le mot de passe.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setFormUser({ firstName: "", lastName: "", email: "", role: "user", moduleIds: [] });
    setDialogOpen(true);
  };

  const openEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setFormUser({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, moduleIds: [...user.moduleIds] });
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!formUser.firstName || !formUser.lastName || !formUser.email) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    if (editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...formUser } : u)));
      toast({ title: "Utilisateur modifié", description: `${formUser.firstName} ${formUser.lastName} a été mis à jour.` });
    } else {
      const newUser: ManagedUser = { id: `u${Date.now()}`, ...formUser };
      setUsers((prev) => [...prev, newUser]);
      toast({ title: "Utilisateur ajouté", description: `${formUser.firstName} ${formUser.lastName} a été créé.` });
    }
    setDialogOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast({ title: "Utilisateur supprimé" });
  };

  const toggleModule = (moduleId: string) => {
    setFormUser((prev) => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter((m) => m !== moduleId)
        : [...prev.moduleIds, moduleId],
    }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Gérez votre profil, sécurité et utilisateurs</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
            <User size={16} /> Profil
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
            <Lock size={16} /> Mot de passe
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2">
            <Users size={16} /> Utilisateurs
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
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
                  <Label htmlFor="firstName" className="text-muted-foreground text-sm">Prénom</Label>
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

        {/* Password Tab */}
        <TabsContent value="password">
          <Card className="border-border" style={{ background: "hsl(var(--card))" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock size={20} className="text-primary" /> Changer le mot de passe
              </CardTitle>
              <CardDescription>Mettez à jour votre mot de passe de connexion</CardDescription>
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

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-border" style={{ background: "hsl(var(--card))" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield size={20} className="text-primary" /> Gestion des utilisateurs
                </CardTitle>
                <CardDescription>Ajoutez des utilisateurs et assignez leurs rôles et modules</CardDescription>
              </div>
              <Button onClick={openAddUser} size="sm" className="gap-1.5">
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
                      <TableHead className="text-muted-foreground">Rôle</TableHead>
                      <TableHead className="text-muted-foreground">Modules</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-border">
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                            {ROLE_OPTIONS.find((r) => r.value === user.role)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.moduleIds.map((mId) => {
                              const mod = PREDEFINED_MODULES.find((m) => m.id === mId);
                              return mod ? (
                                <Badge key={mId} variant="outline" className="text-xs bg-secondary/50 text-foreground border-border">
                                  {mod.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditUser(user)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Pencil size={15} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
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

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border max-h-[85vh] overflow-y-auto" style={{ background: "hsl(225, 27%, 10%)" }}>
          <DialogHeader>
            <DialogTitle className="font-display">{editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm">Prénom</Label>
                <Input value={formUser.firstName} onChange={(e) => setFormUser((p) => ({ ...p, firstName: e.target.value }))} className="border-border bg-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm">Nom</Label>
                <Input value={formUser.lastName} onChange={(e) => setFormUser((p) => ({ ...p, lastName: e.target.value }))} className="border-border bg-input" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-sm">Email</Label>
              <Input type="email" value={formUser.email} onChange={(e) => setFormUser((p) => ({ ...p, email: e.target.value }))} className="border-border bg-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-sm">Rôle</Label>
              <Select value={formUser.role} onValueChange={(v) => setFormUser((p) => ({ ...p, role: v as AppRole }))}>
                <SelectTrigger className="border-border bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "hsl(225, 27%, 12%)", borderColor: "hsl(var(--border))" }}>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Modules assignés</Label>
              <div className="space-y-2 rounded-lg border border-border p-3" style={{ background: "hsl(var(--input))" }}>
                {PREDEFINED_MODULES.map((mod) => (
                  <label key={mod.id} className="flex items-center gap-3 cursor-pointer py-1">
                    <Checkbox
                      checked={formUser.moduleIds.includes(mod.id)}
                      onCheckedChange={() => toggleModule(mod.id)}
                    />
                    <span className="text-sm">{mod.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveUser}>{editingUser ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



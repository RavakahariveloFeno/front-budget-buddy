import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { deleteSuperAdminUser, getSuperAdminUsers, setSuperAdminUserDisabled } from "@/api/superAdminApi";
import { isSuperAdmin, setSuperAdminActingUserId } from "@/api/authApi";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["superadminUsers"],
    queryFn: getSuperAdminUsers,
  });

  const disableMutation = useMutation({
    mutationFn: ({ userId, isDisabled }: { userId: string; isDisabled: boolean }) =>
      setSuperAdminUserDisabled(userId, isDisabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["superadminUsers"] });
      toast({ title: "Succès", description: "Utilisateur mis à jour." });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Action impossible.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteSuperAdminUser(userId),
    onSuccess: async () => {
      setDeleteTargetId(null);
      await queryClient.invalidateQueries({ queryKey: ["superadminUsers"] });
      toast({ title: "Supprimé", description: "Utilisateur supprimé." });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : "Suppression impossible.", variant: "destructive" });
    },
  });

  const deleteTarget = deleteTargetId ? users.find((u) => u.id === deleteTargetId) : null;

  return (
    <div>
      <Header title="Superadmin" subtitle="Gestion des utilisateurs" />
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg border text-sm" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--secondary))" }}>
            {error instanceof Error ? error.message : "Impossible de charger les utilisateurs."}
          </div>
        )}

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Accès</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Chargement...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Aucun utilisateur.
                  </TableCell>
                </TableRow>
              )}

              {users.map((user) => {
                const locked = user.isSuperAdmin;
                return (
                  <TableRow key={user.id} className={user.isDisabled ? "opacity-70" : undefined}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                      {user.isSuperAdmin && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: "hsl(var(--border))" }}>
                          SUPERADMIN
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {user.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={!user.isDisabled}
                          disabled={locked || disableMutation.isPending}
                          onCheckedChange={(checked) => disableMutation.mutate({ userId: user.id, isDisabled: !checked })}
                        />
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {user.isDisabled ? "Désactivé" : "Actif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={disableMutation.isPending || deleteMutation.isPending}
                          onClick={() => {
                            setSuperAdminActingUserId(user.id);
                            navigate("/");
                            window.location.reload();
                          }}
                        >
                          Voir
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={locked || deleteMutation.isPending}
                          onClick={() => setDeleteTargetId(user.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => setDeleteTargetId(open ? deleteTargetId : null)}
        title="Supprimer l'utilisateur ?"
        description={deleteTarget ? `Supprimer définitivement ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.email}) ?` : "Confirmer la suppression."}
        onConfirm={() => {
          if (!deleteTargetId) return;
          deleteMutation.mutate(deleteTargetId);
        }}
      />
    </div>
  );
}

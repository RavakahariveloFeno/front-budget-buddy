import { useEffect, useMemo, useState } from "react";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { formatCurrency } from "@/data/staticData";
import type { Category } from "@/data/staticData";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryStatistics,
  updateCategory,
} from "@/api/categoryApi";
import type { CategoryPayload, CategoryStatistics } from "@/api/categoryApi";
import CategoryForm from "@/components/forms/CategoryForm";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { useActivityFilterStore } from "@/stores/activityFilterStore";

const EMPTY_CATEGORY_STATS: CategoryStatistics = {
  totalCategories: 0,
  totalExpenses: 0,
  totalTransactions: 0,
  maxCategoryTotal: 0,
  items: [],
};

export default function Categories() {
  const selectedActivityId = useActivityFilterStore((state) => state.selectedActivityId);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStatistics>(EMPTY_CATEGORY_STATS);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const statsByCategoryId = useMemo(() => {
    return new Map(categoryStats.items.map((item) => [item.categoryId, item]));
  }, [categoryStats.items]);

  const refreshCategoryStats = async () => {
    try {
      const stats = await getCategoryStatistics({ activityId: selectedActivityId ?? undefined });
      setCategoryStats(stats);
    } catch (error) {
      console.error("Impossible de charger les statistiques categories depuis l'API.", error);
      setCategoryStats(EMPTY_CATEGORY_STATS);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const remoteCategories = await getCategories();
        setCategoryList(remoteCategories);
      } catch (error) {
        console.error("Impossible de charger les categories depuis l'API.", error);
        setCategoryList([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    refreshCategoryStats();
  }, [selectedActivityId]);

  const handleEdit = (category: Category) => {
    setEditItem(category);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
    setDeleteOpen(true);
  };

  const handleCreate = async (payload: CategoryPayload) => {
    const created = await createCategory(payload);
    setCategoryList((prev) => [created, ...prev]);
    await refreshCategoryStats();
    toast({ title: "Categorie ajoutee", description: created.name });
  };

  const handleUpdate = async (id: string, payload: CategoryPayload) => {
    const updated = await updateCategory(id, payload);
    setCategoryList((prev) => prev.map((category) => (category.id === id ? updated : category)));
    toast({ title: "Categorie modifiee", description: updated.name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteCategory(deleteTarget.id);
      setCategoryList((prev) => prev.filter((category) => category.id !== deleteTarget.id));
      await refreshCategoryStats();
      toast({ title: "Categorie supprimee", description: deleteTarget.name });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Impossible de supprimer la categorie.", error);
      toast({ title: "Erreur", description: "Suppression impossible pour le moment." });
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Categories" subtitle="Gerez vos categories de depenses" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
          >
            <Plus size={16} /> Nouvelle categorie
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryList.map((category) => {
            const categoryStat = statsByCategoryId.get(category.id);
            const total = categoryStat?.total ?? 0;
            const count = categoryStat?.count ?? 0;
            const widthPercent = categoryStats.maxCategoryTotal > 0 ? Math.min(100, (total / categoryStats.maxCategoryTotal) * 100) : 0;

            return (
              <div key={category.id} className="stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: (category.color || "#8b5cf6") + "25" }}>
                    {category.icon}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(category)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                      <Pencil size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>
                    <button onClick={() => handleDelete(category)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <Trash2 size={13} style={{ color: "hsl(var(--destructive))" }} />
                    </button>
                  </div>
                </div>
                <p className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  {category.name}
                </p>
                <p className="text-xl font-bold mt-1" style={{ color: category.color || "hsl(var(--primary))" }}>
                  {formatCurrency(total)}
                </p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {count} transaction{count > 1 ? "s" : ""}
                </p>
                <div className="mt-3 h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
                  <div className="h-full rounded-full" style={{ background: category.color || "hsl(var(--primary))", width: `${widthPercent}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="stat-card">
          <p className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            Vue d'ensemble
          </p>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Categorie</th>
                  <th className="text-left">Icone</th>
                  <th className="text-left">Couleur</th>
                  <th className="text-right">Nb depenses</th>
                  <th className="text-right">Total depense</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryList.map((category) => {
                  const categoryStat = statsByCategoryId.get(category.id);
                  const categoryTotal = categoryStat?.total ?? 0;
                  const count = categoryStat?.count ?? 0;
                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Tag size={14} style={{ color: category.color || "hsl(var(--primary))" }} />
                          <span style={{ color: "hsl(var(--foreground))" }}>{category.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{category.icon || "-"}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ background: category.color || "#ccc" }} />
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {category.color || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {count}
                      </td>
                      <td className="text-right font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                        {formatCurrency(categoryTotal)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(category)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary transition-colors">
                            <Pencil size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                          <button onClick={() => handleDelete(category)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
                            <Trash2 size={12} style={{ color: "hsl(var(--destructive))" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editItem} onCreate={handleCreate} onUpdate={handleUpdate} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer la categorie"
        description={`Supprimer la categorie "${deleteTarget?.name}" ? Les depenses associees ne seront pas supprimees.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

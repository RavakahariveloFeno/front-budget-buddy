import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Columns3, Palette, Plus, Settings2, Trash2 } from 'lucide-react';

import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getActivities } from '@/api/activityApi';
import { getActivityModules } from '@/api/moduleApi';
import {
  createKanbanCard,
  defaultKanbanColumns,
  deleteKanbanCard,
  getKanbanBoard,
  getKanbanCards,
  saveKanbanBoard,
  updateKanbanCard,
  type GanttKanbanBoard,
  type GanttKanbanCard,
  type GanttKanbanColumn,
} from '@/api/ganttApi';
import { useActivityFilterStore } from '@/stores/activityFilterStore';
import type { Activity } from '@/data/staticData';

const GANTT_MODULE_ID = 'mod-gantt';

const makeColumnId = (value: string, existing: string[] = []) => {
  const base = value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'nouvelle-colonne';

  if (!existing.includes(base)) return base;
  let i = 2;
  let candidate = `${base}-${i}`;
  while (existing.includes(candidate)) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
};

export default function KanbanPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const selectedActivityId = useActivityFilterStore((s) => s.selectedActivityId);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cards, setCards] = useState<GanttKanbanCard[]>([]);
  const [board, setBoard] = useState<GanttKanbanBoard>({
    columns: defaultKanbanColumns(),
    enabledColumnIds: defaultKanbanColumns().map((column) => column.id),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGanttEnabled, setIsGanttEnabled] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [draftColumns, setDraftColumns] = useState<GanttKanbanColumn[]>([]);
  const [draftEnabledColumnIds, setDraftEnabledColumnIds] = useState<string[]>([]);
  const [cardId, setCardId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('todo');
  const [color, setColor] = useState('#8b5cf6');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);

  const showAllActivities = selectedActivityId === null;
  const effectiveActivityId = selectedActivityId ?? activityId;

  const activeColumns = useMemo(
    () =>
      [...board.columns]
        .filter((column) => board.enabledColumnIds.includes(column.id))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [board.columns, board.enabledColumnIds],
  );

  const visibleCards = useMemo(() => {
    const source = showAllActivities ? cards : cards.filter((card) => card.activityId === effectiveActivityId);
    return [...source].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [cards, effectiveActivityId, showAllActivities]);

  const loadData = async () => {
    const allActivities = await getActivities();
    setActivities(allActivities);

    const entries = await Promise.all(
      allActivities.map(async (act) => {
        try {
          const mods = await getActivityModules(act.id);
          return [act.id, mods.includes(GANTT_MODULE_ID)] as const;
        } catch {
          return [act.id, false] as const;
        }
      }),
    );
    const enableMap = Object.fromEntries(entries) as Record<string, boolean>;
    const isEnabled = showAllActivities ? true : Boolean(effectiveActivityId && enableMap[effectiveActivityId] !== false);
    setIsGanttEnabled(isEnabled);

    const targetActivity = showAllActivities ? undefined : effectiveActivityId;
    const remoteCards = await getKanbanCards(targetActivity);
    setCards(remoteCards);

    if (targetActivity) {
      const remoteBoard = await getKanbanBoard(targetActivity);
      setBoard(remoteBoard);
    } else {
      setBoard({ columns: defaultKanbanColumns(), enabledColumnIds: defaultKanbanColumns().map((column) => column.id) });
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadData()
      .catch((error) => {
        console.error('Failed to load kanban data', error);
        setActivities([]);
        setCards([]);
        setBoard({ columns: defaultKanbanColumns(), enabledColumnIds: defaultKanbanColumns().map((column) => column.id) });
        setIsGanttEnabled(false);
      })
      .finally(() => setLoading(false));
  }, [effectiveActivityId, showAllActivities]);

  const resetForm = () => {
    setCardId(null);
    setTitle('');
    setDescription('');
    setStatus(activeColumns[0]?.id ?? 'todo');
    setColor('#8b5cf6');
  };

  const openBoardSettings = () => {
    setDraftColumns(board.columns.map((column) => ({ ...column, order: column.order ?? 0 })));
    setDraftEnabledColumnIds(board.enabledColumnIds.length > 0 ? [...board.enabledColumnIds] : board.columns.map((column) => column.id));
    setOpenConfigDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const openEditDialog = (card: GanttKanbanCard) => {
    setCardId(card.id);
    setTitle(card.title);
    setDescription(card.description ?? '');
    setStatus(card.status);
    setColor(card.color ?? '#8b5cf6');
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!effectiveActivityId || !title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status: activeColumns.some((column) => column.id === status) ? status : activeColumns[0]?.id ?? 'todo',
        color,
        position: 0,
        activityId: effectiveActivityId,
      };

      if (cardId) {
        await updateKanbanCard(cardId, { ...payload, userId: '' } as any);
      } else {
        await createKanbanCard({ ...payload, userId: '' } as any);
      }

      setOpenDialog(false);
      resetForm();
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cardIdToDelete: string) => {
    setSaving(true);
    try {
      await deleteKanbanCard(cardIdToDelete);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const moveCardToColumn = async (cardIdToMove: string, targetStatus: string, targetIndex?: number) => {
    if (!cardIdToMove) return;

    const cardToMove = cards.find((card) => card.id === cardIdToMove);
    if (!cardToMove) return;

    const relevantCards = cards
      .filter((card) => card.id !== cardIdToMove && card.status === targetStatus)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const insertionIndex = typeof targetIndex === 'number' ? Math.min(Math.max(targetIndex, 0), relevantCards.length) : relevantCards.length;
    const reorderedCards = [...relevantCards];
    reorderedCards.splice(insertionIndex, 0, { ...cardToMove, status: targetStatus, position: insertionIndex });

    const updatedCards = reorderedCards.map((card, index) => ({
      ...card,
      position: index,
    }));

    await Promise.all(
      updatedCards.map((card) =>
        updateKanbanCard(card.id, {
          status: card.status,
          position: card.position,
        }),
      ),
    );

    setDraggedCardId(null);
    await loadData();
  };

  const handleSaveBoardConfig = async () => {
    if (!effectiveActivityId) return;
    const sanitizedColumns = draftColumns
      .filter((column) => column.name.trim())
      .map((column, index) => ({
        ...column,
        id: column.id || makeColumnId(column.name, draftColumns.map((item) => item.id)),
        name: column.name.trim(),
        color: column.color || '#94a3b8',
        order: index,
      }));

    const finalEnabled = draftEnabledColumnIds.filter((id) => sanitizedColumns.some((column) => column.id === id));
    const nextBoard = {
      id: board.id ?? undefined,
      columns: sanitizedColumns.length > 0 ? sanitizedColumns : defaultKanbanColumns(),
      enabledColumnIds: finalEnabled.length > 0 ? finalEnabled : sanitizedColumns.map((column) => column.id),
    };

    try {
      setSaving(true);
      const savedBoard = await saveKanbanBoard(effectiveActivityId, nextBoard);
      setBoard(savedBoard);
      setOpenConfigDialog(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  if (!isGanttEnabled) {
    return (
      <div className="animate-fade-in">
        <Header title="Kanban Gantt" subtitle="Tableau de suivi par statut" />
        <div className="p-6">
          <div className="rounded-xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Cette activité n'utilise pas le module Gantt.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="Kanban Gantt" subtitle="Suivi indépendant du planning Gantt" />
      <div className="p-6 space-y-6">
        <div className="rounded-2xl border bg-card p-5 shadow-sm" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              <Columns3 size={16} />
              {visibleCards.length} carte(s)
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openBoardSettings} disabled={!effectiveActivityId}>
                <Settings2 size={14} className="mr-1" />Colonnes
              </Button>
              <Button onClick={openCreateDialog} size="sm"><Plus size={14} className="mr-1" />Ajouter</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            Chargement du kanban...
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {activeColumns.map((column) => {
              const columnCards = visibleCards.filter((card) => card.status === column.id);

              return (
                <div
                  key={column.id}
                  className="rounded-2xl border bg-card p-3 shadow-sm"
                  style={{ borderColor: 'hsl(var(--border))' }}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={async (event) => {
                    event.preventDefault();
                    if (!draggedCardId) return;
                    await moveCardToColumn(draggedCardId, column.id, columnCards.length);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: column.color || '#94a3b8' }} />
                      {column.name}
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      {columnCards.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[220px]">
                    {columnCards.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                        Aucune carte.
                      </div>
                    ) : (
                      columnCards.map((card, index) => (
                        <div
                          key={card.id}
                          className="rounded-xl border p-3 cursor-grab active:cursor-grabbing"
                          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}
                          draggable
                          onDragStart={(event) => {
                            setDraggedCardId(card.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', card.id);
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                          }}
                          onDrop={async (event) => {
                            event.preventDefault();
                            if (!draggedCardId) return;
                            await moveCardToColumn(draggedCardId, column.id, index);
                          }}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: card.color ?? '#8b5cf6' }} />
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(card)} aria-label="Modifier la carte">
                                <Palette size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void handleDelete(card.id)} aria-label="Supprimer la carte">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          <div className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{card.title}</div>
                          {card.description && <p className="mt-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.description}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={(open) => { setOpenDialog(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cardId ? 'Modifier la carte' : 'Nouvelle carte Kanban'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeColumns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>{column.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-3">
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
                <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-secondary/60">
                  <Palette size={16} />
                  <input type="color" className="sr-only" value={color.startsWith('#') ? color : '#8b5cf6'} onChange={(e) => setColor(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button onClick={() => void handleSubmit()} disabled={saving || !title.trim()}>{cardId ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openConfigDialog} onOpenChange={setOpenConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Colonnes du tableau Kanban</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {draftColumns.map((column, index) => (
              <div
                key={column.id || `${column.name}-${index}`}
                className="flex items-center gap-2 rounded-xl border p-2 cursor-grab active:cursor-grabbing"
                style={{ borderColor: 'hsl(var(--border))' }}
                draggable
                onDragStart={() => setDraggedColumnIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedColumnIndex === null || draggedColumnIndex === index) return;
                  const next = [...draftColumns];
                  const [moved] = next.splice(draggedColumnIndex, 1);
                  next.splice(index, 0, moved);
                  setDraftColumns(next);
                  setDraggedColumnIndex(null);
                }}
              >
                <input
                  type="color"
                  value={column.color || '#94a3b8'}
                  onChange={(event) => {
                    const next = [...draftColumns];
                    next[index] = { ...next[index], color: event.target.value };
                    setDraftColumns(next);
                  }}
                  className="h-10 w-12 rounded-md border-0 bg-transparent p-0"
                />
                <Input
                  value={column.name}
                  onChange={(event) => {
                    const next = [...draftColumns];
                    next[index] = { ...next[index], name: event.target.value };
                    setDraftColumns(next);
                  }}
                />
                <Button
                  variant={draftEnabledColumnIds.includes(column.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDraftEnabledColumnIds((prev) =>
                      prev.includes(column.id)
                        ? prev.filter((id) => id !== column.id)
                        : [...prev, column.id],
                    );
                  }}
                >
                  {draftEnabledColumnIds.includes(column.id) ? 'Visible' : 'Masquée'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    const nextColumns = draftColumns.filter((item) => item.id !== column.id);
                    setDraftColumns(nextColumns);
                    setDraftEnabledColumnIds((prev) => prev.filter((id) => id !== column.id));
                  }}
                >
                  Supprimer
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextColumn: GanttKanbanColumn = {
                  id: makeColumnId(`Nouvelle colonne`, draftColumns.map((column) => column.id)),
                  name: 'Nouvelle colonne',
                  color: '#60a5fa',
                  order: draftColumns.length,
                };
                setDraftColumns((prev) => [...prev, nextColumn]);
                setDraftEnabledColumnIds((prev) => [...prev, nextColumn.id]);
              }}
            >
              + Ajouter une colonne
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpenConfigDialog(false)}>Annuler</Button>
              <Button onClick={() => void handleSaveBoardConfig()} disabled={saving}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

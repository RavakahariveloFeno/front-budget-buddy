import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronRight, FolderKanban, Palette, Plus, Trash2 } from 'lucide-react';

import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivityFilterStore } from '@/stores/activityFilterStore';
import { getActivities } from '@/api/activityApi';
import { getActivityModules } from '@/api/moduleApi';
import {
  createGanttProject,
  createGanttTask,
  deleteGanttProject,
  deleteGanttTask,
  getGanttProjects,
  getGanttTasks,
  updateGanttProject,
  updateGanttTask,
  type GanttProject,
  type GanttTask,
} from '@/api/ganttApi';
import type { Activity } from '@/data/staticData';

const GANTT_MODULE_ID = 'mod-gantt';
const LEFT_COLUMN_WIDTH = 320;
const PROJECT_ROW_HEIGHT = 54;
const TASK_ROW_HEIGHT = 46;
const DAY_MS = 24 * 60 * 60 * 1000;

type TimelineMode = 'day' | 'week' | 'month';

type TimelineCell = {
  start: Date;
  end: Date;
  label: string;
  sublabel?: string;
};

type FlatRow =
  | { kind: 'project'; project: GanttProject; level: 0 }
  | { kind: 'task'; task: GanttTask; project: GanttProject | null; level: 1 };

type EditTarget =
  | { kind: 'project'; item: GanttProject }
  | { kind: 'task'; item: GanttTask };

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const d = stripTime(date);
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfRange(mode: TimelineMode, minDate: Date) {
  if (mode === 'day') return stripTime(minDate);
  if (mode === 'week') return startOfWeek(minDate);
  return startOfMonth(minDate);
}

function endOfRange(mode: TimelineMode, maxDate: Date) {
  const local = stripTime(maxDate);
  if (mode === 'day') return addDays(local, 1);
  if (mode === 'week') return addDays(startOfWeek(local), 7);
  return new Date(local.getFullYear(), local.getMonth() + 1, 1);
}

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function barRange(start: Date, end: Date) {
  const rangeStart = stripTime(start);
  const rangeEnd = addDays(stripTime(end), 1);
  if (rangeEnd <= rangeStart) return { start: rangeStart, end: addDays(rangeStart, 1) };
  return { start: rangeStart, end: rangeEnd };
}

function getIsoWeek(date: Date) {
  const d = stripTime(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / DAY_MS - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function buildTimelineCells(mode: TimelineMode, rangeStart: Date, rangeEnd: Date): TimelineCell[] {
  const cells: TimelineCell[] = [];
  let cursor = new Date(rangeStart);

  while (cursor < rangeEnd) {
    if (mode === 'day') {
      const next = addDays(cursor, 1);
      cells.push({
        start: new Date(cursor),
        end: next,
        label: cursor.getDate().toString(),
        sublabel: cursor.toLocaleDateString('fr-FR', { month: 'short' }),
      });
      cursor = next;
      continue;
    }

    if (mode === 'week') {
      const next = addDays(cursor, 7);
      cells.push({
        start: new Date(cursor),
        end: next,
        label: `S${String(getIsoWeek(cursor)).padStart(2, '0')}`,
        sublabel: cursor.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      });
      cursor = next;
      continue;
    }

    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    cells.push({
      start: new Date(cursor),
      end: next,
      label: cursor.toLocaleDateString('fr-FR', { month: 'short' }),
      sublabel: cursor.getFullYear().toString(),
    });
    cursor = next;
  }

  return cells;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toPercentLeft(start: Date, rangeStart: Date, rangeEnd: Date) {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  return total <= 0 ? 0 : ((start.getTime() - rangeStart.getTime()) / total) * 100;
}

function toPercentWidth(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  if (total <= 0) return 0;
  const clippedStart = Math.max(start.getTime(), rangeStart.getTime());
  const clippedEnd = Math.min(end.getTime(), rangeEnd.getTime());
  if (clippedEnd <= clippedStart) return 0;
  return ((clippedEnd - clippedStart) / total) * 100;
}

function parseColor(value?: string | null) {
  return value?.trim() || 'hsl(var(--primary))';
}

function barVisual(type: GanttTask['type'], color: string) {
  if (type === 'project') {
    return {
      background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.08))`,
      height: 18,
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 10px 18px rgba(0,0,0,0.20)',
    } as const;
  }

  if (type === 'milestone') {
    return {
      background: color,
      width: 18,
      height: 18,
      borderRadius: 6,
      transform: 'translateY(-50%) rotate(45deg)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 10px 18px rgba(0,0,0,0.20)',
    } as const;
  }

  return {
    background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.12))`,
    height: 14,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 18px rgba(0,0,0,0.18)',
  } as const;
}

export default function GanttPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const selectedActivityId = useActivityFilterStore((s) => s.selectedActivityId);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ganttEnabledByActivityId, setGanttEnabledByActivityId] = useState<Record<string, boolean>>({});
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [mode, setMode] = useState<TimelineMode>('month');
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Record<string, boolean>>({});
  const [openProject, setOpenProject] = useState(false);
  const [openTask, setOpenTask] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [projectProgress, setProjectProgress] = useState('0');
  const [projectColor, setProjectColor] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [taskProgress, setTaskProgress] = useState('0');
  const [taskType, setTaskType] = useState<'task' | 'milestone' | 'project'>('task');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskColor, setTaskColor] = useState('');
  const [saving, setSaving] = useState(false);

  const showAllActivities = selectedActivityId === null;
  const effectiveActivityId = selectedActivityId ?? activityId;

  const isEffectiveActivityGanttEnabled = useMemo(() => {
    if (showAllActivities) return true;
    if (!effectiveActivityId) return false;
    return ganttEnabledByActivityId[effectiveActivityId] !== false;
  }, [effectiveActivityId, ganttEnabledByActivityId, showAllActivities]);

  const visibleProjects = useMemo(() => {
    if (showAllActivities) return projects;
    return projects.filter((project) => project.activityId === effectiveActivityId);
  }, [effectiveActivityId, projects, showAllActivities]);

  const visibleTasks = useMemo(() => {
    if (showAllActivities) return tasks;
    return tasks.filter((task) => task.activityId === effectiveActivityId);
  }, [effectiveActivityId, tasks, showAllActivities]);

  const projectTasks = useMemo(() => {
    const map = new Map<string, GanttTask[]>();
    visibleTasks.forEach((task) => {
      const list = map.get(task.projectId) ?? [];
      list.push(task);
      map.set(task.projectId, list);
    });
    return map;
  }, [visibleTasks]);

  const flatRows = useMemo(() => {
    const rows: FlatRow[] = [];
    const orderedProjects = [...visibleProjects].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    orderedProjects.forEach((project) => {
      rows.push({ kind: 'project', project, level: 0 });
      if (!collapsedProjectIds[project.id]) {
        const projectTasksSorted = [...(projectTasks.get(project.id) ?? [])].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );
        projectTasksSorted.forEach((task) => rows.push({ kind: 'task', task, project, level: 1 }));
      }
    });
    return rows;
  }, [collapsedProjectIds, projectTasks, visibleProjects]);

  const timeline = useMemo(() => {
    const dates: Date[] = [];
    flatRows.forEach((row) => {
      if (row.kind === 'project') {
        dates.push(new Date(row.project.startDate));
        if (row.project.endDate) dates.push(new Date(row.project.endDate));
      } else {
        dates.push(new Date(row.task.startDate));
        dates.push(new Date(row.task.endDate));
      }
    });
    dates.push(new Date());
    if (dates.length === 0) {
      const now = new Date();
      dates.push(addDays(now, -7), addDays(now, 30));
    }
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const rangeStart = startOfRange(mode, minDate);
    const rangeEnd = endOfRange(mode, maxDate);
    return {
      rangeStart,
      rangeEnd,
      cells: buildTimelineCells(mode, rangeStart, rangeEnd),
    };
  }, [flatRows, mode]);

  const todayPosition = useMemo(() => {
    const now = new Date();
    if (now < timeline.rangeStart || now > timeline.rangeEnd) return null;
    return clamp(toPercentLeft(now, timeline.rangeStart, timeline.rangeEnd), 0, 100);
  }, [timeline]);

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
    setGanttEnabledByActivityId(Object.fromEntries(entries));
    const targetActivity = showAllActivities ? undefined : effectiveActivityId;
    const [remoteProjects, remoteTasks] = await Promise.all([getGanttProjects(targetActivity), getGanttTasks(targetActivity)]);
    setProjects(remoteProjects);
    setTasks(remoteTasks);
  };

  useEffect(() => {
    void loadData().catch((error) => {
      console.error('Failed to load gantt data', error);
      setActivities([]);
      setGanttEnabledByActivityId({});
      setProjects([]);
      setTasks([]);
    });
  }, [effectiveActivityId, showAllActivities]);

  const resetProjectForm = () => {
    setProjectName('');
    setProjectDescription('');
    setProjectStartDate('');
    setProjectEndDate('');
    setProjectProgress('0');
    setProjectColor('');
  };

  const resetTaskForm = () => {
    setTaskName('');
    setTaskDescription('');
    setTaskStartDate('');
    setTaskEndDate('');
    setTaskProgress('0');
    setTaskType('task');
    setTaskProjectId(visibleProjects[0]?.id ?? '');
    setTaskColor('');
  };

  const openCreateProject = () => {
    setEditTarget(null);
    resetProjectForm();
    setOpenProject(true);
  };

  const openCreateTask = () => {
    setEditTarget(null);
    resetTaskForm();
    setOpenTask(true);
  };

  const openEditProject = (project: GanttProject) => {
    setEditTarget({ kind: 'project', item: project });
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectStartDate(toDatetimeLocalValue(project.startDate));
    setProjectEndDate(toDatetimeLocalValue(project.endDate));
    setProjectProgress(String(project.progress ?? 0));
    setProjectColor(project.color || '');
    setOpenProject(true);
  };

  const openEditTask = (task: GanttTask) => {
    setEditTarget({ kind: 'task', item: task });
    setTaskName(task.name);
    setTaskDescription(task.description || '');
    setTaskStartDate(toDatetimeLocalValue(task.startDate));
    setTaskEndDate(toDatetimeLocalValue(task.endDate));
    setTaskProgress(String(task.progress ?? 0));
    setTaskType(task.type);
    setTaskProjectId(task.projectId);
    setTaskColor(task.color || '');
    setOpenTask(true);
  };

  const handleSubmitProject = async () => {
    if (!effectiveActivityId || !projectName.trim() || !projectStartDate) return;
    setSaving(true);
    try {
      const payload = {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        startDate: new Date(projectStartDate).toISOString(),
        endDate: projectEndDate ? new Date(projectEndDate).toISOString() : undefined,
        progress: Number(projectProgress) || 0,
        color: projectColor.trim() || undefined,
        activityId: effectiveActivityId,
      };
      if (editTarget?.kind === 'project') {
        await updateGanttProject(editTarget.item.id, { ...payload, userId: '' } as any);
      } else {
        await createGanttProject({ ...payload, userId: '' } as any);
      }
      setOpenProject(false);
      setEditTarget(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!effectiveActivityId || !taskProjectId || !taskName.trim() || !taskStartDate || !taskEndDate) return;
    setSaving(true);
    try {
      const payload = {
        projectId: taskProjectId,
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
        startDate: new Date(taskStartDate).toISOString(),
        endDate: new Date(taskEndDate).toISOString(),
        progress: Number(taskProgress) || 0,
        type: taskType,
        dependencies: [],
        color: taskColor.trim() || undefined,
        activityId: effectiveActivityId,
      };
      if (editTarget?.kind === 'task') {
        await updateGanttTask(editTarget.item.id, { ...payload, userId: '' } as any);
      } else {
        await createGanttTask({ ...payload, userId: '' } as any);
      }
      setOpenTask(false);
      setEditTarget(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setSaving(true);
    try {
      await deleteGanttTask(taskId);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setSaving(true);
    try {
      await deleteGanttProject(projectId);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  if (!isEffectiveActivityGanttEnabled) {
    return (
      <div className="animate-fade-in">
        <Header title="Planning Gantt" subtitle="Vue planning des activités et des tâches" />
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
      <Header title="Planning Gantt" subtitle="Crée des projets et des tâches indépendants du calendrier" />
      <div className="p-6 space-y-6">
        <div className="rounded-2xl border bg-card p-5 shadow-sm" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                <FolderKanban size={16} />
                {flatRows.length} ligne(s) affichée(s)
              </div>
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Interface Gantt à deux zones, avec colonne projet fixe et timeline moderne.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={openCreateProject}><Plus size={14} className="mr-1" />Projet</Button>
              <Button variant="outline" size="sm" onClick={openCreateTask}><Plus size={14} className="mr-1" />Tâche</Button>
              <Button variant={mode === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setMode('day')}>Jour</Button>
              <Button variant={mode === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setMode('week')}>Semaine</Button>
              <Button variant={mode === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setMode('month')}>Mois</Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="grid" style={{ gridTemplateColumns: `${LEFT_COLUMN_WIDTH}px minmax(0, 1fr)` }}>
            <div className="sticky top-0 z-20 border-r bg-card" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex h-16 items-center border-b px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground" style={{ borderColor: 'hsl(var(--border))' }}>
                Projets
              </div>
              {flatRows.map((row) => {
                const rowHeight = row.kind === 'project' ? PROJECT_ROW_HEIGHT : TASK_ROW_HEIGHT;
                const label = row.kind === 'project' ? row.project.name : row.task.name;
                return (
                  <div
                    key={row.kind === 'project' ? row.project.id : row.task.id}
                    className="group flex items-center gap-2 border-b px-4 transition-colors hover:bg-secondary/40"
                    style={{ height: rowHeight, borderColor: 'hsl(var(--border))' }}
                  >
                    {row.kind === 'project' ? (
                      <button
                        type="button"
                        onClick={() => setCollapsedProjectIds((prev) => ({ ...prev, [row.project.id]: !prev[row.project.id] }))}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        aria-label={collapsedProjectIds[row.project.id] ? 'Déplier le projet' : 'Replier le projet'}
                      >
                        {collapsedProjectIds[row.project.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>
                    ) : (
                      <span className="ml-6 inline-flex h-2.5 w-2.5 rounded-full" style={{ background: parseColor(row.task.color || row.project?.color) }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-medium ${row.kind === 'task' ? 'pl-1' : ''}`} style={{ color: 'hsl(var(--foreground))' }}>
                        {label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {row.kind === 'project' ? `${row.project.progress}% · ${projectTasks.get(row.project.id)?.length ?? 0} tâche(s)` : `${row.task.progress}%`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      disabled={saving}
                      onClick={() => {
                        if (row.kind === 'project') openEditProject(row.project);
                        else openEditTask(row.task);
                      }}
                      aria-label={row.kind === 'project' ? 'Modifier le projet' : 'Modifier la tâche'}
                    >
                      <Palette size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      disabled={saving}
                      onClick={() => void (row.kind === 'project' ? handleDeleteProject(row.project.id) : handleDeleteTask(row.task.id))}
                      aria-label={row.kind === 'project' ? 'Supprimer le projet' : 'Supprimer la tâche'}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <div className="relative min-w-[720px]">
                <div className="sticky top-0 z-10 border-b bg-card" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${timeline.cells.length}, minmax(72px, 1fr))` }}>
                    {timeline.cells.map((cell) => (
                      <div key={`${cell.label}-${cell.start.toISOString()}`} className="border-r px-3 py-3" style={{ borderColor: 'hsl(var(--border))' }}>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{cell.label}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{cell.sublabel}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {todayPosition !== null && (
                    <div className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-primary/70" style={{ left: `calc(${todayPosition}% - 1px)` }}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                        Aujourd'hui
                      </div>
                    </div>
                  )}

                  {flatRows.map((row) => {
                    const rowHeight = row.kind === 'project' ? PROJECT_ROW_HEIGHT : TASK_ROW_HEIGHT;
                    const currentStart = row.kind === 'project' ? new Date(row.project.startDate) : new Date(row.task.startDate);
                    const currentEnd = row.kind === 'project' ? new Date(row.project.endDate || row.project.startDate) : new Date(row.task.endDate);
                    const span = barRange(currentStart, currentEnd);
                    const color = row.kind === 'project' ? parseColor(row.project.color) : parseColor(row.task.color || row.project?.color);
                    const barLeft = clamp(toPercentLeft(span.start, timeline.rangeStart, timeline.rangeEnd), 0, 100);
                    const barWidth = clamp(toPercentWidth(span.start, span.end, timeline.rangeStart, timeline.rangeEnd), 0, 100 - barLeft);
                    const visual = row.kind === 'project' ? barVisual('project', color) : barVisual(row.task.type, color);
                    const isMilestone = row.kind === 'task' && row.task.type === 'milestone';

                    return (
                      <div key={`${row.kind}-${row.kind === 'project' ? row.project.id : row.task.id}`} className="border-b transition-colors hover:bg-secondary/20" style={{ height: rowHeight, borderColor: 'hsl(var(--border))' }}>
                        <div className="relative h-full">
                          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/80" />
                          {isMilestone ? (
                            <div
                              className="absolute top-1/2 z-10"
                              style={{ left: `calc(${clamp(barLeft, 0, 100)}% - 9px)`, transform: 'translateY(-50%)' }}
                            >
                              <div style={visual} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (row.kind === 'project') openEditProject(row.project);
                                else openEditTask(row.task);
                              }}
                              className="absolute top-1/2 flex items-center overflow-hidden px-3 text-xs font-medium text-white transition-transform hover:scale-[1.01]"
                              style={{
                                left: `${barLeft}%`,
                                width: `${Math.max(barWidth, 0.8)}%`,
                                transform: 'translateY(-50%)',
                                ...visual,
                              }}
                            >
                              <span className="truncate">{row.kind === 'project' ? row.project.name : row.task.name}</span>
                              <span className="ml-auto shrink-0 text-[10px] text-white/75">{row.kind === 'project' ? row.project.progress : row.task.progress}%</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openProject} onOpenChange={(open) => { setOpenProject(open); if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget?.kind === 'project' ? 'Modifier le projet' : 'Nouveau projet Gantt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
            <div><Label>Description</Label><Input value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Début</Label><Input type="datetime-local" value={projectStartDate} onChange={(e) => setProjectStartDate(e.target.value)} /></div>
              <div><Label>Fin</Label><Input type="datetime-local" value={projectEndDate} onChange={(e) => setProjectEndDate(e.target.value)} /></div>
            </div>
            <div><Label>Progression</Label><Input type="number" min="0" max="100" value={projectProgress} onChange={(e) => setProjectProgress(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-3">
                <Input value={projectColor} onChange={(e) => setProjectColor(e.target.value)} placeholder="hsl(var(--primary)) ou #6366f1" />
                <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-secondary/60">
                  <Palette size={16} />
                  <input type="color" className="sr-only" value={projectColor.startsWith('#') ? projectColor : '#6366f1'} onChange={(e) => setProjectColor(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenProject(false)}>Annuler</Button>
            <Button onClick={() => void handleSubmitProject()} disabled={saving}>{editTarget?.kind === 'project' ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openTask} onOpenChange={(open) => { setOpenTask(open); if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget?.kind === 'task' ? 'Modifier la tâche' : 'Nouvelle tâche Gantt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Projet</Label>
              <Select value={taskProjectId} onValueChange={setTaskProjectId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{visibleProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nom</Label><Input value={taskName} onChange={(e) => setTaskName(e.target.value)} /></div>
            <div><Label>Description</Label><Input value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Début</Label><Input type="datetime-local" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} /></div>
              <div><Label>Fin</Label><Input type="datetime-local" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)} /></div>
            </div>
            <div><Label>Progression</Label><Input type="number" min="0" max="100" value={taskProgress} onChange={(e) => setTaskProgress(e.target.value)} /></div>
            <div>
              <Label>Type</Label>
              <Select value={taskType} onValueChange={(v) => setTaskType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Tâche</SelectItem>
                  <SelectItem value="milestone">Jalon</SelectItem>
                  <SelectItem value="project">Projet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-3">
                <Input value={taskColor} onChange={(e) => setTaskColor(e.target.value)} placeholder="hsl(var(--primary)) ou #6366f1" />
                <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-secondary/60">
                  <Palette size={16} />
                  <input type="color" className="sr-only" value={taskColor.startsWith('#') ? taskColor : '#6366f1'} onChange={(e) => setTaskColor(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenTask(false)}>Annuler</Button>
            <Button onClick={() => void handleSubmitTask()} disabled={saving}>{editTarget?.kind === 'task' ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

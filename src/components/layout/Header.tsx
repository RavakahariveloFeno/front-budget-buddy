import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, Briefcase, CalendarClock, LogOut, Menu, Search, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearSessionToken, getCurrentUser, getSuperAdminActingUserId, isSuperAdmin, setSuperAdminActingUserId } from "@/api/authApi";
import { useQuery } from "@tanstack/react-query";
import { getIncomes, getRecurringIncomes } from "@/api/incomeApi";
import type { RecurringIncome } from "@/api/incomeApi";
import { getExpenses, getRecurringExpenses } from "@/api/expenseApi";
import type { RecurringExpense } from "@/api/expenseApi";
import { getBudgets, getBudgetStatistics } from "@/api/budgetApi";
import { getLoans } from "@/api/loanApi";
import { getNotificationState, updateNotificationState } from "@/api/notificationApi";
import type { Budget, Expense, Income, Loan } from "@/data/staticData";
import { formatCurrency } from "@/data/staticData";
import { useMobileMenu } from "./mobile-menu";
import { getSuperAdminUsers } from "@/api/superAdminApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActivities } from "@/api/activityApi";
import { useActivityFilterStore } from "@/stores/activityFilterStore";
import { useActiveManagedProfile } from "@/hooks/useActiveManagedProfile";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

type NotificationLevel = "high" | "medium" | "low";

interface AppNotification {
  id: string;
  title: string;
  description: string;
  level: NotificationLevel;
  to: string;
  timestamp: number;
}

type RecurrenceFrequency = "DAY" | "WEEK" | "MONTH";
const NOTIFICATION_POLL_INTERVAL_MS = 15000;
const ALL_ACTIVITIES_VALUE = "__all__";

function getDayStart(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDateOnly(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return getDayStart(parsed);
}

function addFrequency(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  if (frequency === "DAY") {
    next.setDate(next.getDate() + 1);
    return next;
  }
  if (frequency === "WEEK") {
    next.setDate(next.getDate() + 7);
    return next;
  }
  next.setMonth(next.getMonth() + 1);
  return next;
}

function daysDiff(from: Date, to: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / oneDay);
}

function nextOccurrence(startDate: string, endDate: string | undefined, frequency: RecurrenceFrequency, today: Date): Date | null {
  const start = parseDateOnly(startDate);
  if (!start) {
    return null;
  }

  const end = parseDateOnly(endDate);
  if (end && start > end) {
    return null;
  }

  let current = start;
  let guard = 0;
  while (current < today && guard < 500) {
    current = addFrequency(current, frequency);
    guard += 1;
  }

  if (end && current > end) {
    return null;
  }

  return current;
}

function buildRecurringIncomeAlerts(items: RecurringIncome[], today: Date): AppNotification[] {
  return items
    .filter((item) => item.isActive)
    .map((item) => {
      const next = nextOccurrence(item.startDate, item.endDate, item.frequency, today);
      if (!next) {
        return null;
      }

      const days = daysDiff(today, next);
      if (days < 0 || days > 3) {
        return null;
      }

      return {
        id: `rec-income-${item.id}`,
        title: days === 0 ? "Revenu recurrent attendu aujourd'hui" : "Revenu recurrent imminent",
        description: `${item.description || "Revenu automatique"} - ${formatCurrency(item.amount)}`,
        level: days === 0 ? "high" : "medium",
        to: "/incomes",
        timestamp: next.getTime(),
      } satisfies AppNotification;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function buildRecurringExpenseAlerts(items: RecurringExpense[], today: Date): AppNotification[] {
  return items
    .filter((item) => item.isActive)
    .map((item) => {
      const next = nextOccurrence(item.startDate, item.endDate, item.frequency, today);
      if (!next) {
        return null;
      }

      const days = daysDiff(today, next);
      if (days < 0 || days > 3) {
        return null;
      }

      return {
        id: `rec-expense-${item.id}`,
        title: days === 0 ? "Depense recurrente a traiter aujourd'hui" : "Depense recurrente imminente",
        description: `${item.description || "Depense automatique"} - ${formatCurrency(item.amount)}`,
        level: days === 0 ? "high" : "medium",
        to: "/expenses",
        timestamp: next.getTime(),
      } satisfies AppNotification;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function buildAutoRunAlerts(incomes: Income[], expenses: Expense[], today: Date): AppNotification[] {
  const isToday = (value: string): boolean => {
    const date = parseDateOnly(value);
    return Boolean(date && date.getTime() === today.getTime());
  };

  const autoIncomes = incomes.filter((item) => Boolean(item.recurringIncomeId) && isToday(item.date));
  const autoExpenses = expenses.filter((item) => Boolean(item.recurringExpenseId) && isToday(item.date));

  const alerts: AppNotification[] = [];
  if (autoIncomes.length > 0) {
    const total = autoIncomes.reduce((sum, item) => sum + item.amount, 0);
    alerts.push({
      id: `auto-income-run-${today.toISOString().slice(0, 10)}-${autoIncomes.length}-${Math.round(total)}`,
      title: "Action automatique revenu lancee",
      description: `${autoIncomes.length} revenu(x) automatique(s) execute(s) - ${formatCurrency(total)}`,
      level: "medium",
      to: "/incomes",
      timestamp: today.getTime() + 11,
    });
  }

  if (autoExpenses.length > 0) {
    const total = autoExpenses.reduce((sum, item) => sum + item.amount, 0);
    alerts.push({
      id: `auto-expense-run-${today.toISOString().slice(0, 10)}-${autoExpenses.length}-${Math.round(total)}`,
      title: "Action automatique depense lancee",
      description: `${autoExpenses.length} depense(s) automatique(s) executee(s) - ${formatCurrency(total)}`,
      level: "medium",
      to: "/expenses",
      timestamp: today.getTime() + 12,
    });
  }

  return alerts;
}

function buildBudgetAlerts(budgets: Budget[], spentByPeriod: { DAY: number; WEEK: number; MONTH: number }): AppNotification[] {
  return budgets
    .map((budget) => {
      if (!Number.isFinite(budget.amount) || budget.amount <= 0) {
        return null;
      }

      const spent = spentByPeriod[budget.period] ?? 0;
      const ratio = spent / budget.amount;
      if (ratio >= 1) {
        return {
          id: `budget-over-${budget.id}`,
          title: "Budget depasse",
          description: `${budget.period} - ${formatCurrency(spent)} / ${formatCurrency(budget.amount)}`,
          level: "high",
          to: "/budgets",
          timestamp: Date.now(),
        } satisfies AppNotification;
      }

      if (ratio >= 0.85) {
        return {
          id: `budget-near-${budget.id}`,
          title: "Budget presque atteint",
          description: `${budget.period} - ${Math.round(ratio * 100)}% utilise`,
          level: "medium",
          to: "/budgets",
          timestamp: Date.now(),
        } satisfies AppNotification;
      }

      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function buildLoanAlerts(loans: Loan[], today: Date): AppNotification[] {
  return loans
    .filter((loan) => loan.status === "ACTIVE" && loan.remainingAmount > 0)
    .map((loan) => {
      const due = parseDateOnly(loan.endDate);
      if (!due) {
        return null;
      }

      const days = daysDiff(today, due);
      if (days < 0) {
        return {
          id: `loan-overdue-${loan.id}`,
          title: "Pret en retard",
          description: `${loan.lenderName} - retard de ${Math.abs(days)} jour(s)`,
          level: "high",
          to: "/loans",
          timestamp: due.getTime(),
        } satisfies AppNotification;
      }

      if (days <= 7) {
        return {
          id: `loan-due-${loan.id}`,
          title: "Echeance de pret proche",
          description: `${loan.lenderName} - dans ${days} jour(s)`,
          level: "medium",
          to: "/loans",
          timestamp: due.getTime(),
        } satisfies AppNotification;
      }

      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggle: toggleMobileMenu } = useMobileMenu();
  const { selectedActivityId, setSelectedActivityId, clearSelectedActivityId } = useActivityFilterStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const readNotificationIdsRef = useRef<string[]>([]);
  const seenNotificationMapRef = useRef<Record<string, number>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const isManagedProfile = Boolean(currentUser?.profileId);
  const superAdmin = isSuperAdmin();
  const [actingUserId, setActingUserId] = useState<string>(() => getSuperAdminActingUserId() ?? "");
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Mon compte";
  const userEmail = currentUser?.email ?? "-";
  const userInitials = currentUser
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
    : "U";

  const { data: superAdminUsers = [], isLoading: superAdminUsersLoading } = useQuery({
    queryKey: ["superadminUsers"],
    queryFn: getSuperAdminUsers,
    enabled: superAdmin,
    staleTime: 30_000,
  });

  const { data: managedProfile, isLoading: managedProfileLoading } = useActiveManagedProfile();

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
    staleTime: 30_000,
  });

  const visibleActivities = useMemo(() => {
    if (!isManagedProfile) {
      return activities;
    }

    const allowed = new Set(managedProfile?.activities ?? []);
    return activities.filter((activity) => allowed.has(activity.id));
  }, [activities, isManagedProfile, managedProfile?.activities]);

  const shouldShowAllActivitiesOption = useMemo(() => {
    // User principale : toujours afficher "Toutes les activités"
    if (!isManagedProfile) {
      return true;
    }
    
    // Profile géré : utiliser l'information du backend
    return managedProfile?.hasAllActivitiesAccess ?? false;
  }, [isManagedProfile, managedProfile?.hasAllActivitiesAccess]);

  useEffect(() => {
    if (!isManagedProfile) {
      return;
    }

    if (managedProfileLoading) {
      return;
    }

    if (!selectedActivityId) {
      return;
    }

    const allowed = new Set(managedProfile?.activities ?? []);
    if (!allowed.has(selectedActivityId)) {
      clearSelectedActivityId();
    }
  }, [clearSelectedActivityId, isManagedProfile, managedProfile?.activities, managedProfileLoading, selectedActivityId]);

  useEffect(() => {
    // Si shouldShowAllActivitiesOption est false et qu'aucune activité n'est sélectionnée,
    // sélectionner automatiquement la première activité visible
    if (!shouldShowAllActivitiesOption && !selectedActivityId && visibleActivities.length > 0) {
      setSelectedActivityId(visibleActivities[0].id);
    }
  }, [shouldShowAllActivitiesOption, selectedActivityId, visibleActivities, setSelectedActivityId]);

  const searchItems = useMemo(
    () => [
      { to: "/", title: "Tableau de bord", subtitle: "Vue globale", keywords: ["dashboard", "accueil"] },
      { to: "/activities", title: "Activites", subtitle: "Sources de revenus", keywords: ["activity", "business", "salaire"] },
      { to: "/modules", title: "Modules", subtitle: "Affectation des modules", keywords: ["module", "assignation", "activite"] },
      { to: "/incomes", title: "Revenus", subtitle: "Transactions entrantes", keywords: ["income", "salaire", "entree"] },
      { to: "/expenses", title: "Depenses", subtitle: "Transactions sortantes", keywords: ["expense", "sortie", "achat"] },
      { to: "/categories", title: "Categories", subtitle: "Classement des depenses", keywords: ["category", "tag"] },
      { to: "/budgets", title: "Budgets", subtitle: "Objectifs et limites", keywords: ["budget", "plafond"] },
      { to: "/loans", title: "Prets", subtitle: "Emprunts et remboursements", keywords: ["loan", "credit"] },
      { to: "/investments", title: "Investissements", subtitle: "Transferts entre activites", keywords: ["investment", "transfert"] },
      { to: "/settings", title: "Parametres", subtitle: "Preferences et compte", keywords: ["settings", "parametre", "configuration"] },
      ...(superAdmin ? [{ to: "/superadmin", title: "Superadmin", subtitle: "Gestion utilisateurs", keywords: ["admin", "superadmin", "utilisateur"] }] : []),
    ],
    [superAdmin],
  );

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return searchItems;
    }

    return searchItems.filter((item) => {
      const haystack = `${item.title} ${item.subtitle} ${item.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(value);
    });
  }, [query, searchItems]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !readNotificationIds.includes(item.id)),
    [notifications, readNotificationIds],
  );
  const hasUnreadNotifications = unreadNotifications.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onShortcut);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onShortcut);
    };
  }, []);

  useEffect(() => {
    readNotificationIdsRef.current = readNotificationIds;
  }, [readNotificationIds]);

  const persistNotificationState = useCallback(
    async (nextReadIds: string[], nextSeenMap: Record<string, number>) => {
      if (!currentUserId) {
        return;
      }

      try {
        await updateNotificationState({
          readIds: nextReadIds,
          seenMap: nextSeenMap,
        });
      } catch {
        // Ignore transient sync failures and retry on next update.
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!currentUserId) {
      setReadNotificationIds([]);
      seenNotificationMapRef.current = {};
      return;
    }

    let cancelled = false;
    const loadState = async () => {
      try {
        const state = await getNotificationState();
        if (cancelled) {
          return;
        }
        setReadNotificationIds(state.readIds);
        seenNotificationMapRef.current = state.seenMap;
      } catch {
        if (cancelled) {
          return;
        }
        setReadNotificationIds([]);
        seenNotificationMapRef.current = {};
      }
    };

    void loadState();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const markNotificationsAsRead = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return;
      }

      setReadNotificationIds((prev) => {
        const next = Array.from(new Set([...prev, ...ids]));
        if (next.length !== prev.length) {
          readNotificationIdsRef.current = next;
          void persistNotificationState(next, seenNotificationMapRef.current);
        }
        return next;
      });
    },
    [persistNotificationState],
  );

  const trackSeenNotifications = useCallback(
    (items: AppNotification[]) => {
      if (items.length === 0) {
        return;
      }

      const current = seenNotificationMapRef.current;
      let changed = false;
      const next = { ...current };
      const now = Date.now();

      items.forEach((item, index) => {
        if (!next[item.id]) {
          next[item.id] = now + index;
          changed = true;
        }
      });

      if (!changed) {
        return;
      }

      seenNotificationMapRef.current = next;
      void persistNotificationState(readNotificationIdsRef.current, next);
    },
    [persistNotificationState],
  );

  const loadNotifications = useCallback(async (withLoading: boolean) => {
    if (withLoading) {
      setNotificationsLoading(true);
    }

    const [recIncomeResult, recExpenseResult, incomesResult, expensesResult, budgetsResult, budgetStatsResult, loansResult] = await Promise.allSettled([
      getRecurringIncomes(),
      getRecurringExpenses(),
      getIncomes(),
      getExpenses(),
      getBudgets(),
      getBudgetStatistics(),
      getLoans(),
    ]);

    const today = getDayStart(new Date());
    const nextNotifications: AppNotification[] = [];

    if (recIncomeResult.status === "fulfilled") {
      nextNotifications.push(...buildRecurringIncomeAlerts(recIncomeResult.value, today));
    }

    if (recExpenseResult.status === "fulfilled") {
      nextNotifications.push(...buildRecurringExpenseAlerts(recExpenseResult.value, today));
    }

    if (incomesResult.status === "fulfilled" && expensesResult.status === "fulfilled") {
      nextNotifications.push(...buildAutoRunAlerts(incomesResult.value, expensesResult.value, today));
    }

    if (budgetsResult.status === "fulfilled" && budgetStatsResult.status === "fulfilled") {
      nextNotifications.push(...buildBudgetAlerts(budgetsResult.value, budgetStatsResult.value.spentByPeriod));
    }

    if (loansResult.status === "fulfilled") {
      nextNotifications.push(...buildLoanAlerts(loansResult.value, today));
    }

    const failedCount = [recIncomeResult, recExpenseResult, incomesResult, expensesResult, budgetsResult, budgetStatsResult, loansResult].filter(
      (result) => result.status === "rejected",
    ).length;
    if (failedCount > 0) {
      nextNotifications.push({
        id: "notif-sync-warning",
        title: "Synchronisation partielle",
        description: "Certaines alertes n'ont pas pu etre chargees.",
        level: "low",
        to: "/",
        timestamp: Date.now(),
      });
    }

    trackSeenNotifications(nextNotifications);
    const severityOrder: Record<NotificationLevel, number> = { high: 0, medium: 1, low: 2 };
    nextNotifications.sort((a, b) => {
      const seenA = seenNotificationMapRef.current[a.id] ?? a.timestamp;
      const seenB = seenNotificationMapRef.current[b.id] ?? b.timestamp;
      if (seenB !== seenA) {
        return seenB - seenA;
      }
      return severityOrder[a.level] - severityOrder[b.level];
    });
    setNotifications(nextNotifications.slice(0, 8));
    setNotificationsLoading(false);
  }, [trackSeenNotifications]);

  useEffect(() => {
    let cancelled = false;

    const run = async (withLoading: boolean) => {
      if (cancelled) {
        return;
      }
      await loadNotifications(withLoading);
    };

    void run(true);
    const intervalId = window.setInterval(() => {
      void run(false);
    }, NOTIFICATION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [loadNotifications, location.pathname]);

  useEffect(() => {
    if (!notificationOpen) {
      return;
    }

    markNotificationsAsRead(notifications.map((item) => item.id));
  }, [notificationOpen, notifications, markNotificationsAsRead]);

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const handleLogout = () => {
    clearSessionToken();
    clearSelectedActivityId();
    navigate("/signin", { replace: true });
    setUserMenuOpen(false);
  };

  const handleNotificationClick = (to: string) => {
    markNotificationsAsRead(notifications.map((item) => item.id));
    setNotificationOpen(false);
    navigate(to);
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredItems.length);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const target = filteredItems[activeIndex];
      if (target) {
        goTo(target.to);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      searchRef.current?.blur();
    }
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:bg-secondary"
          style={{ borderColor: "hsl(var(--border))" }}
          title="Menu"
        >
          <Menu size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold" style={{ color: "hsl(var(--foreground))" }}>{title}</h1>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-end">
        <div ref={wrapperRef} className="relative">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border w-[140px] sm:w-[260px]"
            style={{
              background: "hsl(var(--secondary))",
              color: "hsl(var(--muted-foreground))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <Search size={14} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={onSearchKeyDown}
              placeholder="Rechercher..."
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: "hsl(var(--foreground))" }}
            />
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: "hsl(var(--border))" }}>
              Ctrl+K
            </span>
          </div>
          {open && (
            <div
              className="absolute right-0 mt-2 w-[280px] sm:w-[360px] rounded-lg border overflow-hidden z-30"
              style={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }}
            >
              {filteredItems.length === 0 ? (
                <div className="px-3 py-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Aucun resultat
                </div>
              ) : (
                filteredItems.slice(0, 8).map((item, index) => {
                  const isActive = index === activeIndex;
                  const isCurrent = location.pathname === item.to;
                  return (
                    <button
                      key={item.to}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item.to)}
                      className="w-full text-left px-3 py-2 border-b last:border-b-0 transition-colors"
                      style={{
                        borderColor: "hsl(var(--border) / 0.5)",
                        background: isActive ? "hsl(var(--secondary))" : "transparent",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{item.title}</p>
                        {isCurrent && <span className="text-[10px] badge-income">Ouvert</span>}
                      </div>
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{item.subtitle}</p>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        <Select
          value={selectedActivityId ?? ALL_ACTIVITIES_VALUE}
          onValueChange={(value) => {
            if (value === ALL_ACTIVITIES_VALUE) {
              clearSelectedActivityId();
              return;
            }
            setSelectedActivityId(value);
          }}
        >
          <SelectTrigger
            className="w-10 px-0 justify-center [&>svg]:hidden md:w-[260px] md:px-3 md:justify-between md:[&>svg]:block"
            style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}
            title="Filtrer par activite"
          >
            <span className="md:hidden" aria-hidden="true">
              <Briefcase size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
            </span>
            <SelectValue
              className="hidden md:inline"
              placeholder={activitiesLoading || (isManagedProfile && managedProfileLoading) ? "Chargement..." : "Toutes les activites"}
            />
          </SelectTrigger>
          <SelectContent>
            {shouldShowAllActivitiesOption && (
              <SelectItem value={ALL_ACTIVITIES_VALUE}>Toutes les activites</SelectItem>
            )}
            {visibleActivities.map((activity) => (
              <SelectItem key={activity.id} value={activity.id}>
                {activity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {superAdmin && (
          <Select
            value={actingUserId ? actingUserId : "__self__"}
            onValueChange={(value) => {
              const next = value === "__self__" ? "" : value;
              setActingUserId(next);
              setSuperAdminActingUserId(next ? next : null);
              window.location.reload();
            }}
          >
            <SelectTrigger
              className="w-10 px-0 justify-center [&>svg]:hidden md:w-[260px] md:px-3 md:justify-between md:[&>svg]:block"
              style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}
              title="Selectionner un utilisateur"
            >
              <span className="md:hidden" aria-hidden="true">
                <Users size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
              </span>
              <SelectValue
                className="hidden md:inline"
                placeholder={superAdminUsersLoading ? "Chargement..." : "Selectionner un utilisateur"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__self__">Mon compte</SelectItem>
              {superAdminUsers.map((user) => (
                <SelectItem key={user.id} value={user.id} disabled={user.isSuperAdmin}>
                  {user.firstName} {user.lastName} - {user.email}{user.isDisabled ? " (desactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div ref={notificationMenuRef} className="relative">
          <button
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              setUserMenuOpen(false);
            }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:bg-secondary"
            style={{ borderColor: "hsl(var(--border))" }}
            title="Notifications"
          >
            <Bell size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
            {hasUnreadNotifications && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "hsl(var(--destructive))" }}
              />
            )}
          </button>
          {notificationOpen && (
            <div
              className="absolute right-0 mt-2 w-[320px] rounded-lg border overflow-hidden z-30"
              style={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Notifications</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {notificationsLoading ? "Chargement..." : `${unreadNotifications.length} non lue(s)`}
                </p>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {!notificationsLoading && notifications.length === 0 && (
                  <div className="px-3 py-4 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Aucune alerte importante pour le moment.
                  </div>
                )}
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNotificationClick(item.to)}
                    className="w-full text-left px-3 py-2 border-b last:border-b-0 transition-colors hover:bg-secondary/60"
                    style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">
                        {item.level === "high" ? (
                          <AlertTriangle size={14} style={{ color: "hsl(var(--destructive))" }} />
                        ) : item.level === "medium" ? (
                          <CalendarClock size={14} style={{ color: "hsl(var(--warning))" }} />
                        ) : (
                          <Bell size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{item.title}</p>
                        <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{item.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={userMenuRef} className="relative pl-1">
          <button
            onClick={() => {
              setUserMenuOpen((prev) => !prev);
              setNotificationOpen(false);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
            title="Mon compte"
          >
            {userInitials}
          </button>
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-[220px] rounded-lg border p-3 z-30"
              style={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }}
            >
              <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>
                {userName}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {userEmail}
              </p>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-xs transition-colors hover:bg-secondary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                title="Se deconnecter"
              >
                <LogOut size={13} />
                <span>Se deconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


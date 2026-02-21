import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearSessionToken, getCurrentUser } from "@/api/authApi";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUser = getCurrentUser();
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Mon compte";
  const userEmail = currentUser?.email ?? "-";
  const userInitials = currentUser
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
    : "U";

  const searchItems = useMemo(
    () => [
      { to: "/", title: "Tableau de bord", subtitle: "Vue globale", keywords: ["dashboard", "accueil"] },
      { to: "/activities", title: "Activites", subtitle: "Sources de revenus", keywords: ["activity", "business", "salaire"] },
      { to: "/incomes", title: "Revenus", subtitle: "Transactions entrantes", keywords: ["income", "salaire", "entree"] },
      { to: "/expenses", title: "Depenses", subtitle: "Transactions sortantes", keywords: ["expense", "sortie", "achat"] },
      { to: "/categories", title: "Categories", subtitle: "Classement des depenses", keywords: ["category", "tag"] },
      { to: "/budgets", title: "Budgets", subtitle: "Objectifs et limites", keywords: ["budget", "plafond"] },
      { to: "/loans", title: "Prets", subtitle: "Emprunts et remboursements", keywords: ["loan", "credit"] },
      { to: "/investments", title: "Investissements", subtitle: "Transferts entre activites", keywords: ["investment", "transfert"] },
    ],
    [],
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

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const handleLogout = () => {
    clearSessionToken();
    navigate("/signin", { replace: true });
    setUserMenuOpen(false);
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
      <div>
        <h1 className="text-xl font-display font-bold" style={{ color: "hsl(var(--foreground))" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div ref={wrapperRef} className="relative">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border w-[170px] sm:w-[260px]"
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
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:bg-secondary"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <Bell size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "hsl(var(--destructive))" }}
          />
        </button>
        <div ref={userMenuRef} className="relative pl-1">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
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

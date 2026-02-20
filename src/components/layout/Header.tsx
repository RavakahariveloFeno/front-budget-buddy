import { Bell, Search } from "lucide-react";
import { currentUser } from "@/data/staticData";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
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
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border"
          style={{
            background: "hsl(var(--secondary))",
            color: "hsl(var(--muted-foreground))",
            borderColor: "hsl(var(--border))",
          }}
        >
          <Search size={14} />
          <span className="hidden sm:inline">Rechercher...</span>
        </button>
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
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
        >
          {currentUser.firstName[0]}{currentUser.lastName[0]}
        </div>
      </div>
    </header>
  );
}

import { STATIC_BILAN } from "@/data/comptabiliteData";
import { formatCurrency } from "@/data/staticData";
import { BarChart3 } from "lucide-react";

export default function BilanPage() {
  const actifs = STATIC_BILAN.filter((b) => b.categorie === "ACTIF");
  const passifs = STATIC_BILAN.filter((b) => b.categorie === "PASSIF");
  const totalActif = actifs.reduce((s, b) => s + b.montant, 0);
  const totalPassif = passifs.reduce((s, b) => s + b.montant, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><BarChart3 size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total Actif</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalActif)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><BarChart3 size={20} style={{ color: "hsl(var(--chart-4))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total Passif</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalPassif)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><BarChart3 size={20} style={{ color: totalActif === totalPassif ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Écart</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalActif - totalPassif)}</p></div></div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="stat-card">
            <h3 className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Actif</h3>
            <div className="space-y-3">
              {actifs.map((b) => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                  <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{b.libelle}</span>
                  <span className="font-semibold text-sm" style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(b.montant)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
                <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>Total Actif</span>
                <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalActif)}</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="font-display font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Passif</h3>
            <div className="space-y-3">
              {passifs.map((b) => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-lg" style={{ background: "hsl(var(--secondary))" }}>
                  <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{b.libelle}</span>
                  <span className="font-semibold text-sm" style={{ color: "hsl(var(--chart-4))" }}>{formatCurrency(b.montant)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
                <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>Total Passif</span>
                <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalPassif)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

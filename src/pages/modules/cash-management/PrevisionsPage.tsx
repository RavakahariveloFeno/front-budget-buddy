import { LineChart, TrendingUp, TrendingDown } from "lucide-react";
import { STATIC_PREVISIONS } from "@/data/tresorerieData";
import { formatCurrency } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PrevisionsPage() {
  const totalEncPrev = STATIC_PREVISIONS.reduce((s, p) => s + p.encaissementsPrevus, 0);
  const totalDecPrev = STATIC_PREVISIONS.reduce((s, p) => s + p.decaissementsPrevus, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><TrendingUp size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Encaissements prévus</p><p className="text-xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(totalEncPrev)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><TrendingDown size={20} style={{ color: "hsl(var(--destructive))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Décaissements prévus</p><p className="text-xl font-bold" style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(totalDecPrev)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><LineChart size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Excédent prévu</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalEncPrev - totalDecPrev)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Prévisions de trésorerie</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Mois</TableHead><TableHead>Encaissements</TableHead><TableHead>Décaissements</TableHead><TableHead>Solde prévu</TableHead></TableRow></TableHeader>
            <TableBody>
              {STATIC_PREVISIONS.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{p.mois}</TableCell>
                  <TableCell style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(p.encaissementsPrevus)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(p.decaissementsPrevus)}</TableCell>
                  <TableCell className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(p.soldePrevu)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

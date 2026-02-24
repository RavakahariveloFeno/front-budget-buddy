import { FileBarChart, TrendingUp, TrendingDown } from "lucide-react";
import { STATIC_RAPPORTS } from "@/data/tresorerieData";
import { formatCurrency } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RapportsPage() {
  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Rapports mensuels</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Période</TableHead><TableHead>Encaissements</TableHead><TableHead>Décaissements</TableHead><TableHead>Solde net</TableHead><TableHead>Variation</TableHead></TableRow></TableHeader>
            <TableBody>
              {STATIC_RAPPORTS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{r.periode}</TableCell>
                  <TableCell style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(r.totalEncaissements)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(r.totalDecaissements)}</TableCell>
                  <TableCell className="font-bold" style={{ color: r.soldeNet >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }}>{formatCurrency(r.soldeNet)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {r.variation >= 0 ? <TrendingUp size={14} style={{ color: "hsl(var(--chart-2))" }} /> : <TrendingDown size={14} style={{ color: "hsl(var(--destructive))" }} />}
                      <Badge variant={r.variation >= 0 ? "default" : "destructive"}>{r.variation > 0 ? "+" : ""}{r.variation}%</Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

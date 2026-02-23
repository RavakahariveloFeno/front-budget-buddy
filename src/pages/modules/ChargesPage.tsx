import { PiggyBank } from "lucide-react";
import { STATIC_CHARGES } from "@/data/paieData";
import { formatCurrency } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ChargesPage() {
  const totalCharges = STATIC_CHARGES.reduce((s, c) => s + c.montant, 0);
  const patronales = STATIC_CHARGES.filter((c) => c.libelle.includes("employeur")).reduce((s, c) => s + c.montant, 0);
  const salariales = STATIC_CHARGES.filter((c) => c.libelle.includes("salarié") || c.libelle === "IRSA").reduce((s, c) => s + c.montant, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><PiggyBank size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total charges</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalCharges)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><PiggyBank size={20} style={{ color: "hsl(var(--chart-3))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Patronales</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(patronales)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><PiggyBank size={20} style={{ color: "hsl(var(--chart-4))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Salariales & IRSA</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(salariales)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Charges sociales — Juin 2025</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Libellé</TableHead><TableHead>Taux</TableHead><TableHead>Base</TableHead><TableHead>Montant</TableHead></TableRow></TableHeader>
            <TableBody>
              {STATIC_CHARGES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{c.libelle}</TableCell>
                  <TableCell><Badge variant="outline">{c.taux}%</Badge></TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{c.base}</TableCell>
                  <TableCell className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(c.montant)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

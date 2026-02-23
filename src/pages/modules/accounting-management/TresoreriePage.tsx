import { useState } from "react";
import { Landmark, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { STATIC_MOUVEMENTS_TRESORERIE, type MouvementTresorerie } from "@/data/comptabiliteData";
import { formatCurrency, formatDate } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TresoreriePage() {
  const [mouvements] = useState<MouvementTresorerie[]>(STATIC_MOUVEMENTS_TRESORERIE);
  const entrees = mouvements.filter((m) => m.type === "ENTREE").reduce((s, m) => s + m.montant, 0);
  const sorties = mouvements.filter((m) => m.type === "SORTIE").reduce((s, m) => s + m.montant, 0);
  const soldeActuel = mouvements[0]?.soldeApres ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><Landmark size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Solde actuel</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(soldeActuel)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><ArrowDownLeft size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total entrées</p><p className="text-xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(entrees)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><ArrowUpRight size={20} style={{ color: "hsl(var(--destructive))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total sorties</p><p className="text-xl font-bold" style={{ color: "hsl(var(--destructive))" }}>{formatCurrency(sorties)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Mouvements de trésorerie</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Libellé</TableHead><TableHead>Montant</TableHead><TableHead>Solde après</TableHead></TableRow></TableHeader>
            <TableBody>
              {mouvements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(m.date)}</TableCell>
                  <TableCell><Badge variant={m.type === "ENTREE" ? "default" : "destructive"}>{m.type === "ENTREE" ? "Entrée" : "Sortie"}</Badge></TableCell>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{m.libelle}</TableCell>
                  <TableCell className="font-semibold" style={{ color: m.type === "ENTREE" ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }}>{m.type === "ENTREE" ? "+" : "-"}{formatCurrency(m.montant)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(m.soldeApres)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

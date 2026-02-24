import { useState } from "react";
import { Receipt, Eye } from "lucide-react";
import { STATIC_FICHES_PAIE, STATIC_EMPLOYES, type FichePaie } from "@/data/paieData";
import { formatCurrency } from "@/data/staticData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function employeNom(id: string) { return STATIC_EMPLOYES.find((e) => e.id === id)?.nom ?? "—"; }

export default function FichesPaiePage() {
  const [fiches] = useState<FichePaie[]>(STATIC_FICHES_PAIE);
  const [viewing, setViewing] = useState<FichePaie | null>(null);

  const totalNet = fiches.reduce((s, f) => s + f.netAPayer, 0);
  const totalPrimes = fiches.reduce((s, f) => s + f.primes, 0);

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card"><div className="flex items-center gap-3"><Receipt size={20} style={{ color: "hsl(var(--primary))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Fiches de paie</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{fiches.length}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Receipt size={20} style={{ color: "hsl(var(--chart-2))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total net</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalNet)}</p></div></div></div>
          <div className="stat-card"><div className="flex items-center gap-3"><Receipt size={20} style={{ color: "hsl(var(--chart-3))" }} /><div><p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total primes</p><p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(totalPrimes)}</p></div></div></div>
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>Fiches de paie — Juin 2025</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Employé</TableHead><TableHead>Salaire base</TableHead><TableHead>Primes</TableHead><TableHead>Déductions</TableHead><TableHead>Net à payer</TableHead><TableHead className="w-[60px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {fiches.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{employeNom(f.employeId)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--muted-foreground))" }}>{formatCurrency(f.salaireBase)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--chart-2))" }}>{formatCurrency(f.primes)}</TableCell>
                  <TableCell style={{ color: "hsl(var(--destructive))" }}>-{formatCurrency(f.deductions)}</TableCell>
                  <TableCell className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(f.netAPayer)}</TableCell>
                  <TableCell>
                    <button onClick={() => setViewing(f)} className="p-1.5 rounded hover:bg-accent"><Eye size={14} style={{ color: "hsl(var(--primary))" }} /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="border-border" style={{ background: "hsl(var(--card))" }}>
          <DialogHeader><DialogTitle className="font-display" style={{ color: "hsl(var(--foreground))" }}>Fiche de paie — {viewing && employeNom(viewing.employeId)}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 rounded" style={{ background: "hsl(var(--secondary))" }}><span style={{ color: "hsl(var(--muted-foreground))" }}>Mois</span><span style={{ color: "hsl(var(--foreground))" }}>{viewing.mois}</span></div>
              <div className="flex justify-between p-2 rounded" style={{ background: "hsl(var(--secondary))" }}><span style={{ color: "hsl(var(--muted-foreground))" }}>Salaire de base</span><span style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(viewing.salaireBase)}</span></div>
              <div className="flex justify-between p-2 rounded" style={{ background: "hsl(var(--secondary))" }}><span style={{ color: "hsl(var(--muted-foreground))" }}>Primes</span><span style={{ color: "hsl(var(--chart-2))" }}>+{formatCurrency(viewing.primes)}</span></div>
              <div className="flex justify-between p-2 rounded" style={{ background: "hsl(var(--secondary))" }}><span style={{ color: "hsl(var(--muted-foreground))" }}>Déductions</span><span style={{ color: "hsl(var(--destructive))" }}>-{formatCurrency(viewing.deductions)}</span></div>
              <div className="flex justify-between p-3 rounded border font-bold" style={{ borderColor: "hsl(var(--border))" }}><span style={{ color: "hsl(var(--foreground))" }}>Net à payer</span><span style={{ color: "hsl(var(--primary))" }}>{formatCurrency(viewing.netAPayer)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

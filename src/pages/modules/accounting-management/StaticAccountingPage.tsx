import { useParams } from "react-router-dom";
import { Database, FileBarChart } from "lucide-react";
import { STATIC_ACCOUNTING_PAGES } from "@/data/accountingStaticPages";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function toneColor(tone?: "primary" | "revenue" | "expense" | "warning") {
  switch (tone) {
    case "revenue":
      return "hsl(var(--chart-2))";
    case "expense":
      return "hsl(var(--destructive))";
    case "warning":
      return "hsl(var(--warning))";
    case "primary":
    default:
      return "hsl(var(--primary))";
  }
}

export default function StaticAccountingPage() {
  const { menuPath } = useParams<{ menuPath: string }>();
  const page = menuPath ? STATIC_ACCOUNTING_PAGES[menuPath] : undefined;

  if (!page) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {page.summary.map((item) => (
            <div key={item.label} className="stat-card">
              <div className="flex items-center gap-3">
                <Database size={20} style={{ color: toneColor(item.tone) }} />
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{item.label}</p>
                  <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="stat-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <FileBarChart size={18} style={{ color: "hsl(var(--primary))" }} />
              <h3 className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>{page.title}</h3>
            </div>
            <Badge variant="outline">Statique</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {page.headers.map((header) => <TableHead key={header}>{header}</TableHead>)}
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow key={row.id}>
                  {row.values.map((value, index) => (
                    <TableCell
                      key={`${row.id}-${index}`}
                      className={index === 0 ? "font-medium" : undefined}
                      style={{ color: index === 0 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    >
                      {value}
                    </TableCell>
                  ))}
                  <TableCell><Badge variant="secondary">{row.status ?? "Statique"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

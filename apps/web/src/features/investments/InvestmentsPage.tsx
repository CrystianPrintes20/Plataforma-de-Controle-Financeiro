import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { KPICard } from "@/shared/components/KPICard";
import { AddInvestmentModal } from "./components/AddInvestmentModal";
import { EditInvestmentModal } from "./components/EditInvestmentModal";
import { ApplyInvestmentModal } from "./components/ApplyInvestmentModal";
import { useInvestments, useDeleteInvestment } from "./hooks/use-investments";
import { useMoneyFormatter } from "@/shared";
import { Building2, Wallet, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import type { Investment } from "@shared/schema";

export default function InvestmentsPage() {
  const { data: investments, isLoading } = useInvestments();
  const { mutate: deleteInvestment } = useDeleteInvestment();
  const { formatter } = useMoneyFormatter();
  const [editing, setEditing] = useState<Investment | null>(null);

  const total = investments?.reduce(
    (sum, inv) => sum + Number(inv.currentValue),
    0
  ) ?? 0;

  const byInstitution = investments ?? [];

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground">Panorama por instituição e saldo total.</p>
        </div>
        <AddInvestmentModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KPICard
          title="Saldo total"
          value={formatter.format(total)}
          icon={Wallet}
          color="primary"
        />
        <KPICard
          title="Instituições"
          value={String(byInstitution.length)}
          icon={Building2}
          color="secondary"
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Instituições</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : byInstitution.length === 0 ? (
            <p className="text-muted-foreground">Nenhum saldo cadastrado ainda.</p>
          ) : (
            <div className="space-y-4">
              {byInstitution.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatter.format(Number(inv.currentValue))}
                      </p>
                      <p className="text-xs text-muted-foreground">Saldo atual</p>
                    </div>
                    <ApplyInvestmentModal investment={inv as Investment} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditing(inv as Investment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteInvestment(inv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditInvestmentModal
          investment={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </AppShell>
  );
}

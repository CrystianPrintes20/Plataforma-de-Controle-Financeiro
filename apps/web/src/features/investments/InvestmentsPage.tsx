import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { KPICard } from "@/shared/components/KPICard";
import { AddInvestmentModal } from "./components/AddInvestmentModal";
import { ImportInvestmentsModal } from "./components/ImportInvestmentsModal";
import { AddInvestmentEntryModal } from "./components/AddInvestmentEntryModal";
import { EditInvestmentEntryModal } from "./components/EditInvestmentEntryModal";
import { EditInvestmentModal } from "./components/EditInvestmentModal";
import { ApplyInvestmentModal } from "./components/ApplyInvestmentModal";
import { useInvestments, useDeleteInvestment, useInvestmentEntries } from "./hooks/use-investments";
import { useMoneyFormatter } from "@/shared";
import { Building2, Wallet, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useEffect, useMemo, useState } from "react";
import type { Investment } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export default function InvestmentsPage() {
  const { data: investments, isLoading } = useInvestments();
  const { mutate: deleteInvestment } = useDeleteInvestment();
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const { data: allEntries } = useInvestmentEntries();
  const { data: entries } = useInvestmentEntries(Number(selectedYear));
  const { formatter } = useMoneyFormatter();
  const [editing, setEditing] = useState<Investment | null>(null);

  const total = investments?.reduce(
    (sum, inv) => sum + Number(inv.currentValue),
    0
  ) ?? 0;

  const byInstitution = investments ?? [];

  const years = useMemo(() => {
    const values = (allEntries ?? [])
      .map((entry) => entry.year)
      .filter((year): year is number => typeof year === "number" && Number.isFinite(year));
    if (values.length === 0) return [new Date().getFullYear()];
    return Array.from(new Set(values)).sort((a, b) => b - a);
  }, [allEntries]);

  useEffect(() => {
    if (years.length === 0) return;
    if (!years.includes(Number(selectedYear))) {
      setSelectedYear(String(years[0]));
    }
  }, [years, selectedYear]);

  const historyByInstitution = useMemo(() => {
    const grouped = new Map<string, { month: number; value: number; entryId?: number }[]>();
    (entries ?? []).forEach((entry) => {
      const investment = (investments ?? []).find((inv) => inv.id === entry.investmentId);
      if (!investment) return;
      const key = investment.name;
      const list = grouped.get(key) ?? [];
      list.push({ month: entry.month, value: Number(entry.value), entryId: entry.id });
      grouped.set(key, list);
    });

    return Array.from(grouped.entries()).map(([name, values]) => {
      const monthly = Array.from({ length: 12 }, (_, idx) => {
        const found = values.find((item) => item.month === idx + 1);
        return {
          name: new Date(2023, idx, 1).toLocaleString("pt-BR", { month: "short" }),
          value: found ? found.value : 0,
          entryId: found?.entryId,
        };
      });
      return { name, data: monthly };
    });
  }, [entries, investments]);

  const historyOverall = useMemo(() => {
    const totals = Array.from({ length: 12 }, (_, idx) => ({
      name: new Date(2023, idx, 1).toLocaleString("pt-BR", { month: "short" }),
      value: 0,
    }));
    (entries ?? []).forEach((entry) => {
      const idx = entry.month - 1;
      if (idx >= 0 && idx < 12) {
        totals[idx].value += Number(entry.value);
      }
    });
    return totals;
  }, [entries]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground">Panorama por instituição e saldo total.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
          <ImportInvestmentsModal triggerClassName="w-full sm:w-auto" />
          <AddInvestmentEntryModal triggerClassName="w-full sm:w-auto" />
          <AddInvestmentModal />
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start bg-transparent p-0 mb-4 gap-2 flex-wrap">
          <TabsTrigger value="summary" className="rounded-full border border-border/60 bg-background px-4">
            Resumo
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-full border border-border/60 bg-background px-4">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
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
        </TabsContent>

        <TabsContent value="history">
          <div className="flex justify-end mb-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Histórico por instituição</CardTitle>
              <p className="text-sm text-muted-foreground">Evolução mensal no ano selecionado.</p>
            </CardHeader>
            <CardContent>
              {historyByInstitution.length === 0 ? (
                <p className="text-muted-foreground">Sem histórico importado.</p>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="mb-3 text-sm font-semibold text-foreground">Geral</div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyOverall}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value: number | string) => formatter.format(Number(value))} />
                        <Line type="monotone" dataKey="value" stroke="hsl(204 90% 58%)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {historyByInstitution.map((series) => (
                    <div key={series.name} className="rounded-xl border border-border/60 p-4">
                      <div className="mb-3 text-sm font-semibold text-foreground">{series.name}</div>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={series.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <Tooltip formatter={(value: number | string) => formatter.format(Number(value))} />
                            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                        {series.data.map((point, idx) => (
                          <div
                            key={`${series.name}-${idx}`}
                            className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-2 py-1"
                          >
                            <span className="text-muted-foreground">{point.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {formatter.format(point.value)}
                              </span>
                              {point.entryId ? (
                                <EditInvestmentEntryModal
                                  entryId={point.entryId}
                                  currentValue={point.value}
                                  label={`${series.name} - ${point.name}`}
                                />
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

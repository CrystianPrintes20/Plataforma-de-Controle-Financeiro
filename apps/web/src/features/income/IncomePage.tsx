import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useMoneyFormatter } from "@/shared";
import { useAccounts } from "@/features/accounts";
import { ImportIncomeModal } from "./components/ImportIncomeModal";
import { AddMonthlyEntryModal } from "./components/AddMonthlyEntryModal";
import { EditMonthlyEntryModal } from "./components/EditMonthlyEntryModal";
import { useIncomeEntries, useDeleteIncomeEntry, useAnnualIncome } from "./hooks/use-income";
import type { IncomeEntry } from "@shared/schema";
import { ResponsiveContainer, Bar, XAxis, Tooltip, CartesianGrid, Line, ComposedChart } from "recharts";
import { Pencil, Trash2 } from "lucide-react";

export default function IncomePage() {
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [yearTouched, setYearTouched] = useState(false);
  const { formatter } = useMoneyFormatter();
  const { data: accounts } = useAccounts();

  const { data: entries, isLoading: loadingEntries } = useIncomeEntries();
  const { data: annual, isLoading: loadingAnnual } = useAnnualIncome(Number(selectedYear));
  const { mutate: deleteEntry } = useDeleteIncomeEntry();
  const [editing, setEditing] = useState<IncomeEntry | null>(null);

  useEffect(() => {
    if (yearTouched || !entries || entries.length === 0) return;
    const years = entries
      .map((entry) => entry.year)
      .filter((year): year is number => typeof year === "number" && !Number.isNaN(year));
    if (years.length === 0) return;
    const maxYear = Math.max(...years);
    setSelectedYear(String(maxYear));
  }, [entries, yearTouched]);

  const chartData = useMemo(() => {
    if (!annual) return [];
    return annual.months.map((m) => ({
      name: format(new Date(annual.year, m.month - 1, 1), "MMM"),
      total: m.total,
    }));
  }, [annual]);

  const entriesMatrix = useMemo(() => {
    const matrix = new Map<string, number[]>();
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return matrix;

    (entries ?? []).forEach((item) => {
      if (item.year !== year) return;
      const row = matrix.get(item.name) ?? Array.from({ length: 12 }).map(() => 0);
      const monthIndex = item.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        row[monthIndex] += Number(item.amount);
      }
      matrix.set(item.name, row);
    });

    return matrix;
  }, [entries, selectedYear]);

  const entryRows = useMemo(() => {
    return Array.from(entriesMatrix.entries())
      .map(([name, months]) => ({
        name,
        months,
        total: months.reduce((sum, value) => sum + value, 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entriesMatrix]);

  const totalsByMonth = useMemo(() => {
    const totals = Array.from({ length: 12 }).map(() => 0);
    entryRows.forEach((row) => {
      row.months.forEach((value, idx) => {
        totals[idx] += value;
      });
    });
    return totals;
  }, [entryRows]);

  const monthEntries = useMemo(() => {
    const year = Number(selectedYear);
    const monthIndex = Number(selectedMonth) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return [];
    return (entries ?? []).filter((item) => item.year === year && item.month === monthIndex + 1);
  }, [entries, selectedYear, selectedMonth]);

  const yearTotal = useMemo(() => totalsByMonth.reduce((sum, value) => sum + value, 0), [totalsByMonth]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Entradas</h1>
          <p className="text-muted-foreground">Entradas mensais com histórico anual.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
          <Select
            value={selectedYear}
            onValueChange={(value) => {
              setSelectedYear(value);
              setYearTouched(true);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => 2023 + i).map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ImportIncomeModal triggerClassName="w-full sm:w-auto" />
          <AddMonthlyEntryModal
            defaultYear={Number(selectedYear)}
            triggerClassName="w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/50 shadow-sm xl:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Histórico anual</CardTitle>
            <p className="text-sm text-muted-foreground">Comparativo mensal do ano selecionado.</p>
          </CardHeader>
          <CardContent>
            {loadingAnnual ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number | string) => formatter.format(Number(value))}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" />
                    <Line dataKey="total" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Resumo mensal</CardTitle>
            <p className="text-sm text-muted-foreground">Totais por mês no ano atual.</p>
          </CardHeader>
          <CardContent>
            {loadingAnnual ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(annual?.months ?? []).map((month) => (
                  <div
                    key={month.month}
                    className="rounded-lg border border-border/50 bg-card/60 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {format(new Date(annual?.year ?? Number(selectedYear), month.month - 1, 1), "MMM")}
                      </span>
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatter.format(month.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm mb-8">
        <CardHeader className="space-y-1">
          <CardTitle>Entradas mensais por fonte</CardTitle>
          <p className="text-sm text-muted-foreground">
            Visão por fonte com distribuição mensal e total do ano.
          </p>
        </CardHeader>
        <CardContent>
          {entryRows.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma entrada cadastrada para este ano.</p>
          ) : (
            <div className="space-y-4">
              {entryRows.map((row) => (
                <div
                  key={row.name}
                  className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="text-base font-semibold">{row.name}</div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-base font-semibold">{formatter.format(row.total)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {row.months.map((value, idx) => (
                      <div
                        key={`${row.name}-${idx}`}
                        className="rounded-md border border-border/50 bg-background/60 p-3"
                      >
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(Number(selectedYear), idx, 1), "MMM")}
                        </div>
                        <div className="text-sm font-medium">{formatter.format(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-base font-semibold">Total do ano</div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-base font-semibold">{formatter.format(yearTotal)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {totalsByMonth.map((value, idx) => (
                    <div
                      key={`total-${idx}`}
                      className="rounded-md border border-border/50 bg-background/60 p-3"
                    >
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(Number(selectedYear), idx, 1), "MMM")}
                      </div>
                      <div className="text-sm font-semibold">{formatter.format(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Entradas do mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={String(month)}>
                    {format(new Date(Number(selectedYear), month - 1, 1), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingEntries ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : monthEntries.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma entrada para este mês.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {monthEntries.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Descrição</div>
                        <div className="text-base font-semibold">{item.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Valor</div>
                        <div className="text-base font-semibold text-foreground">
                          {formatter.format(Number(item.amount))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div className="text-xs text-muted-foreground">Conta</div>
                      <div className="font-medium">
                        {accounts?.find((acc) => acc.id === item.accountId)?.name || "-"}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteEntry(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden w-full overflow-x-auto pb-2 md:block">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Descrição</TableHead>
                      <TableHead className="min-w-[160px]">Conta</TableHead>
                      <TableHead className="text-right min-w-[140px]">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthEntries.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{accounts?.find((acc) => acc.id === item.accountId)?.name || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatter.format(Number(item.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditing(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteEntry(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditMonthlyEntryModal
          item={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </AppShell>
  );
}

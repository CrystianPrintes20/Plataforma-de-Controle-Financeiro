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
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, Line, ComposedChart } from "recharts";
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
    return (annual?.months ?? []).map((m) => ({
      name: format(new Date(annual!.year, m.month - 1, 1), "MMM"),
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
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedYear}
            onValueChange={(value) => {
              setSelectedYear(value);
              setYearTouched(true);
            }}
          >
            <SelectTrigger className="w-[140px]">
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
          <ImportIncomeModal />
          <AddMonthlyEntryModal defaultYear={Number(selectedYear)} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/50 shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Histórico anual</CardTitle>
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
                      formatter={(value: number) => formatter.format(Number(value))}
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
          <CardHeader>
            <CardTitle>Resumo mensal</CardTitle>
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
                        {format(new Date(annual!.year, month.month - 1, 1), "MMM")}
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
        <CardHeader>
          <CardTitle>Entradas mensais por fonte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 px-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Fonte</TableHead>
                  {Array.from({ length: 12 }, (_, i) => (
                    <TableHead key={i} className="text-right min-w-[90px]">
                      {format(new Date(Number(selectedYear), i, 1), "MMM")}
                    </TableHead>
                  ))}
                  <TableHead className="text-right min-w-[110px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entryRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    {row.months.map((value, idx) => (
                      <TableCell key={`${row.name}-${idx}`} className="text-right">
                        {formatter.format(value)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      {formatter.format(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  {totalsByMonth.map((value, idx) => (
                    <TableCell key={`total-${idx}`} className="text-right font-semibold">
                      {formatter.format(value)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">
                    {formatter.format(yearTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthEntries.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{accounts?.find((acc) => acc.id === item.accountId)?.name || "-"}</TableCell>
                    <TableCell>Dia {item.dayOfMonth}</TableCell>
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

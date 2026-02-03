import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { KPICard } from "@/shared/components/KPICard";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useMoneyFormatter } from "@/shared";
import { AlertCircle, BadgeDollarSign, CreditCard, Pencil, PieChart as PieIcon, Info, Trash2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, CartesianGrid, Legend } from "recharts";
import { Tooltip as HelpTooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { useDebts, useDeleteDebt } from "./hooks/use-debts";
import { useAccounts } from "@/features/accounts";
import { AddDebtModal } from "./components/AddDebtModal";
import { ImportDebtsModal } from "./components/ImportDebtsModal";
import { EditDebtModal } from "./components/EditDebtModal";
import type { Debt } from "@shared/schema";

const statusLabel = (status?: string | null) => {
  switch (status) {
    case "paid":
      return "Paga";
    case "defaulted":
      return "Inadimplente";
    default:
      return "Pendente";
  }
};

const statusVariant = (status?: string | null) => {
  switch (status) {
    case "paid":
      return "secondary";
    case "defaulted":
      return "destructive";
    default:
      return "outline";
  }
};

export default function DebtsPage() {
  const { data: debts, isLoading } = useDebts();
  const { mutate: deleteDebt } = useDeleteDebt();
  const { data: accounts } = useAccounts();
  const { formatter } = useMoneyFormatter();
  const [editing, setEditing] = useState<Debt | null>(null);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [yearTouched, setYearTouched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paid" | "defaulted">("all");

  const filteredDebts = useMemo(() => {
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return debts ?? [];
    const monthValue = Number(selectedMonth);
    const byYear = (debts ?? []).filter((debt) => debt.year === year);
    const byMonth = Number.isFinite(monthValue) && monthValue > 0
      ? byYear.filter((debt) => debt.month === monthValue)
      : byYear;
    if (statusFilter === "all") return byMonth;
    return byMonth.filter((debt) => debt.status === statusFilter);
  }, [debts, selectedYear, selectedMonth, statusFilter]);

  const sortedDebts = useMemo(() => {
    return [...filteredDebts].sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.name.localeCompare(b.name);
    });
  }, [filteredDebts]);

  const groupedByMonth = useMemo(() => {
    const monthMap = new Map<number, Debt[]>();
    sortedDebts.forEach((debt) => {
      const list = monthMap.get(debt.month) ?? [];
      list.push(debt);
      monthMap.set(debt.month, list);
    });
    return monthMap;
  }, [sortedDebts]);

  const totals = useMemo(() => {
    const list = filteredDebts ?? [];
    const totalAmount = list.reduce((sum, debt) => sum + Number(debt.totalAmount), 0);
    const remainingAmount = list.reduce((sum, debt) => {
      if (debt.status === "paid") return sum;
      return sum + Number(debt.remainingAmount);
    }, 0);
    const activeCount = list.filter((debt) => debt.status === "active").length;
    return { totalAmount, remainingAmount, activeCount, count: list.length };
  }, [filteredDebts]);

  const years = useMemo(() => {
    const values = (debts ?? [])
      .map((debt) => debt.year)
      .filter((year): year is number => typeof year === "number" && Number.isFinite(year));
    if (values.length === 0) return [];
    return Array.from(new Set(values)).sort((a, b) => b - a);
  }, [debts]);

  const accountMap = useMemo(() => {
    return new Map((accounts ?? []).map((account) => [account.id, account.name]));
  }, [accounts]);

  useEffect(() => {
    if (yearTouched || years.length === 0) return;
    setSelectedYear(String(years[0]));
  }, [yearTouched, years]);

  const monthlyTotals = useMemo(() => {
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return [];
    const totalsByMonth = Array.from({ length: 12 }, (_, idx) => ({
      month: idx + 1,
      open: 0,
      paid: 0,
    }));
    (debts ?? []).forEach((debt) => {
      if (debt.year !== year) return;
      const idx = debt.month - 1;
      if (idx >= 0 && idx < 12) {
        if (debt.status === "paid") {
          totalsByMonth[idx].paid += Number(debt.totalAmount);
        } else {
          totalsByMonth[idx].open += Number(debt.remainingAmount);
        }
      }
    });
    return totalsByMonth.map((item) => ({
      ...item,
      name: new Date(2023, item.month - 1, 1).toLocaleString("pt-BR", { month: "short" }),
    }));
  }, [debts, selectedYear]);

  const statusChart = useMemo(() => {
    const buckets = [
      { key: "active", label: "Pendente", value: 0 },
      { key: "paid", label: "Paga", value: 0 },
      { key: "defaulted", label: "Inadimplente", value: 0 },
    ];
    filteredDebts.forEach((debt) => {
      const idx = buckets.findIndex((item) => item.key === debt.status);
      if (idx >= 0) {
        const value = debt.status === "paid" ? 0 : Number(debt.remainingAmount);
        buckets[idx].value += value;
      }
    });
    return buckets;
  }, [filteredDebts]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 mb-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-teal-200/40 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Dívidas</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe saldo restante, prazos e concentração por status.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
              <ImportDebtsModal triggerClassName="w-full sm:w-auto" />
              <AddDebtModal triggerClassName="w-full sm:w-auto" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todas" },
              { key: "active", label: "Pendentes" },
              { key: "paid", label: "Pagas" },
              { key: "defaulted", label: "Inadimplentes" },
            ].map((item) => (
              <Button
                key={item.key}
                variant={statusFilter === item.key ? "default" : "outline"}
                size="sm"
                className={statusFilter === item.key ? "shadow-md shadow-emerald-500/20" : ""}
                onClick={() => setStatusFilter(item.key as typeof statusFilter)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <Select
              value={selectedYear}
              onValueChange={(value) => {
                setSelectedYear(value);
                setYearTouched(true);
              }}
            >
              <SelectTrigger className="w-[140px] bg-white/70">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {(years.length > 0
                  ? years
                  : Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => 2023 + i)
                ).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Competência</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px] bg-white/70">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {new Date(2023, month - 1, 1).toLocaleString("pt-BR", { month: "short" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Valor a pagar"
          value={formatter.format(totals.remainingAmount)}
          icon={BadgeDollarSign}
          color="primary"
        />
        <KPICard
          title="Dívidas pendentes"
          value={String(totals.activeCount)}
          icon={AlertCircle}
          color="secondary"
        />
        <KPICard
          title="Total das dívidas"
          value={formatter.format(totals.totalAmount)}
          icon={CreditCard}
          color="accent"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-transparent p-0 mb-4 gap-2 flex-wrap">
          <TabsTrigger value="overview" className="rounded-full border border-border/60 bg-background px-4">
            Resumo
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-full border border-border/60 bg-background px-4">
            Mensal
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-full border border-border/60 bg-background px-4">
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5 text-emerald-700">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">O que é “valor a pagar”?</p>
                <p className="text-emerald-800/80">
                  É o valor do mês que ainda está em aberto. Quando o status é “PAGO”, o valor a pagar do mês é 0.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle>Distribuição por status</CardTitle>
                <p className="text-sm text-muted-foreground">Valor em aberto por situação.</p>
              </CardHeader>
              <CardContent className="flex flex-col">
                {statusChart.every((item) => item.value === 0) ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PieIcon className="h-4 w-4" />
                    <span>Sem valores para exibir.</span>
                  </div>
                ) : (
                  <>
                    <div className="h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChart}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={48}
                            outerRadius={74}
                            paddingAngle={2}
                          >
                            {statusChart.map((item) => (
                              <Cell
                                key={item.key}
                                fill={
                                  item.key === "paid"
                                    ? "hsl(204 90% 58%)"
                                    : item.key === "defaulted"
                                      ? "hsl(var(--destructive))"
                                      : "hsl(var(--primary))"
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number | string) => formatter.format(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                      {statusChart.map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">{formatter.format(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Valor por mês</CardTitle>
                <HelpTooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>Empilhado: “Em aberto” + “Pago” no mês.</span>
                  </TooltipContent>
                </HelpTooltip>
              </div>
              <p className="text-sm text-muted-foreground">Comparativo entre valores pagos e em aberto.</p>
            </CardHeader>
            <CardContent>
              {monthlyTotals.length === 0 ? (
                <p className="text-muted-foreground">Sem dados para o ano selecionado.</p>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTotals}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number | string) => formatter.format(Number(value))} />
                      <Legend />
                      <Bar name="Em aberto" dataKey="open" stackId="a" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar name="Pago" dataKey="paid" stackId="a" fill="hsl(204 90% 58%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Lista de dívidas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (sortedDebts ?? []).length === 0 ? (
                <p className="text-muted-foreground">Nenhuma dívida cadastrada ainda.</p>
              ) : (
                <div className="space-y-6">
                  {Number(selectedMonth) > 0 ? (
                    <div className="space-y-4">
                      {sortedDebts.map((debt) => (
                        <div
                          key={debt.id}
                          className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-white via-white to-emerald-50/40 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{debt.name}</p>
                              <Badge variant={statusVariant(debt.status)}>{statusLabel(debt.status)}</Badge>
                              <Badge variant="outline">
                                {new Date(2023, debt.month - 1, 1).toLocaleString("pt-BR", { month: "short" })} / {debt.year}
                              </Badge>
                              <Badge variant="outline">
                                Pagamento {new Date(2023, debt.paymentMonth - 1, 1).toLocaleString("pt-BR", { month: "short" })} / {debt.paymentYear}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {debt.dueDate ? `Vencimento: dia ${debt.dueDate}` : "Sem vencimento informado"}
                              {debt.interestRate ? ` · Juros ${Number(debt.interestRate)}% a.a.` : ""}
                              {debt.accountId ? ` · Conta ${accountMap.get(debt.accountId) ?? "-"}` : ""}
                            </p>
                          </div>

                          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
                            <div className="text-sm">
                              <p className="text-xs text-muted-foreground">Valor a pagar</p>
                              <p className="font-semibold text-foreground">
                                {formatter.format(debt.status === "paid" ? 0 : Number(debt.remainingAmount))}
                              </p>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="font-medium text-foreground">
                                {formatter.format(Number(debt.totalAmount))}
                              </p>
                            </div>
                            {debt.minPayment ? (
                              <div className="text-sm">
                                <p className="text-xs text-muted-foreground">Pag. mín.</p>
                                <p className="font-medium text-foreground">
                                  {formatter.format(Number(debt.minPayment))}
                                </p>
                              </div>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditing(debt as Debt)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir dívida?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação remove a dívida e não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteDebt(debt.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    Array.from(groupedByMonth.entries()).map(([month, items]) => (
                      <div key={month} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                            {new Date(2023, month - 1, 1).toLocaleString("pt-BR", { month: "short" })}
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(2023, month - 1, 1).toLocaleString("pt-BR", { month: "long" })}
                          </p>
                        </div>
                        <div className="space-y-4">
                          {items.map((debt) => (
                            <div
                              key={debt.id}
                              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-white via-white to-emerald-50/40 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground">{debt.name}</p>
                                  <Badge variant={statusVariant(debt.status)}>{statusLabel(debt.status)}</Badge>
                                  <Badge variant="outline">
                                    {new Date(2023, debt.month - 1, 1).toLocaleString("pt-BR", { month: "short" })} / {debt.year}
                                  </Badge>
                                  <Badge variant="outline">
                                    Pagamento {new Date(2023, debt.paymentMonth - 1, 1).toLocaleString("pt-BR", { month: "short" })} / {debt.paymentYear}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {debt.dueDate ? `Vencimento: dia ${debt.dueDate}` : "Sem vencimento informado"}
                                  {debt.interestRate ? ` · Juros ${Number(debt.interestRate)}% a.a.` : ""}
                                  {debt.accountId ? ` · Conta ${accountMap.get(debt.accountId) ?? "-"}` : ""}
                                </p>
                              </div>

                              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
                                <div className="text-sm">
                                  <p className="text-xs text-muted-foreground">Valor a pagar</p>
                                  <p className="font-semibold text-foreground">
                                    {formatter.format(debt.status === "paid" ? 0 : Number(debt.remainingAmount))}
                                  </p>
                                </div>
                                <div className="text-sm">
                                  <p className="text-xs text-muted-foreground">Total</p>
                                  <p className="font-medium text-foreground">
                                    {formatter.format(Number(debt.totalAmount))}
                                  </p>
                                </div>
                                {debt.minPayment ? (
                                  <div className="text-sm">
                                    <p className="text-xs text-muted-foreground">Pag. mín.</p>
                                    <p className="font-medium text-foreground">
                                      {formatter.format(Number(debt.minPayment))}
                                    </p>
                                  </div>
                                ) : null}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditing(debt as Debt)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir dívida?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Essa ação remove a dívida e não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteDebt(debt.id)}>
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editing && (
        <EditDebtModal
          debt={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </AppShell>
  );
}

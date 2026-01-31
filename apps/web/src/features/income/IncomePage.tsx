import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  useIncomeTransactions,
  useDeleteIncome,
  useFixedIncomes,
  useDeleteFixedIncome,
  useAnnualIncome,
} from "./hooks/use-income";
import { AddIncomeModal } from "./components/AddIncomeModal";
import { AddFixedIncomeModal } from "./components/AddFixedIncomeModal";
import { EditIncomeModal } from "./components/EditIncomeModal";
import { EditFixedIncomeModal } from "./components/EditFixedIncomeModal";
import { useMoneyFormatter } from "@/shared";
import { format } from "date-fns";
import { Button } from "@/shared/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Transaction, FixedIncome } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";

export default function IncomePage() {
  const { data: variable, isLoading: loadingVariable } = useIncomeTransactions();
  const { data: fixed, isLoading: loadingFixed } = useFixedIncomes();
  const { data: annual, isLoading: loadingAnnual } = useAnnualIncome();
  const { mutate: deleteIncome } = useDeleteIncome();
  const { mutate: deleteFixed } = useDeleteFixedIncome();
  const { formatter } = useMoneyFormatter();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editingFixed, setEditingFixed] = useState<FixedIncome | null>(null);

  const chartData = (annual?.months ?? []).map((m) => ({
    name: format(new Date(annual!.year, m.month - 1, 1), "MMM"),
    fixed: m.fixedTotal,
    variable: m.variableTotal,
    total: m.total,
  }));

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Ganhos</h1>
          <p className="text-muted-foreground">Fixos e variáveis com histórico anual.</p>
        </div>
        <div className="flex gap-2">
          <AddFixedIncomeModal />
          <AddIncomeModal />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Ganhos fixos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFixed ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (fixed?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground">Nenhum ganho fixo cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Dia</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixed?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
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
                            onClick={() => setEditingFixed(item as FixedIncome)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteFixed(item.id)}
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

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Ganhos variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVariable ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variable?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>{tx.account?.name || "-"}</TableCell>
                      <TableCell>{tx.category?.name || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatter.format(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing(tx as Transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteIncome(tx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {variable?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum ganho variável registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Histórico anual</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnnual ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatter.format(Number(value))}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                  />
                  <Bar dataKey="fixed" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="variable" stackId="a" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditIncomeModal
          transaction={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
      {editingFixed && (
        <EditFixedIncomeModal
          item={editingFixed}
          open={!!editingFixed}
          onOpenChange={(open) => !open && setEditingFixed(null)}
        />
      )}
    </AppShell>
  );
}

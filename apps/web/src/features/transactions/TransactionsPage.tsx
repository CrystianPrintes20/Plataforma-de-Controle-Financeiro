import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";
import { AppShell } from "@/app/AppShell";
import { useTransactions, useDeleteTransaction } from "@/features/transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { useMoneyFormatter } from "@/shared";
import { Trash2 } from "lucide-react";

export default function Transactions() {
  const [filterType, setFilterType] = useState<"income" | "expense" | "transfer" | undefined>();
  const { data: transactions, isLoading } = useTransactions({ type: filterType });
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const { formatter } = useMoneyFormatter();

  return (
    <AppShell>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses.</p>
          </div>
          <AddTransactionModal />
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>History</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={(v) => setFilterType(v === "all" ? undefined : v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center">Loading transactions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>{t.account?.name || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {t.category?.name || t.type}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : ''}`}>
                        {t.type === 'income' ? '+' : '-'}{formatter.format(Number(t.amount))}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTransaction(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </AppShell>
  );
}

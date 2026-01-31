import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTransactionSchema, type Transaction } from "@shared/schema";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import { useUpdateIncome } from "../hooks/use-income";
import { useMoneyFormatter } from "@/shared";

const formSchema = insertTransactionSchema.extend({
  amount: z.coerce.number().positive("Informe um valor válido"),
  accountId: z.coerce.number(),
  categoryId: z.coerce.number().optional(),
  date: z.coerce.date(),
}).omit({ type: true, userId: true });

type FormValues = z.infer<typeof formSchema>;

export function EditIncomeModal({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateIncome();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { formatter } = useMoneyFormatter();
  const [amountInput, setAmountInput] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction.description,
      amount: Number(transaction.amount),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId ?? undefined,
      date: new Date(transaction.date),
    },
  });

  useEffect(() => {
    reset({
      description: transaction.description,
      amount: Number(transaction.amount),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId ?? undefined,
      date: new Date(transaction.date),
    });
    const cents = Math.round(Number(transaction.amount) * 100);
    setAmountInput(Number.isFinite(cents) ? String(cents) : "");
  }, [transaction, reset]);

  const incomeCategories = (categories ?? []).filter((cat) => cat.type === "income");
  const formattedAmount = useMemo(() => {
    if (!amountInput) return "";
    const numeric = Number(amountInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [amountInput, formatter]);

  const handleAmountChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    setAmountInput(onlyDigits);
    const numeric = Number(onlyDigits) / 100;
    setValue("amount", Number.isNaN(numeric) ? 0 : numeric);
  };

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        id: transaction.id,
        payload: {
          description: data.description,
          amount: data.amount.toString(),
          accountId: Number(data.accountId),
          categoryId: data.categoryId ? Number(data.categoryId) : undefined,
          date: data.date,
          type: "income",
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Editar ganho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formattedAmount}
                onChange={(event) => handleAmountChange(event.target.value)}
                placeholder={formatter.format(0)}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" {...register("date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={String(transaction.accountId)} onValueChange={(val) => setValue("accountId", Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={transaction.categoryId ? String(transaction.categoryId) : undefined} onValueChange={(val) => setValue("categoryId", Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {incomeCategories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

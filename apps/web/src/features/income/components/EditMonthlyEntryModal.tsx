import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import { useUpdateIncomeEntry } from "../hooks/use-income";
import type { IncomeEntry } from "@shared/schema";
import { useMoneyFormatter } from "@/shared";

const formSchema = z.object({
  name: z.string().min(2, "Informe a descrição"),
  amount: z.coerce.number().positive("Informe um valor válido"),
  accountId: z.coerce.number(),
  categoryId: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});

type FormValues = z.infer<typeof formSchema>;

export function EditMonthlyEntryModal({
  item,
  open,
  onOpenChange,
}: {
  item: IncomeEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateIncomeEntry();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { currency, formatter } = useMoneyFormatter();
  const [amountInput, setAmountInput] = useState(() => {
    const numeric = Number(item.amount);
    if (Number.isNaN(numeric)) return "";
    return Math.round(numeric * 100).toString();
  });

  const defaultMonth = item.month ?? new Date().getMonth() + 1;
  const defaultYear = item.year ?? new Date().getFullYear();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      amount: Number(item.amount),
      accountId: item.accountId,
      categoryId: item.categoryId ?? undefined,
      month: defaultMonth,
      year: defaultYear,
    },
  });

  useEffect(() => {
    reset({
      name: item.name,
      amount: Number(item.amount),
      accountId: item.accountId,
      categoryId: item.categoryId ?? undefined,
      month: defaultMonth,
      year: defaultYear,
    });
    const numeric = Number(item.amount);
    setAmountInput(Number.isNaN(numeric) ? "" : Math.round(numeric * 100).toString());
  }, [item, reset, defaultMonth, defaultYear]);

  const incomeCategories = (categories ?? []).filter((cat) => cat.type === "income");
  const watchedMonth = watch("month");
  const watchedAccountId = watch("accountId");
  const watchedCategoryId = watch("categoryId");

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

  const parsedAmount = () => {
    const numeric = Number(amountInput) / 100;
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const onSubmit = (data: FormValues) => {
    const amountValue = parsedAmount();
    mutate(
      {
        id: item.id,
        payload: {
          name: data.name,
          amount: amountValue.toString(),
          accountId: Number(data.accountId),
          categoryId: data.categoryId ? Number(data.categoryId) : undefined,
          month: data.month,
          year: data.year,
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
          <DialogTitle>Editar entrada mensal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("amount")} />
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Valor ({currency})</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formattedAmount}
              onChange={(event) => handleAmountChange(event.target.value)}
              placeholder={formatter.format(Number(item.amount))}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={watchedMonth ? String(watchedMonth) : undefined} onValueChange={(val) => setValue("month", Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {new Date(2023, month - 1, 1).toLocaleString("pt-BR", { month: "short" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" {...register("year")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={watchedAccountId ? String(watchedAccountId) : undefined} onValueChange={(val) => setValue("accountId", Number(val))}>
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
            <Select value={watchedCategoryId ? String(watchedCategoryId) : undefined} onValueChange={(val) => setValue("categoryId", Number(val))}>
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

import { useEffect } from "react";
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
import { useUpdateFixedIncome } from "../hooks/use-income";
import type { FixedIncome } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(2, "Informe a descrição"),
  amount: z.coerce.number().positive("Informe um valor válido"),
  dayOfMonth: z.coerce.number().min(1).max(28),
  accountId: z.coerce.number(),
  categoryId: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditFixedIncomeModal({
  item,
  open,
  onOpenChange,
}: {
  item: FixedIncome;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateFixedIncome();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      amount: Number(item.amount),
      dayOfMonth: item.dayOfMonth,
      accountId: item.accountId,
      categoryId: item.categoryId ?? undefined,
    },
  });

  useEffect(() => {
    reset({
      name: item.name,
      amount: Number(item.amount),
      dayOfMonth: item.dayOfMonth,
      accountId: item.accountId,
      categoryId: item.categoryId ?? undefined,
    });
  }, [item, reset]);

  const incomeCategories = (categories ?? []).filter((cat) => cat.type === "income");

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        id: item.id,
        payload: {
          ...data,
          amount: data.amount.toString(),
          accountId: Number(data.accountId),
          categoryId: data.categoryId ? Number(data.categoryId) : undefined,
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
          <DialogTitle>Editar ganho fixo (futuro)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Dia do mês</Label>
              <Input type="number" min={1} max={28} {...register("dayOfMonth")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={String(item.accountId)} onValueChange={(val) => setValue("accountId", Number(val))}>
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
            <Select value={item.categoryId ? String(item.categoryId) : undefined} onValueChange={(val) => setValue("categoryId", Number(val))}>
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

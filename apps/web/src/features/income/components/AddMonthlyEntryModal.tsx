import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import { useCreateIncomeEntry } from "../hooks/use-income";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Informe a descrição"),
  amount: z.coerce.number().positive("Informe um valor válido"),
  accountId: z.coerce.number(),
  categoryId: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});

type FormValues = z.infer<typeof formSchema>;

export function AddMonthlyEntryModal({
  defaultYear,
  triggerClassName,
}: {
  defaultYear: number;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateIncomeEntry();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: defaultYear,
    },
  });

  const incomeCategories = (categories ?? []).filter((cat) => cat.type === "income");

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        name: data.name,
        amount: data.amount.toString(),
        accountId: Number(data.accountId),
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        month: data.month,
        year: data.year,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset({
            month: new Date().getMonth() + 1,
            year: data.year,
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2", triggerClassName)}>
          <Plus className="h-4 w-4" />
          Nova entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Nova entrada mensal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input placeholder="Ex: Salário" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Valor</Label>
            <Input type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                defaultValue={String(new Date().getMonth() + 1)}
                onValueChange={(val) => setValue("month", Number(val))}
              >
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
            <Select onValueChange={(val) => setValue("accountId", Number(val))}>
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
            <Select onValueChange={(val) => setValue("categoryId", Number(val))}>
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

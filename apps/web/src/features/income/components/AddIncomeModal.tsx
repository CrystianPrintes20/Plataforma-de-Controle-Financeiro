import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTransactionSchema } from "@shared/schema";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useAccounts } from "@/features/accounts";
import { useCategories } from "@/features/categories";
import { useCreateIncome } from "../hooks/use-income";
import { Plus } from "lucide-react";
import { useMoneyFormatter } from "@/shared";
import { useToast } from "@/shared/hooks/use-toast";

const formSchema = insertTransactionSchema.extend({
  amount: z.coerce.number().positive("Informe um valor válido"),
  accountId: z.coerce.number().positive("Conta obrigatória"),
  categoryId: z.coerce.number().optional(),
  date: z.coerce.date(),
}).omit({ type: true, userId: true });

type FormValues = z.infer<typeof formSchema>;

export function AddIncomeModal() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateIncome();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { formatter } = useMoneyFormatter();
  const [amountInput, setAmountInput] = useState("");
  const { toast } = useToast();

  const { control, register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const formattedAmount = useMemo(() => {
    if (!amountInput) return "";
    const numeric = Number(amountInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [amountInput, formatter]);

  const handleAmountChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    setAmountInput(onlyDigits);
    const numeric = Number(onlyDigits) / 100;
    setValue("amount", Number.isNaN(numeric) ? 0 : numeric, { shouldValidate: true, shouldDirty: true });
  };

  const incomeCategories = (categories ?? []).filter((cat) => cat.type === "income");

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        ...data,
        type: "income",
        amount: data.amount.toString(),
        accountId: Number(data.accountId),
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        date: data.date,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          setAmountInput("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Plus className="h-4 w-4" />
          Novo ganho
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Adicionar ganho</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit, (formErrors) => {
            const missingAccount = !!formErrors.accountId;
            const missingAmount = !!formErrors.amount;
            const description = [
              missingAccount ? "Selecione a conta" : null,
              missingAmount ? "Informe um valor" : null,
            ]
              .filter(Boolean)
              .join(" e ");

            toast({
              title: "Campos obrigatórios",
              description: description || "Revise os campos antes de salvar.",
              variant: "destructive",
            });
          })}
          className="space-y-4 pt-2"
        >
          <input type="hidden" {...register("amount")} />
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input placeholder="Ex: Salário" {...register("description")} />
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
              <Input type="date" {...register("date", { valueAsDate: true })} />
              {errors.date && <p className="text-xs text-destructive">Data obrigatória</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Controller
              control={control}
              name="accountId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
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
              )}
            />
            {errors.accountId && <p className="text-xs text-destructive">Conta obrigatória</p>}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
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
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

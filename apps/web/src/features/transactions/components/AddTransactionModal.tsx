import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTransactionSchema } from "@shared/schema";
import { useCreateTransaction } from "@/features/transactions";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useState } from "react";
import { Plus } from "lucide-react";

const formSchema = insertTransactionSchema.extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  accountId: z.coerce.number(),
  categoryId: z.coerce.number().optional(),
  date: z.coerce.date(),
}).omit({ userId: true });

type FormValues = z.infer<typeof formSchema>;

export function AddTransactionModal() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateTransaction();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      date: new Date(),
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        ...data,
        amount: data.amount.toString(),
      },
      {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    }
    );
  };

  const type = watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Plus className="h-4 w-4" />
          Adicionar transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select onValueChange={(val) => setValue("type", val as any)} defaultValue="expense">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input type="number" step="0.01" className="pl-7" {...register("amount")} />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
              <Label>Data</Label>
            <Input type="date" {...register("date", { valueAsDate: true })} />
          </div>

          <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Ex: Supermercado" {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
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
              {errors.accountId && <p className="text-xs text-destructive">Conta obrigatória</p>}
          </div>

          {type !== "transfer" && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select onValueChange={(val) => setValue("categoryId", Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.filter(c => c.type === type).map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

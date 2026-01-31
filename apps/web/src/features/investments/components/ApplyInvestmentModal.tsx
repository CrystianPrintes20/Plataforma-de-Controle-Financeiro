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
import { useApplyInvestment } from "../hooks/use-investments";
import { ArrowDownRight } from "lucide-react";
import type { Investment } from "@shared/schema";

const formSchema = z.object({
  accountId: z.coerce.number(),
  amount: z.coerce.number().positive("Informe um valor válido"),
  date: z.coerce.date(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ApplyInvestmentModal({ investment }: { investment: Investment }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useApplyInvestment();
  const { data: accounts } = useAccounts();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        investmentId: investment.id,
        accountId: Number(data.accountId),
        amount: data.amount,
        date: data.date,
        description: data.description,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Aplicar investimento">
          <ArrowDownRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Aplicar investimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Conta origem</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" {...register("date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input placeholder={`Aplicar em ${investment.name}`} {...register("description")} />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Aplicar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

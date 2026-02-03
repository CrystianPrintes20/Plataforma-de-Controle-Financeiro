import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Plus } from "lucide-react";
import { useMoneyFormatter } from "@/shared";
import { api } from "@shared/routes";
import { apiSend } from "@/shared/lib/api";
import { useInvestments } from "../hooks/use-investments";
import { useToast } from "@/shared/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/shared/lib/utils";

const formSchema = z.object({
  investmentId: z.coerce.number(),
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12),
  value: z.coerce.number().positive("Informe um valor válido"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddInvestmentEntryModal({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const { data: investments } = useInvestments();
  const { formatter, currency } = useMoneyFormatter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [valueInput, setValueInput] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  });

  const formattedValue = useMemo(() => {
    if (!valueInput) return "";
    const numeric = Number(valueInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [valueInput, formatter]);

  const handleValueChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    setValueInput(onlyDigits);
    const numeric = Number(onlyDigits) / 100;
    setValue("value", Number.isNaN(numeric) ? 0 : numeric);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await apiSend(api.investments.entries.create.path, "POST", api.investments.entries.create.responses[201], {
        investmentId: data.investmentId,
        year: data.year,
        month: data.month,
        value: String(data.value),
      });

      await queryClient.invalidateQueries({ queryKey: [api.investments.entries.list.path] });
      await queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });

      toast({ title: "Histórico adicionado", description: "Entrada registrada com sucesso." });
      setOpen(false);
      reset({ year: data.year, month: data.month });
      setValueInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("gap-2", triggerClassName)}>
          <Plus className="h-4 w-4" />
          Adicionar histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar histórico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("value")} />

          <div className="space-y-2">
            <Label>Instituição</Label>
            <Select onValueChange={(val) => setValue("investmentId", Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o investimento" />
              </SelectTrigger>
              <SelectContent>
                {investments?.map((inv) => (
                  <SelectItem key={inv.id} value={String(inv.id)}>
                    {inv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.investmentId && <p className="text-xs text-destructive">Selecione uma instituição</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" {...register("year")} />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select defaultValue={String(new Date().getMonth() + 1)} onValueChange={(val) => setValue("month", Number(val))}>
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
              {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor ({currency})</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formattedValue}
              onChange={(event) => handleValueChange(event.target.value)}
              placeholder={formatter.format(0)}
            />
            {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
          </div>

          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

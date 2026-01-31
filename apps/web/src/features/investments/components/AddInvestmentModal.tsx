import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Plus } from "lucide-react";
import { useCreateInvestment } from "../hooks/use-investments";
import { useMoneyFormatter } from "@/shared";

const formSchema = z.object({
  name: z.string().min(2, "Informe a instituição"),
  currentValue: z.coerce.number().positive("Informe um saldo válido"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddInvestmentModal() {
  const [open, setOpen] = useState(false);
  const { currency, formatter } = useMoneyFormatter();
  const [amountInput, setAmountInput] = useState("");
  const { mutate, isPending } = useCreateInvestment();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
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
    setValue("currentValue", Number.isNaN(numeric) ? 0 : numeric);
  };

  const parsedAmount = () => {
    const numeric = Number(amountInput) / 100;
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const onSubmit = (data: FormValues) => {
    const amountValue = parsedAmount();
    mutate(
      {
        name: data.name,
        currentValue: amountValue.toString(),
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
          Adicionar saldo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Saldo por instituição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("currentValue")} />
          <div className="space-y-2">
            <Label>Instituição</Label>
            <Input placeholder="Ex: Nubank, XP, Banco do Brasil" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Saldo atual ({currency})</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                className="pr-3"
                value={formattedAmount}
                onChange={(event) => handleAmountChange(event.target.value)}
                placeholder={formatter.format(0)}
              />
            </div>
            {errors.currentValue && (
              <p className="text-xs text-destructive">{errors.currentValue.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

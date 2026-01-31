import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertInvestmentSchema, type Investment } from "@shared/schema";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useUpdateInvestment } from "../hooks/use-investments";
import { useMoneyFormatter } from "@/shared";

const formSchema = insertInvestmentSchema.extend({
  name: z.string().min(2, "Informe a instituição"),
  currentValue: z.coerce.number().positive("Informe um saldo válido"),
}).omit({ type: true, initialAmount: true, userId: true, quantity: true, ticker: true });

type FormValues = z.infer<typeof formSchema>;

export function EditInvestmentModal({
  investment,
  open,
  onOpenChange,
}: {
  investment: Investment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateInvestment();
  const { formatter } = useMoneyFormatter();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: investment.name,
      currentValue: Number(investment.currentValue),
    },
  });

  useEffect(() => {
    reset({
      name: investment.name,
      currentValue: Number(investment.currentValue),
    });
  }, [investment, reset]);

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        id: investment.id,
        payload: {
          name: data.name,
          currentValue: data.currentValue.toString(),
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Editar instituição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Instituição</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Saldo atual</Label>
            <Input
              type="number"
              step="0.01"
              {...register("currentValue")}
              placeholder={formatter.format(Number(investment.currentValue))}
              onChange={(event) => {
                const value = event.target.value;
                setValue("currentValue", Number(value));
              }}
            />
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

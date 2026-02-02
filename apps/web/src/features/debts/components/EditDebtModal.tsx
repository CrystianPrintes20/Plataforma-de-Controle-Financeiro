import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useMoneyFormatter } from "@/shared";
import { useUpdateDebt } from "../hooks/use-debts";
import type { Debt } from "@shared/schema";

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? undefined : numeric;
  }, schema.optional());

const formSchema = z.object({
  name: z.string().min(2, "Informe a descrição"),
  totalAmount: z.coerce.number().positive("Informe o valor total"),
  remainingAmount: z.coerce.number().min(0, "Informe o saldo restante"),
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12),
  interestRate: optionalNumber(z.number().min(0)),
  dueDate: optionalNumber(z.number().int().min(1).max(31)),
  minPayment: optionalNumber(z.number().min(0)),
  status: z.enum(["active", "paid", "defaulted"]).default("active"),
});

type FormValues = z.infer<typeof formSchema>;

export function EditDebtModal({
  debt,
  open,
  onOpenChange,
}: {
  debt: Debt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { formatter, currency } = useMoneyFormatter();
  const { mutate, isPending } = useUpdateDebt();
  const [totalInput, setTotalInput] = useState("");
  const [remainingInput, setRemainingInput] = useState("");
  const [minPaymentInput, setMinPaymentInput] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: debt.name,
      totalAmount: Number(debt.totalAmount),
      remainingAmount: Number(debt.remainingAmount),
      year: debt.year ?? new Date().getFullYear(),
      month: debt.month ?? new Date().getMonth() + 1,
      interestRate: debt.interestRate ? Number(debt.interestRate) : undefined,
      dueDate: debt.dueDate ?? undefined,
      minPayment: debt.minPayment ? Number(debt.minPayment) : undefined,
      status: (debt.status as FormValues["status"]) ?? "active",
    },
  });

  const statusValue = watch("status");

  useEffect(() => {
    reset({
      name: debt.name,
      totalAmount: Number(debt.totalAmount),
      remainingAmount: Number(debt.remainingAmount),
      year: debt.year ?? new Date().getFullYear(),
      month: debt.month ?? new Date().getMonth() + 1,
      interestRate: debt.interestRate ? Number(debt.interestRate) : undefined,
      dueDate: debt.dueDate ?? undefined,
      minPayment: debt.minPayment ? Number(debt.minPayment) : undefined,
      status: (debt.status as FormValues["status"]) ?? "active",
    });

    const totalDigits = Number.isNaN(Number(debt.totalAmount))
      ? ""
      : Math.round(Number(debt.totalAmount) * 100).toString();
    const remainingDigits = Number.isNaN(Number(debt.remainingAmount))
      ? ""
      : Math.round(Number(debt.remainingAmount) * 100).toString();
    const minDigits = debt.minPayment
      ? Math.round(Number(debt.minPayment) * 100).toString()
      : "";

    setTotalInput(totalDigits);
    setRemainingInput(remainingDigits);
    setMinPaymentInput(minDigits);
  }, [debt, reset]);

  const formattedTotal = useMemo(() => {
    if (!totalInput) return "";
    const numeric = Number(totalInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [totalInput, formatter]);

  const formattedRemaining = useMemo(() => {
    if (!remainingInput) return "";
    const numeric = Number(remainingInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [remainingInput, formatter]);

  const formattedMinPayment = useMemo(() => {
    if (!minPaymentInput) return "";
    const numeric = Number(minPaymentInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [minPaymentInput, formatter]);

  const handleRequiredAmountChange = (value: string, setter: (val: string) => void, field: keyof FormValues) => {
    const onlyDigits = value.replace(/\D/g, "");
    setter(onlyDigits);
    const numeric = Number(onlyDigits) / 100;
    setValue(field, Number.isNaN(numeric) ? 0 : numeric as any);
  };

  const handleOptionalAmountChange = (value: string, setter: (val: string) => void, field: keyof FormValues) => {
    const onlyDigits = value.replace(/\D/g, "");
    setter(onlyDigits);
    if (!onlyDigits) {
      setValue(field, undefined as any);
      return;
    }
    const numeric = Number(onlyDigits) / 100;
    setValue(field, Number.isNaN(numeric) ? undefined : numeric as any);
  };

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        id: debt.id,
        payload: {
          name: data.name,
          totalAmount: data.totalAmount.toString(),
          remainingAmount: data.remainingAmount.toString(),
          year: data.year,
          month: data.month,
          interestRate: data.interestRate !== undefined ? data.interestRate.toString() : undefined,
          dueDate: data.dueDate,
          minPayment: data.minPayment !== undefined ? data.minPayment.toString() : undefined,
          status: data.status,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar dívida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("totalAmount")} />
          <input type="hidden" {...register("remainingAmount")} />
          <input type="hidden" {...register("minPayment")} />
          <input type="hidden" {...register("status")} />
          <input type="hidden" {...register("month")} />

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor total ({currency})</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formattedTotal}
                onChange={(event) => handleRequiredAmountChange(event.target.value, setTotalInput, "totalAmount")}
                placeholder={formatter.format(0)}
              />
              {errors.totalAmount && <p className="text-xs text-destructive">{errors.totalAmount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Saldo restante ({currency})</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formattedRemaining}
                onChange={(event) => handleRequiredAmountChange(event.target.value, setRemainingInput, "remainingAmount")}
                placeholder={formatter.format(0)}
              />
              {errors.remainingAmount && <p className="text-xs text-destructive">{errors.remainingAmount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" {...register("year")} />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={String(watch("month") ?? debt.month ?? new Date().getMonth() + 1)}
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
              {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Juros % (a.a.)</Label>
              <Input type="number" step="0.01" {...register("interestRate")} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="number" min={1} max={31} {...register("dueDate")} placeholder="Dia" />
            </div>
            <div className="space-y-2">
              <Label>Pagamento mín. ({currency})</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formattedMinPayment}
                onChange={(event) => handleOptionalAmountChange(event.target.value, setMinPaymentInput, "minPayment")}
                placeholder={formatter.format(0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusValue ?? "active"} onValueChange={(val) => setValue("status", val as FormValues["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="defaulted">Inadimplente</SelectItem>
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

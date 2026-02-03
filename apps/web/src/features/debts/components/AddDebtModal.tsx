import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Plus } from "lucide-react";
import { useMoneyFormatter } from "@/shared";
import { useCreateDebt, useCreateDebtsBatch } from "../hooks/use-debts";
import { cn } from "@/shared/lib/utils";
import { useAccounts } from "@/features/accounts";
import { useToast } from "@/shared/hooks/use-toast";

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
  paymentYear: z.coerce.number().min(2000),
  paymentMonth: z.coerce.number().min(1).max(12),
  accountId: optionalNumber(z.number()),
  interestRate: optionalNumber(z.number().min(0)),
  dueDate: optionalNumber(z.number().int().min(1).max(31)),
  minPayment: optionalNumber(z.number().min(0)),
  status: z.enum(["active", "paid", "defaulted"]).default("active"),
  replicate: z.boolean().default(false),
  replicateUntilYear: z.coerce.number().min(2000).optional(),
  replicateUntilMonth: z.coerce.number().min(1).max(12).optional(),
}).superRefine((data, ctx) => {
  if (!data.replicate) return;

  if (!data.replicateUntilYear || !data.replicateUntilMonth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe até quando deve replicar",
      path: ["replicateUntilMonth"],
    });
    return;
  }

  const startIndex = data.year * 12 + (data.month - 1);
  const endIndex = data.replicateUntilYear * 12 + (data.replicateUntilMonth - 1);
  if (endIndex < startIndex) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O mês final deve ser igual ou posterior ao mês da competência",
      path: ["replicateUntilMonth"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export function AddDebtModal({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const { formatter, currency } = useMoneyFormatter();
  const { mutate, isPending } = useCreateDebt();
  const { mutate: mutateBatch, isPending: isBatchPending } = useCreateDebtsBatch();
  const { data: accounts } = useAccounts();
  const { toast } = useToast();
  const [totalInput, setTotalInput] = useState("");
  const [remainingInput, setRemainingInput] = useState("");
  const [minPaymentInput, setMinPaymentInput] = useState("");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "active",
      year: currentYear,
      month: currentMonth,
      paymentYear: nextYear,
      paymentMonth: nextMonth,
      replicate: false,
      replicateUntilYear: currentYear,
      replicateUntilMonth: currentMonth,
    },
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = form;
  const replicate = form.watch("replicate");

  const buildReplicatedPayloads = (data: FormValues) => {
    if (!data.replicateUntilYear || !data.replicateUntilMonth) return [];
    const startIndex = data.year * 12 + (data.month - 1);
    const endIndex = data.replicateUntilYear * 12 + (data.replicateUntilMonth - 1);
    const paymentStartIndex = data.paymentYear * 12 + (data.paymentMonth - 1);
    const paymentOffset = paymentStartIndex - startIndex;
    const payloads = [];

    for (let index = startIndex; index <= endIndex; index += 1) {
      const year = Math.floor(index / 12);
      const month = (index % 12) + 1;
      const paymentIndex = index + paymentOffset;
      const paymentYear = Math.floor(paymentIndex / 12);
      const paymentMonth = ((paymentIndex % 12) + 12) % 12 + 1;

      payloads.push({
        name: data.name,
        totalAmount: data.totalAmount.toString(),
        remainingAmount: data.remainingAmount.toString(),
        year,
        month,
        paymentYear,
        paymentMonth,
        accountId: data.accountId,
        interestRate: data.interestRate !== undefined ? data.interestRate.toString() : undefined,
        dueDate: data.dueDate,
        minPayment: data.minPayment !== undefined ? data.minPayment.toString() : undefined,
        status: data.status,
      });
    }

    return payloads;
  };

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
    if (data.replicate) {
      const payloads = buildReplicatedPayloads(data);
      if (!payloads.length) {
        toast({
          title: "Replicação inválida",
          description: "Informe o período para replicar a dívida.",
          variant: "destructive",
        });
        return;
      }

      mutateBatch(payloads, {
        onSuccess: () => {
          setOpen(false);
          reset({ status: "active", replicate: false });
          setTotalInput("");
          setRemainingInput("");
          setMinPaymentInput("");
        },
      });
      return;
    }

    mutate(
      {
        name: data.name,
        totalAmount: data.totalAmount.toString(),
        remainingAmount: data.remainingAmount.toString(),
        year: data.year,
        month: data.month,
        paymentYear: data.paymentYear,
        paymentMonth: data.paymentMonth,
        accountId: data.accountId,
        interestRate: data.interestRate !== undefined ? data.interestRate.toString() : undefined,
        dueDate: data.dueDate,
        minPayment: data.minPayment !== undefined ? data.minPayment.toString() : undefined,
        status: data.status,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset({ status: "active" });
          setTotalInput("");
          setRemainingInput("");
          setMinPaymentInput("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2", triggerClassName)}>
          <Plus className="h-4 w-4" />
          Nova dívida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nova dívida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("totalAmount")} />
          <input type="hidden" {...register("remainingAmount")} />
          <input type="hidden" {...register("minPayment")} />
          <input type="hidden" {...register("status")} />
          <input type="hidden" {...register("month")} />
          <input type="hidden" {...register("accountId")} />
          <input type="hidden" {...register("paymentMonth")} />
          <input type="hidden" {...register("paymentYear")} />
          <input type="hidden" {...register("replicate")} />

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input placeholder="Ex: Cartão de crédito" {...register("name")} />
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
              <Label>Ano (competência)</Label>
              <Input type="number" {...register("year")} />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mês (competência)</Label>
              <Select defaultValue={String(currentMonth)} onValueChange={(val) => setValue("month", Number(val))}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano de pagamento</Label>
              <Input type="number" {...register("paymentYear")} />
              {errors.paymentYear && <p className="text-xs text-destructive">{errors.paymentYear.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mês de pagamento</Label>
              <Select
                defaultValue={String(nextMonth)}
                onValueChange={(val) => setValue("paymentMonth", Number(val))}
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
              {errors.paymentMonth && <p className="text-xs text-destructive">{errors.paymentMonth.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta (opcional)</Label>
            <Select onValueChange={(val) => setValue("accountId", val === "0" ? undefined : Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sem conta</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select defaultValue="active" onValueChange={(val) => setValue("status", val as FormValues["status"])}>
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

          <div className="rounded-lg border border-dashed p-3 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Replicar dívida</Label>
                <p className="text-xs text-muted-foreground">
                  Repete o mesmo valor em vários meses.
                </p>
              </div>
              <Switch
                checked={replicate}
                onCheckedChange={(checked) => setValue("replicate", checked)}
              />
            </div>

            {replicate && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Replicar até (ano)</Label>
                  <Input type="number" {...register("replicateUntilYear")} />
                  {errors.replicateUntilYear && (
                    <p className="text-xs text-destructive">{errors.replicateUntilYear.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Replicar até (mês)</Label>
                  <Select
                    defaultValue={String(currentMonth)}
                    onValueChange={(val) => setValue("replicateUntilMonth", Number(val))}
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
                {errors.replicateUntilMonth && (
                  <p className="text-xs text-destructive">{errors.replicateUntilMonth.message}</p>
                )}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending || isBatchPending}>
            {isPending || isBatchPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

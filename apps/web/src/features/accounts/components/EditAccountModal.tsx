import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAccountSchema, type Account } from "@shared/schema";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useUpdateAccount } from "../hooks/use-accounts";
import { useMoneyFormatter } from "@/shared";

const formSchema = insertAccountSchema.extend({
  balance: z.coerce.number(),
  limit: z.coerce.number().optional(),
}).omit({ userId: true });

type FormValues = z.infer<typeof formSchema>;

export function EditAccountModal({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useUpdateAccount();
  const { formatter } = useMoneyFormatter();
  const [amountInput, setAmountInput] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      limit: account.limit ? Number(account.limit) : undefined,
      color: account.color ?? undefined,
    },
  });

  useEffect(() => {
    reset({
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      limit: account.limit ? Number(account.limit) : undefined,
      color: account.color ?? undefined,
    });
    const asNumber = Number(account.balance);
    const initialDigits = Number.isNaN(asNumber) ? "" : Math.round(asNumber * 100).toString();
    setAmountInput(initialDigits);
  }, [account, reset]);

  const formattedAmount = useMemo(() => {
    if (!amountInput) return "";
    const numeric = Number(amountInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [amountInput, formatter]);

  const handleAmountChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    setAmountInput(onlyDigits);
    const numeric = Number(onlyDigits) / 100;
    setValue("balance", Number.isNaN(numeric) ? 0 : numeric);
  };

  const onSubmit = (data: FormValues) => {
    mutate(
      {
        id: account.id,
        payload: {
          ...data,
          balance: data.balance?.toString(),
          limit: data.limit !== undefined ? data.limit.toString() : undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nome da conta</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select onValueChange={(val) => setValue("type", val as any)} value={account.type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="credit">Cartão de crédito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Saldo</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formattedAmount}
                onChange={(event) => handleAmountChange(event.target.value)}
                placeholder={formatter.format(0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Limite (opcional)</Label>
            <Input type="number" step="0.01" {...register("limit")} />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useMoneyFormatter } from "@/shared";
import { useUpdateInvestmentEntry } from "../hooks/use-investments";
import { Pencil } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const formSchema = z.object({
  value: z.coerce.number().positive("Informe um valor válido"),
});

type FormValues = z.infer<typeof formSchema>;

export function EditInvestmentEntryModal({
  entryId,
  currentValue,
  label,
  triggerClassName,
}: {
  entryId: number;
  currentValue: number;
  label: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const { formatter, currency } = useMoneyFormatter();
  const { mutate, isPending } = useUpdateInvestmentEntry();
  const [valueInput, setValueInput] = useState("");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: currentValue },
  });

  const formattedValue = useMemo(() => {
    if (!valueInput) return formatter.format(currentValue);
    const numeric = Number(valueInput) / 100;
    return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
  }, [valueInput, formatter, currentValue]);

  const handleValueChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    setValueInput(onlyDigits);
    const numeric = Number(onlyDigits) / 100;
    setValue("value", Number.isNaN(numeric) ? 0 : numeric);
  };

  const onSubmit = (data: FormValues) => {
    mutate(
      { id: entryId, payload: { value: data.value } },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-8 w-8", triggerClassName)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Editar {label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register("value")} />
          <div className="space-y-2">
            <Label>Valor ({currency})</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formattedValue}
              onChange={(event) => handleValueChange(event.target.value)}
              placeholder={formatter.format(currentValue)}
            />
            {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

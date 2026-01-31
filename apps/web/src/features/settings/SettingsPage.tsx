import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useCurrency, useUpdateCurrency } from "@/shared/hooks/use-currency";
import { useToast } from "@/shared/hooks/use-toast";

export default function SettingsPage() {
  const { data } = useCurrency();
  const { mutate, isPending } = useUpdateCurrency();
  const { toast } = useToast();

  const handleChange = (value: "BRL" | "USD") => {
    mutate(value, {
      onSuccess: () => {
        toast({ title: "Moeda atualizada", description: `Agora usando ${value}.` });
      },
      onError: (err) => {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Defina a moeda global do sistema.</p>
      </div>

      <Card className="border-border/50 shadow-sm max-w-xl">
        <CardHeader>
          <CardTitle>Moeda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Select
              value={data?.currency ?? "BRL"}
              onValueChange={(val) => handleChange(val as "BRL" | "USD")}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

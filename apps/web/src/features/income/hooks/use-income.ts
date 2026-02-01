import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiGet, apiSend } from "@/shared/lib/api";
import { useToast } from "@/shared/hooks/use-toast";

type IncomeEntryInput = {
  name: string;
  amount: string | number;
  dayOfMonth: number;
  month: number;
  year: number;
  accountId: number;
  categoryId?: number;
};

export function useIncomeEntries() {
  return useQuery({
    queryKey: [api.income.entries.list.path],
    queryFn: async () => apiGet(api.income.entries.list.path, api.income.entries.list.responses[200]),
  });
}

export function useCreateIncomeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: IncomeEntryInput) => {
      const formatted = {
        ...data,
        amount: String(data.amount),
      };
      return apiSend(
        api.income.entries.create.path,
        "POST",
        api.income.entries.create.responses[201],
        formatted
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.entries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });
      toast({ title: "Entrada criada", description: "Registro salvo." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateIncomeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<IncomeEntryInput> }) => {
      const formatted = {
        ...payload,
        amount: payload.amount !== undefined ? String(payload.amount) : undefined,
      };
      const url = buildUrl(api.income.entries.update.path, { id });
      return apiSend(url, "PUT", api.income.entries.update.responses[200], formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.entries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });
      toast({ title: "Entrada atualizada", description: "Registro mensal atualizado." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteIncomeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.income.entries.delete.path, { id });
      await apiSend(url, "DELETE", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.entries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });
      toast({ title: "Entrada removida", description: "Registro mensal removido." });
    },
  });
}

export function useAnnualIncome(year?: number) {
  return useQuery({
    queryKey: [api.income.annual.get.path, year],
    queryFn: async () => {
      const url = new URL(api.income.annual.get.path, window.location.origin);
      if (year) url.searchParams.set("year", String(year));
      return apiGet(url.toString(), api.income.annual.get.responses[200]);
    },
  });
}

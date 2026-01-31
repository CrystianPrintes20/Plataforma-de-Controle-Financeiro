import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/features/transactions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiGet, apiSend } from "@/shared/lib/api";
import { useToast } from "@/shared/hooks/use-toast";

type FixedIncomeInput = {
  name: string;
  amount: string | number;
  dayOfMonth: number;
  accountId: number;
  categoryId?: number;
};

export function useIncomeTransactions() {
  return useTransactions({ type: "income" });
}

export function useCreateIncome() {
  return useCreateTransaction();
}

export function useUpdateIncome() {
  return useUpdateTransaction();
}

export function useDeleteIncome() {
  return useDeleteTransaction();
}

export function useFixedIncomes() {
  return useQuery({
    queryKey: [api.income.fixed.list.path],
    queryFn: async () => apiGet(api.income.fixed.list.path, api.income.fixed.list.responses[200]),
  });
}

export function useCreateFixedIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: FixedIncomeInput) => {
      const formatted = {
        ...data,
        amount: String(data.amount),
      };
      return apiSend(
        api.income.fixed.create.path,
        "POST",
        api.income.fixed.create.responses[201],
        formatted
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.fixed.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });
      toast({ title: "Ganho fixo criado", description: "Registro salvo." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateFixedIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<FixedIncomeInput> }) => {
      const formatted = {
        ...payload,
        amount: payload.amount !== undefined ? String(payload.amount) : undefined,
      };
      const url = buildUrl(api.income.fixed.update.path, { id });
      return apiSend(url, "PUT", api.income.fixed.update.responses[200], formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.fixed.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });
      toast({ title: "Ganho fixo atualizado", description: "Atualiza meses futuros." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteFixedIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.income.fixed.delete.path, { id });
      await apiSend(url, "DELETE", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.income.fixed.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.income.annual.get.path] });
      toast({ title: "Ganho fixo removido", description: "Não contará nos próximos meses." });
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

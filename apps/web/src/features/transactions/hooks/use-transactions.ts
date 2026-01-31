import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTransaction } from "@shared/schema";
import { useToast } from "@/shared/hooks/use-toast";
import { apiGet, apiSend } from "@/shared/lib/api";

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  categoryId?: number;
  type?: "income" | "expense" | "transfer";
};

type ClientInsertTransaction = Omit<InsertTransaction, "userId">;
type ClientUpdateTransaction = Partial<Omit<InsertTransaction, "userId">>;

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [api.transactions.list.path, filters],
    queryFn: async () => {
      const url = new URL(api.transactions.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) url.searchParams.append(key, String(value));
        });
      }
      return apiGet(url.toString(), api.transactions.list.responses[200]);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ClientInsertTransaction) => {
      const formattedData = {
        ...data,
        amount: String(data.amount),
        accountId: Number(data.accountId),
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        date: data.date instanceof Date ? data.date.toISOString() : data.date,
      };

      return apiSend(
        api.transactions.create.path,
        "POST",
        api.transactions.create.responses[201],
        formattedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Transação criada", description: "Transação registrada com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ClientUpdateTransaction }) => {
      const formattedData = {
        ...payload,
        amount: payload.amount !== undefined ? String(payload.amount) : undefined,
        accountId: payload.accountId !== undefined ? Number(payload.accountId) : undefined,
        categoryId: payload.categoryId ? Number(payload.categoryId) : undefined,
        date:
          payload.date instanceof Date
            ? payload.date.toISOString()
            : payload.date,
      };

      const url = buildUrl(api.transactions.update.path, { id });
      return apiSend(url, "PUT", api.transactions.update.responses[200], formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Atualizado", description: "Transação atualizada com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.transactions.delete.path, { id });
      await apiSend(url, "DELETE", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Transação removida", description: "Transação removida com sucesso." });
    },
  });
}

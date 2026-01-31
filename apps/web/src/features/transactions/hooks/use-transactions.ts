import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTransaction } from "@shared/schema";
import { useToast } from "@/shared/hooks/use-toast";
import { apiGet, apiSend } from "@/shared/lib/api";

type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  accountId?: number;
  categoryId?: number;
  type?: "income" | "expense" | "transfer";
};

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
    mutationFn: async (data: InsertTransaction) => {
      const formattedData = {
        ...data,
        amount: String(data.amount),
        accountId: Number(data.accountId),
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        date: new Date(data.date).toISOString(), // Ensure date is ISO string
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
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] }); // Balances change
      toast({ title: "Transaction Added", description: "Transaction recorded successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
      toast({ title: "Transaction Deleted", description: "Transaction removed successfully." });
    },
  });
}

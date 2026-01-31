import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAccount } from "@shared/schema";
import { useToast } from "@/shared/hooks/use-toast";
import { apiGet, apiSend } from "@/shared/lib/api";

export function useAccounts() {
  return useQuery({
    queryKey: [api.accounts.list.path],
    queryFn: async () => {
      return apiGet(api.accounts.list.path, api.accounts.list.responses[200]);
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertAccount) => {
      // Coerce numerics as the form might return strings/numbers mixed
      const formattedData = {
        ...data,
        balance: String(data.balance),
        limit: data.limit ? String(data.limit) : undefined,
      };

      return apiSend(
        api.accounts.create.path,
        "POST",
        api.accounts.create.responses[201],
        formattedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Account Created", description: "Your account has been successfully added." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.accounts.delete.path, { id });
      await apiSend(url, "DELETE", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      toast({ title: "Account Deleted", description: "The account has been removed." });
    },
  });
}

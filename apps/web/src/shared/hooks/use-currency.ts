import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiGet, apiSend } from "@/shared/lib/api";

export function useCurrency() {
  return useQuery({
    queryKey: [api.settings.currency.path],
    queryFn: async () => {
      return apiGet(api.settings.currency.path, api.settings.currency.responses[200]);
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currency: "BRL" | "USD") => {
      return apiSend(
        api.settings.currency.path,
        "PUT",
        api.settings.currency.responses[200],
        { currency }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.currency.path] });
    },
  });
}

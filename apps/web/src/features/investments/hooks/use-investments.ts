import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/shared/hooks/use-toast";
import { apiGet, apiSend } from "@/shared/lib/api";

export function useInvestments() {
  return useQuery({
    queryKey: [api.investments.list.path],
    queryFn: async () => {
      return apiGet(api.investments.list.path, api.investments.list.responses[200]);
    },
  });
}

type CreateInvestmentInput = {
  name: string;
  currentValue: string | number;
};

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateInvestmentInput) => {
      const formattedData = {
        name: data.name,
        type: "other",
        initialAmount: String(data.currentValue),
        currentValue: String(data.currentValue),
      };

      return apiSend(
        api.investments.create.path,
        "POST",
        api.investments.create.responses[201],
        formattedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({ title: "Investimento criado", description: "Saldo registrado com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

type UpdateInvestmentInput = {
  id: number;
  payload: {
    name?: string;
    currentValue?: string | number;
  };
};

export function useUpdateInvestment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: UpdateInvestmentInput) => {
      const formattedData = {
        ...payload,
        currentValue: payload.currentValue !== undefined ? String(payload.currentValue) : undefined,
      };
      const url = buildUrl(api.investments.update.path, { id });
      return apiSend(url, "PUT", api.investments.update.responses[200], formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({ title: "Atualizado", description: "Investimento atualizado." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.investments.delete.path, { id });
      await apiSend(url, "DELETE", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.investments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({ title: "Removido", description: "Investimento removido." });
    },
  });
}

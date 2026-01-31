import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertCategory } from "@shared/schema";
import { useToast } from "@/shared/hooks/use-toast";
import { apiGet, apiSend } from "@/shared/lib/api";

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      return apiGet(api.categories.list.path, api.categories.list.responses[200]);
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCategory) => {
      const formattedData = {
        ...data,
        budget: data.budget ? String(data.budget) : undefined,
      };

      return apiSend(
        api.categories.create.path,
        "POST",
        api.categories.create.responses[201],
        formattedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
      toast({ title: "Categoria criada", description: "Categoria adicionada com sucesso." });
    },
  });
}

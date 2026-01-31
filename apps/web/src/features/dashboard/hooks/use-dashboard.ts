import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiGet } from "@/shared/lib/api";

export function useDashboard() {
  return useQuery({
    queryKey: [api.dashboard.get.path],
    queryFn: async () => {
      return apiGet(api.dashboard.get.path, api.dashboard.get.responses[200]);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiGet, apiSend } from "@/shared/lib/api";
import { useToast } from "@/shared/hooks/use-toast";

export function useDebts() {
  return useQuery({
    queryKey: [api.debts.list.path],
    queryFn: async () => apiGet(api.debts.list.path, api.debts.list.responses[200]),
  });
}

type DebtPayload = {
  name: string;
  totalAmount: string | number;
  remainingAmount: string | number;
  year: number;
  month: number;
  paymentYear: number;
  paymentMonth: number;
  accountId?: number;
  interestRate?: string | number;
  dueDate?: number;
  minPayment?: string | number;
  status?: "active" | "paid" | "defaulted";
};

const formatDebtPayload = (payload: DebtPayload) => ({
  name: payload.name,
  totalAmount: String(payload.totalAmount),
  remainingAmount: String(payload.remainingAmount),
  year: payload.year,
  month: payload.month,
  paymentYear: payload.paymentYear,
  paymentMonth: payload.paymentMonth,
  accountId: payload.accountId,
  interestRate: payload.interestRate !== undefined ? String(payload.interestRate) : undefined,
  dueDate: payload.dueDate ?? undefined,
  minPayment: payload.minPayment !== undefined ? String(payload.minPayment) : undefined,
  status: payload.status,
});

const formatPartialDebtPayload = (payload: Partial<DebtPayload>) => ({
  ...(payload.name !== undefined ? { name: payload.name } : {}),
  ...(payload.totalAmount !== undefined ? { totalAmount: String(payload.totalAmount) } : {}),
  ...(payload.remainingAmount !== undefined ? { remainingAmount: String(payload.remainingAmount) } : {}),
  ...(payload.year !== undefined ? { year: payload.year } : {}),
  ...(payload.month !== undefined ? { month: payload.month } : {}),
  ...(payload.paymentYear !== undefined ? { paymentYear: payload.paymentYear } : {}),
  ...(payload.paymentMonth !== undefined ? { paymentMonth: payload.paymentMonth } : {}),
  ...(payload.accountId !== undefined ? { accountId: payload.accountId } : {}),
  ...(payload.interestRate !== undefined ? { interestRate: String(payload.interestRate) } : {}),
  ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
  ...(payload.minPayment !== undefined ? { minPayment: String(payload.minPayment) } : {}),
  ...(payload.status !== undefined ? { status: payload.status } : {}),
});

export function useCreateDebt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: DebtPayload) => {
      return apiSend(
        api.debts.create.path,
        "POST",
        api.debts.create.responses[201],
        formatDebtPayload(payload)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({ title: "Dívida criada", description: "Registro salvo com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useCreateDebtsBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payloads: DebtPayload[]) => {
      return Promise.all(
        payloads.map((payload) =>
          apiSend(
            api.debts.create.path,
            "POST",
            api.debts.create.responses[201],
            formatDebtPayload(payload)
          )
        )
      );
    },
    onSuccess: (_data, payloads) => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({
        title: "Dívidas criadas",
        description: `${payloads.length} registros salvos com sucesso.`,
      });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

type UpdateDebtPayload = {
  id: number;
  payload: Partial<DebtPayload>;
};

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: UpdateDebtPayload) => {
      const url = buildUrl(api.debts.update.path, { id });
      return apiSend(
        url,
        "PUT",
        api.debts.update.responses[200],
        formatPartialDebtPayload(payload)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({ title: "Atualizado", description: "Dívida atualizada." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.debts.delete.path, { id });
      await apiSend(url, "DELETE", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.debts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      toast({ title: "Removida", description: "Dívida removida com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

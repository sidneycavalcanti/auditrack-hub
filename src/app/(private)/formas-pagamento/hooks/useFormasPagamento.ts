// src/hooks/useFormasPagamento.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formaPagamentoAPI } from "@/services/api";
import type { FormaPagamento } from "@/types";

export function useFormasPagamento(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["formas-pagamento", filters],
        enabled,
        queryFn: async () => (await formaPagamentoAPI.getAll(filters)).data,
    });
}

export function useFormaPagamento(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["formas-pagamento", id],
        enabled,
        queryFn: async () => (await formaPagamentoAPI.getById(id as number)).data,
    });
}

export function useCreateFormaPagamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<FormaPagamento>) =>
            (await formaPagamentoAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["formas-pagamento"] });
        },
    });
}

export function useUpdateFormaPagamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<FormaPagamento> }) =>
            (await formaPagamentoAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["formas-pagamento"] });
            qc.invalidateQueries({ queryKey: ["formas-pagamento", id] });
        },
    });
}

export function useDeleteFormaPagamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await formaPagamentoAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["formas-pagamento"] });
        },
    });
}
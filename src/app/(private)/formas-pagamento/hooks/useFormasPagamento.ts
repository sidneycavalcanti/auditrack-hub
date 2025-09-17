// src/hooks/useFormasPagamento.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formaPagamentoAPI, handleApiError } from "@/services/api";
import { toast } from "sonner";
import type { FormaPagamento, FilterOptions } from "@/types";

const QUERY_KEY = "formas-pagamento";

export const useFormasPagamento = (filters: FilterOptions = {}) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await formaPagamentoAPI.getAll(filters as any);
            const payload = response.data as any;

            const list: any[] = Array.isArray(payload?.formadepagamento)
                ? payload.formadepagamento
                : Array.isArray(payload?.formadepagamento)
                    ? payload.formadepagamento
                    : [];

            const formadepagamento: FormaPagamento[] = list.map((fp: any) => ({
                id: fp.id,
                name: fp.name,
                situacao: fp.situacao,
                createdAt: fp.createdAt,
            }));

            // Paginação (suporta diversos shapes)
            const total = payload.totalItems ?? payload.total ?? formadepagamento.length;
            const limit = payload.limit ?? filters.limit ?? formadepagamento.length ?? 10;
            const totalPages =
                payload.totalPages ??
                (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters.page ?? 1;

            return { data: formadepagamento, total, totalPages, page, limit };
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
};

export const useFormaPagamento = (id: number) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await formaPagamentoAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreateFormaPagamento = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<FormaPagamento, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await formaPagamentoAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Forma de pagamento criada com sucesso!',
            });
        },
        onError: (error) => {
            const message = handleApiError(error);
            toast.error(
                'Erro', {
                description: message
            });
        },
    });
};

export const useUpdateFormaPagamento = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<FormaPagamento> }) => {
            const response = await formaPagamentoAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ['forma-pagamento'] });
            toast.success(
                'Sucesso', {
                description: 'Forma de pagamento atualizada com sucesso!',
            });
        },
        onError: (error) => {
            const message = handleApiError(error);
            toast.error(
                'Erro', {
                description: message
            });
        },
    });
};

export const useDeleteFormaPagamento = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await formaPagamentoAPI.delete(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Forma de pagamento excluída com sucesso!',
            });
        },
        onError: (error) => {
            const message = handleApiError(error);
            toast.error(
                'Erro', {
                description: message
            });
        },
    });
};
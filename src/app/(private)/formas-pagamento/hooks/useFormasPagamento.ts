// src/hooks/useFormasPagamento.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formaPagamentoAPI, handleApiError } from "@/services/api";
import { toast } from "sonner";
import type { FormaPagamento } from "@/types";

export const useFormasPagamento = (filters?: Record<string, any>) => {
    return useQuery({
        queryKey: ['formas-pagamento', filters],
        queryFn: async () => {
            const response = await formaPagamentoAPI.getAll(filters);
            return response.data.formadepagamento || [];
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useFormaPagamento = (id: number) => {
    return useQuery({
        queryKey: ['forma-pagamento', id],
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
            queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
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
            queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
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
            queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
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
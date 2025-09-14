// src/hooks/useCadAvOperacional.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cadAvOperacionalAPI, handleApiError } from "@/services/api";
import type { CadAvOperacional, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = 'cadAvOperacional';

export const useCadAvOperacional = (filters?: FilterOptions & { q?: string }) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await cadAvOperacionalAPI.getAll(filters as any);
            const payload = response.data as any;

            const items: CadAvOperacional[] = Array.isArray(payload.cadavoperacional)
                ? payload.cadavoperacional.map((item: any) => ({
                    id: item.id,
                    descricao: item.descricao,
                    situacao: item.situacao,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                }))
                : [];

            const total = payload.totalItems ?? payload.total ?? items.length;
            const totalPages = payload.totalPages ?? (filters?.limit ? Math.ceil(total / (filters.limit || 10)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters?.page ?? 1;
            const limit = payload.limit ?? filters?.limit ?? items.length;

            return { data: items, total, totalPages, page, limit };
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
};

export function useCadAvOperacionalById(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["cad-av-operacional", id],
        enabled,
        queryFn: async () => (await cadAvOperacionalAPI.getById(id as number)).data,
    });
}

export const useCreateCadAvOperacional = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<CadAvOperacional>) => {
            const payload = {
                descricao: data.descricao,
                situacao: data.situacao ?? true,
            };
            const response = await cadAvOperacionalAPI.create(payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success('Avaliação operacional criada', { description: 'Registro criado com sucesso.' });
        },
        onError: (error) => {
            toast.error( 'Erro ao criar avaliação operacional', { description: handleApiError(error) });
        },
    });
};

export const useUpdateCadAvOperacional = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<CadAvOperacional> }) => {
            const payload = {
                descricao: data.descricao,
                situacao: data.situacao,
            };
            const response = await cadAvOperacionalAPI.update(id, payload);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            toast.success( 'Avaliação operacional atualizada', { description: 'Registro atualizado com sucesso.' });
        },
        onError: (error) => {
            toast.error( 'Erro ao atualizar avaliação operacional', { description: handleApiError(error) });
        },
    });
};

export const useDeleteCadAvOperacional = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await cadAvOperacionalAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success( 'Avaliação operacional removida', { description: 'Registro excluído com sucesso.' });
        },
        onError: (error) => {
            toast.error( 'Erro ao excluir avaliação operacional', { description: handleApiError(error) });
        },
    });
};
// src/hooks/useCadQuestoes.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cadQuestoesAPI, handleApiError } from "@/services/api";
import type { CadQuestoes, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = 'cadQuestoes';

export const useCadQuestoes = (filters?: FilterOptions & { q?: string; cadavoperacionalId?: number }) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await cadQuestoesAPI.getAll(filters as any);
            const payload = response.data as any;

            const items: CadQuestoes[] = Array.isArray(payload.cadquestoes)
                ? payload.cadquestoes.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    situacao: item.situacao,
                    cadavoperacionalId: item.cadavoperacionalId,
                    cadavoperacional: item.cadavoperacional,
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

export function useCadQuestao(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["cad-questoes", id],
        enabled,
        queryFn: async () => (await cadQuestoesAPI.getById(id as number)).data,
    });
}

export const useCreateCadQuestoes = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<CadQuestoes>) => {
            const payload = {
                name: data.name,
                situacao: data.situacao ?? true,
                cadavoperacionalId: data.cadavoperacionalId,
            };
            const response = await cadQuestoesAPI.create(payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success( 'Questão criada', { description: 'Registro criado com sucesso.' });
        },
        onError: (error) => {
            toast.error( 'Erro ao criar questão', { description: handleApiError(error) });
        },
    });
};

export const useUpdateCadQuestoes = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<CadQuestoes> }) => {
            const payload = {
                name: data.name,
                situacao: data.situacao,
                cadavoperacionalId: data.cadavoperacionalId,
            };
            const response = await cadQuestoesAPI.update(id, payload);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            toast.success( 'Questão atualizada', { description: 'Registro atualizado com sucesso.' });
        },
        onError: (error) => {
            toast.error( 'Erro ao atualizar questão', { description: handleApiError(error) });
        },
    });
};

export const useDeleteCadQuestoes = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await cadQuestoesAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success( 'Questão removida', { description: 'Registro excluído com sucesso.' });
        },
        onError: (error) => {
            toast.error( 'Erro ao excluir questão', { description: handleApiError(error) });
        },
    });
};
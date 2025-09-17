// src/hooks/useCadAvOperacional.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cadAvOperacionalAPI, handleApiError } from "@/services/api";
import { toast } from "sonner";
import type { CadAvOperacional, FilterOptions } from "@/types";

const QUERY_KEY = 'cadavoperacional';

export const useCadAvOperacional = (filters: FilterOptions = {}) => {

    // normaliza paginação e mapeia o termo de busca para chaves que o backend entende
    const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
    };

    const term = (
        filters.search ??
        (filters as any).name ??
        (filters as any).descricao ??
        (filters as any).q
    )?.toString().trim();

    if (term) {
        // principal: este recurso usa "descricao"
        params.descricao = term;
        // compat extra (caso o endpoint também aceite):
        params.q = term;
        params.search = term;
        params.name = term;
    }

    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await cadAvOperacionalAPI.getAll(params);
            const payload = response.data;

            const list: any[] = Array.isArray(payload?.cadavoperacional)
                ? payload.cadavoperacional
                : Array.isArray(payload?.cadavoperacional)
                    ? payload.cadavoperacional
                    : [];

            // aceita diferentes shapes do backend
            const arr: any[] =
                Array.isArray(payload?.cadavoperacional) ? payload.cadavoperacional :
                    Array.isArray(payload?.data) ? payload.data :
                        Array.isArray(payload) ? payload :
                            [];

            const data: CadAvOperacional[] = arr.map((i: any) => ({
                id: i.id,
                descricao: i.descricao ?? i.name ?? "",
                situacao: i.situacao ?? true,
                createdAt: i.createdAt,
                updatedAt: i.updatedAt,
            }));

            const total =
                payload?.totalItems ?? payload?.total ?? data.length;

            const limit =
                payload?.limit ?? params.limit ?? data.length;

            const page =
                payload?.currentPage ?? payload?.page ?? params.page ?? 1;

            const totalPages =
                payload?.totalPages ?? (limit ? Math.max(1, Math.ceil(total / limit)) : 1);

            return { data, total, totalPages, page, limit };
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
            toast.error('Erro ao criar avaliação operacional', { description: handleApiError(error) });
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
            toast.success('Avaliação operacional atualizada', { description: 'Registro atualizado com sucesso.' });
        },
        onError: (error) => {
            toast.error('Erro ao atualizar avaliação operacional', { description: handleApiError(error) });
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
            toast.success('Avaliação operacional removida', { description: 'Registro excluído com sucesso.' });
        },
        onError: (error) => {
            toast.error('Erro ao excluir avaliação operacional', { description: handleApiError(error) });
        },
    });
};
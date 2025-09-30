// FILE: src/app/(private)/motivo-pausas/hooks/useMotivoDePausa.ts
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sexoAPI, handleApiError } from "@/services/api";
import type { Sexo, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = 'cadsexo';

export const useCadSexos = (filters: FilterOptions = {}) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await sexoAPI.getAll(filters as any);
            const payload = response.data as any;

            const list: any[] = Array.isArray(payload?.cadsexo)
                ? payload.cadsexo
                : Array.isArray(payload?.cadsexo)
                    ? payload.cadsexo
                    : [];

            const cadsexo: Sexo[] = list.map((sexo: any) => ({
                id: sexo.id,
                name: sexo.name,
                situacao: sexo.situacao,
                createdAt: sexo.createdAt,
            }));

            // Paginação (suporta diversos shapes)
            const total = payload.totalItems ?? payload.total ?? cadsexo.length;
            const limit = payload.limit ?? filters.limit ?? cadsexo.length ?? 10;
            const totalPages =
                payload.totalPages ??
                (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters.page ?? 1;

            return { data: cadsexo, total, totalPages, page, limit };

        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
};

export const useCadSexo = (id: number) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await sexoAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
    })
}

export const useCreateSexo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Omit<Sexo, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await sexoAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Gênero criado com sucesso',
            }
            );
        },
        onError: (error) => {
            const message = handleApiError(error);
            toast.error(
                'Erro', {
                description: message
            });
        }
    })
}

export const useUpdateSexo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Sexo> }) => {
            const response = await sexoAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Gênero atualizado com sucesso!',
            });
        },
        onError: (error) => {
            const message = handleApiError(error);
            toast.error(
                'Erro', {
                description: message
            });
        },
    })
}

export const useDeleteSexo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await sexoAPI.delete(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Gênero excluído com sucesso!',
            });
        },
        onError: (error) => {
            const message = handleApiError(error);
            toast.error(
                'Erro', {
                description: message
            });
        },
    })
}
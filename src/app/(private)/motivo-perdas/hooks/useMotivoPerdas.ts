// FILE: src/app/(private)/motivo-perdas/hooks/useMotivoPerdas.ts
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motivoPerdaAPI, handleApiError } from "@/services/api";
import type { MotivoPerda, PaginatedResponse, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = "motivoperdas";

export const useMotivoPerdas = (filters: FilterOptions = {}) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await motivoPerdaAPI.getAll(filters as any);
            const payload = response.data as any;

            const list: any[] = Array.isArray(payload?.motivoperdas)
                ? payload.motivoperdas
                : Array.isArray(payload?.motivoperdas)
                    ? payload.motivoperdas
                    : [];

            const motivoperdas: MotivoPerda[] = list.map((motivoperda: any) => ({
                id: motivoperda.id,
                name: motivoperda.name,
                situacao: motivoperda.situacao,
                obs: motivoperda.obs,
                createdAt: motivoperda.createdAt,
            }));

            // Paginação (suporta diversos shapes)
            const total = payload.totalItems ?? payload.total ?? motivoperdas.length;
            const limit = payload.limit ?? filters.limit ?? motivoperdas.length ?? 10;
            const totalPages =
                payload.totalPages ??
                (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters.page ?? 1;

            return { data: motivoperdas, total, totalPages, page, limit };
        },

        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
};

export const useMotivoPerda = (id: number) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await motivoPerdaAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
    })
}

export const useCreateMotivoPerda = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<MotivoPerda, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await motivoPerdaAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Motivo de perda criada com sucesso',
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
    });
};

export const useUpdateMotivoPerda = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<MotivoPerda> }) => {
            const response = await motivoPerdaAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Motivo de perda atualizada com sucesso!',
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

export const useDeleteMotivoPerda = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await motivoPerdaAPI.delete(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Motivo de perda excluída com sucesso!',
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


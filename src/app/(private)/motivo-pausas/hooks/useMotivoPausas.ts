// FILE: src/app/(private)/motivo-pausas/hooks/useMotivoDePausa.ts
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motivoDePausaAPI, handleApiError } from "@/services/api";
import type { MotivoDepausa, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = 'motivodepausa';

export const useMotivoDePausas = (filters: FilterOptions = {}) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await motivoDePausaAPI.getAll(filters as any);
            const payload = response.data as any;

            const list: any[] = Array.isArray(payload?.motivodepausa)
                ? payload.motivodepausa
                : Array.isArray(payload?.motivodepausa)
                    ? payload.motivodepausa
                    : [];

            const motivodepausa: MotivoDepausa[] = list.map((mPausa: any) => ({
                id: mPausa.id,
                name: mPausa.name,
                situacao: mPausa.situacao,
                createdAt: mPausa.createdAt,
            }));

            // Paginação (suporta diversos shapes)
            const total = payload.totalItems ?? payload.total ?? motivodepausa.length;
            const limit = payload.limit ?? filters.limit ?? motivodepausa.length ?? 10;
            const totalPages =
                payload.totalPages ??
                (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters.page ?? 1;

            return { data: motivodepausa, total, totalPages, page, limit };

        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
};

export const useMotivoPausa = (id: number) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await motivoDePausaAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
    })
}

export const useCreateMotivoDepausa = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Omit<MotivoDepausa, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await motivoDePausaAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Motivo de pausa criada com sucesso',
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

export const useUpdateMotivoDepausa = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<MotivoDepausa> }) => {
            const response = await motivoDePausaAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Motivo de pausa atualizada com sucesso!',
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

export const useDeleteMotivoDepausa = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await motivoDePausaAPI.delete(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Sucesso', {
                description: 'Motivo de pausa excluída com sucesso!',
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
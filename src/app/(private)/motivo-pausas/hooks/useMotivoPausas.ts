// FILE: src/app/(private)/motivo-pausas/hooks/useMotivoDePausa.ts
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motivoDePausaAPI } from "@/services/api";
import type { MotivoDepausa, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = 'motivodepausa';

// Tipagem do payload de listagem retornado pela API
type MotivoDePausaResponse = {
    motivodepausa: MotivoDepausa[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
};

function normalizeFilters(filters: FilterOptions = {}) {
    return {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        search: filters.search ?? "",
    };
}

export const useMotivoDePausa = (filters: FilterOptions = {}) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState<string>(filters.search ?? "");

    const normalized = normalizeFilters({ ...filters, search: searchTerm });

    const { data, isLoading, error, refetch } = useQuery<MotivoDePausaResponse>({
        queryKey: [QUERY_KEY, normalized],
        queryFn: async () => {
            const res = await motivoDePausaAPI.getAll(normalized);
            return res.data as MotivoDePausaResponse;
        },
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutos
        placeholderData: (prev) => prev, // mantém a tabela estável ao trocar filtros/página
    });

    const createMotivoDepausa = useMutation({
        mutationFn: async (
            payload: Omit<MotivoDepausa, "id" | "createdAt" | "updatedAt">
        ) => {
            const res = await motivoDePausaAPI.create(payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Motivo de pausa criado com sucesso!");
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.error ?? "Erro ao criar motivo de pausa");
        },
    });

    const updateMotivoDepausa = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: Partial<MotivoDepausa>;
        }) => {
            const res = await motivoDePausaAPI.update(id, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Motivo de pausa atualizado com sucesso!");
        },
        onError: (e: any) => {
            toast.error(
                e?.response?.data?.error ?? "Erro ao atualizar motivo de pausa"
            );
        },
    });

    const deleteMotivoDepausa = useMutation({
        mutationFn: async (id: number) => {
            await motivoDePausaAPI.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Motivo de pausa excluído com sucesso!");
        },
        onError: (e: any) => {
            toast.error(
                e?.response?.data?.error ?? "Erro ao excluir motivo de pausa"
            );
        },
    });

    return {
        // dados
        motivosDePausa: data?.motivodepausa ?? [],
        totalItems: data?.totalItems ?? 0,
        totalPages: data?.totalPages ?? 0,
        currentPage: data?.currentPage ?? 1,

        // estados
        isLoading,
        error,

        // busca
        searchTerm,
        setSearchTerm,
        refetch,

        // mutations
        createMotivoDepausa: createMotivoDepausa.mutateAsync,
        updateMotivoDepausa: updateMotivoDepausa.mutateAsync,
        deleteMotivoDepausa: deleteMotivoDepausa.mutateAsync,
        isCreating: createMotivoDepausa.isPending,
        isUpdating: updateMotivoDepausa.isPending,
        isDeleting: deleteMotivoDepausa.isPending,
    };
};
// FILE: src/app/(private)/motivo-perdas/hooks/useMotivoPerdas.ts
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motivoPerdaAPI } from "@/services/api";
import type { MotivoPerda, PaginatedResponse, FilterOptions } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = "motivoperdas";

/** Normaliza filtros para uma queryKey estável */
function normalizeFilters(filters: FilterOptions = {}) {
    return {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        search: filters.search ?? "",
    };
}

/** Converte qualquer shape da API para o shape PaginatedResponse usado pela UI */
function normalizeResponse(
    raw: any,
    limitFromRequest: number
): PaginatedResponse<MotivoPerda> {
    const data: MotivoPerda[] =
        raw?.motivoperdas ?? raw?.motivoperdas ?? raw?.data ?? [];

    const total =
        raw?.totalItems ?? raw?.total ?? (Array.isArray(data) ? data.length : 0);

    const page = raw?.currentPage ?? raw?.page ?? 1;

    const totalPages =
        raw?.totalPages ??
        (limitFromRequest > 0 ? Math.max(1, Math.ceil(total / limitFromRequest)) : 1);

    return {
        data,
        total,
        totalPages,
        page,
        limit: raw?.limit ?? limitFromRequest,
    };
}

export const useMotivoPerdas = (filters: FilterOptions = {}) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState(filters.search ?? "");

    const normalized = normalizeFilters({ ...filters, search: searchTerm });

    const { data, isLoading, error, refetch } = useQuery<
        PaginatedResponse<MotivoPerda>
    >({
        queryKey: [QUERY_KEY, normalized],
        queryFn: async () => {
            const res = await motivoPerdaAPI.getAll(normalized);
            // console.log("Resposta bruta:", res.data);
            return normalizeResponse(res.data, normalized.limit);
        },
        retry: 2,
        staleTime: 5 * 60 * 1000,
        placeholderData: (prev) => prev,
    });

    const createMotivoPerda = useMutation({
        mutationFn: async (
            payload: Omit<MotivoPerda, "id" | "createdAt" | "updatedAt">
        ) => {
            const res = await motivoPerdaAPI.create(payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Motivo de perda criado com sucesso!");
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.error ?? "Erro ao criar motivo de perda");
        },
    });

    const updateMotivoPerda = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: Partial<MotivoPerda>;
        }) => {
            const res = await motivoPerdaAPI.update(id, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Motivo de perda atualizado com sucesso!");
        },
        onError: (e: any) => {
            toast.error(
                e?.response?.data?.error ?? "Erro ao atualizar motivo de perda"
            );
        },
    });

    const deleteMotivoPerda = useMutation({
        mutationFn: async (id: number) => {
            await motivoPerdaAPI.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Motivo de perda excluído com sucesso!");
        },
        onError: (e: any) => {
            toast.error(
                e?.response?.data?.error ?? "Erro ao excluir motivo de perda"
            );
        },
    });

    return {
        motivoPerdas: data?.data ?? [],
        totalItems: data?.total ?? 0,
        totalPages: data?.totalPages ?? 0,
        currentPage: data?.page ?? 1,

        isLoading,
        error,
        refetch,

        searchTerm,
        setSearchTerm,

        createMotivoPerda: createMotivoPerda.mutateAsync,
        updateMotivoPerda: updateMotivoPerda.mutateAsync,
        deleteMotivoPerda: deleteMotivoPerda.mutateAsync,

        isCreating: createMotivoPerda.isPending,
        isUpdating: updateMotivoPerda.isPending,
        isDeleting: deleteMotivoPerda.isPending,
    };
};
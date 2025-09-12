// src/hooks/useLojas.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lojaAPI } from "@/services/api";
import type { Loja } from "@/types";

export function useLojas(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["lojas", filters],
        enabled,
        queryFn: async () => (await lojaAPI.getAll(filters)).data,
    });
}

export function useLoja(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["lojas", id],
        enabled,
        queryFn: async () => (await lojaAPI.getById(id as number)).data,
    });
}

export function useCreateLoja() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Loja>) => (await lojaAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["lojas"] });
        },
    });
}

export function useUpdateLoja() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Loja> }) =>
            (await lojaAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["lojas"] });
            qc.invalidateQueries({ queryKey: ["lojas", id] });
        },
    });
}

export function useDeleteLoja() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await lojaAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["lojas"] });
        },
    });
}
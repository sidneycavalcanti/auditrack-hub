// src/hooks/useCategorias.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriaAPI } from "@/services/api";
import type { Categoria } from "@/types";

export function useCategorias(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["categorias", filters],
        enabled,
        queryFn: async () => (await categoriaAPI.getAll(filters)).data,
    });
}

export function useCategoria(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["categorias", id],
        enabled,
        queryFn: async () => (await categoriaAPI.getById(id as number)).data,
    });
}

export function useCreateCategoria() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Categoria>) =>
            (await categoriaAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["categorias"] });
        },
    });
}

export function useUpdateCategoria() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Categoria> }) =>
            (await categoriaAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["categorias"] });
            qc.invalidateQueries({ queryKey: ["categorias", id] });
        },
    });
}

export function useDeleteCategoria() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await categoriaAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["categorias"] });
        },
    });
}
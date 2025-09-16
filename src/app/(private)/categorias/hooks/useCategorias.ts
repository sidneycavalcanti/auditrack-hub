// src/hooks/useCategorias.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriaAPI, handleApiError } from "@/services/api";
import { toast } from "sonner";
import type { Categoria, FilterOptions } from "@/types";

const QUERY_KEY = "categorias";

export const useCategorias = (filters: FilterOptions = {}) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await categoriaAPI.getAll(filters as any);
            const payload = response.data as any;

            const list: any[] = Array.isArray(payload?.cats)
                ? payload.cats
                : Array.isArray(payload?.cats)
                    ? payload.cats
                    : [];

            const cats: Categoria[] = list.map((c: any) => ({
                id: c.id,
                name: c.name,
                createdAt: c.createdAt,
            }));

            // Paginação (suporta diversos shapes)
            const total = payload.totalItems ?? payload.total ?? cats.length;
            const limit = payload.limit ?? filters.limit ?? cats.length ?? 10;
            const totalPages =
                payload.totalPages ??
                (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters.page ?? 1;

            return { data: cats, total, totalPages, page, limit };
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
        placeholderData: (d) => d,
    });
};

export const useCategoria = (id: number) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await categoriaAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreateCategoria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<Categoria, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await categoriaAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Categoria criada', {
                description: 'Categoria criada com sucesso.',
            });
        },
        onError: (error) => {
            toast.error(
                'Erro ao criar categoria', {
                description: handleApiError(error)
            });
        },
    });
};

export const useUpdateCategoria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Categoria> }) => {
            const response = await categoriaAPI.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ['categoria'] });
            toast(
                'Categoria atualizada', {
                description: 'Categoria atualizada com sucesso.',
            });
        },
        onError: (error) => {
            toast(
                'Erro ao atualizar categoria', {
                description: handleApiError(error)
            });
        },
    });
};

export const useDeleteCategoria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await categoriaAPI.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Categoria excluída', {
                description: 'Categoria excluída com sucesso.',
            });
        },
        onError: (error) => {
            toast.error(
                'Erro ao excluir categoria', {
                description: handleApiError(error)
            });
        },
    });
};
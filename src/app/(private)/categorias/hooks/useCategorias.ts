// src/hooks/useCategorias.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriaAPI, handleApiError } from "@/services/api";
import { toast } from "sonner";
import type { Categoria } from "@/types";

export const useCategorias = (filters?: Record<string, any>) => {
    return useQuery({
        queryKey: ['categorias', filters],
        queryFn: async () => {
            const response = await categoriaAPI.getAll(filters);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
};

export const useCategoria = (id: number) => {
    return useQuery({
        queryKey: ['categoria', id],
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
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
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
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
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
            queryClient.invalidateQueries({ queryKey: ['categorias'] });
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
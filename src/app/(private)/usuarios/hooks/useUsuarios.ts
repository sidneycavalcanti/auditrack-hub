// src/hooks/useUsuarios.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usuarioAPI, handleApiError } from "@/services/api";
import type { User, FilterOptions } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const QUERY_KEY = 'usuarios';

export const useUsuarios = (filters?: FilterOptions) => {
    const { isAuthenticated } = useAuth();
    
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await usuarioAPI.getAll(filters);
            return response.data;
        },
        enabled: isAuthenticated, // Só executa se estiver autenticado
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
};

export const useUsuario = (id: number) => {
    const { isAuthenticated } = useAuth();
    
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await usuarioAPI.getById(id);
            return response.data;
        },
        enabled: !!id && isAuthenticated, // Só executa se tiver ID e estiver autenticado
    });
};

export const useCreateUsuario = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<User>) => {
            const response = await usuarioAPI.create(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Usuário criado', {
                description: 'O usuário foi criado com sucesso.',
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error(
                'Erro ao criar usuário', {
                description: errorMessage
            });
        },
    });
};

export const useUpdateUsuario = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
            const response = await usuarioAPI.update(id, data);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            toast.success(
                'Usuário atualizado', {
                description: 'O usuário foi atualizado com sucesso.',
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error(
                'Erro ao atualizar usuário', {
                description: errorMessage
            });
        },
    });
};

export const useDeleteUsuario = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await usuarioAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Usuário removido', {
                description: 'O usuário foi removido com sucesso.',
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error(
                'Erro ao remover usuário', {
                description: errorMessage
            });
        },
    });
};
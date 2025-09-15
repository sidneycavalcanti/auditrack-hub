// src/app/(private)/usuarios/hooks/useUsuarios.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usuarioAPI, handleApiError } from "@/services/api";
import type { User, FilterOptions } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const QUERY_KEY = "usuarios";

export const useUsuarios = (filters: FilterOptions = {}) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await usuarioAPI.getAll(filters as any);
            const payload = response.data as any;

            // <-- AQUI: suporta 'users' (seu backend) e 'usuarios' (fallback)
            const list: any[] = Array.isArray(payload?.users)
                ? payload.users
                : Array.isArray(payload?.usuarios)
                    ? payload.usuarios
                    : [];

            const users: User[] = list.map((u: any) => ({
                id: u.id,
                name: u.name,
                username: u.username,
                categoriaId: u.categoriaId,
                situacao: u.situacao,
                createdAt: u.createdAt,   // corrigido
                updatedAt: u.updatedAt,   // corrigido
                categoria: u.categoria
                    ? { id: u.categoria.id, name: u.categoria.name }
                    : undefined,
            }));

            // Paginação (suporta diversos shapes)
            const total = payload.totalItems ?? payload.total ?? users.length;
            const limit = payload.limit ?? filters.limit ?? users.length ?? 10;
            const totalPages =
                payload.totalPages ??
                (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters.page ?? 1;

            return { data: users, total, totalPages, page, limit };
        },
        enabled: isAuthenticated, // só busca quando autenticado
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
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
        enabled: !!id && isAuthenticated,
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
            toast.success("Usuário criado", {
                description: "O usuário foi criado com sucesso.",
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error("Erro ao criar usuário", { description: errorMessage });
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
            toast.success("Usuário atualizado", {
                description: "O usuário foi atualizado com sucesso.",
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error("Erro ao atualizar usuário", { description: errorMessage });
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
            toast.success("Usuário removido", {
                description: "O usuário foi removido com sucesso.",
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error("Erro ao remover usuário", { description: errorMessage });
        },
    });
};
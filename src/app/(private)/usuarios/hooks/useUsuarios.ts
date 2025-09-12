// src/hooks/useUsuarios.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usuarioAPI } from "@/services/api";
import type { User } from "@/types";

export function useUsuarios(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["usuarios", filters],
        enabled,
        queryFn: async () => (await usuarioAPI.getAll(filters)).data,
    });
}

export function useUsuario(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["usuarios", id],
        enabled,
        queryFn: async () => (await usuarioAPI.getById(id as number)).data,
    });
}

export function useCreateUsuario() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<User>) => (await usuarioAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["usuarios"] });
        },
    });
}

export function useUpdateUsuario() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) =>
            (await usuarioAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["usuarios"] });
            qc.invalidateQueries({ queryKey: ["usuarios", id] });
        },
    });
}

export function useDeleteUsuario() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await usuarioAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["usuarios"] });
        },
    });
}
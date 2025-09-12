// src/hooks/useAuditorias.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditoriaAPI } from "@/services/api";
import type { Auditoria } from "@/types";

export function useAuditorias(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["auditorias", filters],
        enabled,
        queryFn: async () => (await auditoriaAPI.getAll(filters)).data,
    });
}

export function useAuditoria(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["auditorias", id],
        enabled,
        queryFn: async () => (await auditoriaAPI.getById(id as number)).data,
    });
}

export function useCreateAuditoria() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Auditoria>) =>
            (await auditoriaAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["auditorias"] });
        },
    });
}

export function useUpdateAuditoria() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Auditoria> }) =>
            (await auditoriaAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["auditorias"] });
            qc.invalidateQueries({ queryKey: ["auditorias", id] });
        },
    });
}

export function useDeleteAuditoria() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await auditoriaAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["auditorias"] });
        },
    });
}
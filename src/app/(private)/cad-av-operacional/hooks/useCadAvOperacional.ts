// src/hooks/useCadAvOperacional.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cadAvOperacionalAPI } from "@/services/api";
import type { CadAvOperacional } from "@/types";

export function useCadAvOperacional(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["cad-av-operacional", filters],
        enabled,
        queryFn: async () => (await cadAvOperacionalAPI.getAll(filters)).data,
    });
}

export function useCadAvOperacionalById(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["cad-av-operacional", id],
        enabled,
        queryFn: async () => (await cadAvOperacionalAPI.getById(id as number)).data,
    });
}

export function useCreateCadAvOperacional() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<CadAvOperacional>) =>
            (await cadAvOperacionalAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cad-av-operacional"] });
        },
    });
}

export function useUpdateCadAvOperacional() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<CadAvOperacional> }) =>
            (await cadAvOperacionalAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["cad-av-operacional"] });
            qc.invalidateQueries({ queryKey: ["cad-av-operacional", id] });
        },
    });
}

export function useDeleteCadAvOperacional() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await cadAvOperacionalAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cad-av-operacional"] });
        },
    });
}
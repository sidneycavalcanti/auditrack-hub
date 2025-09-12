// src/hooks/useCadQuestoes.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cadQuestoesAPI } from "@/services/api";
import type { CadQuestao } from "@/types";

export function useCadQuestoes(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["cad-questoes", filters],
        enabled,
        queryFn: async () => (await cadQuestoesAPI.getAll(filters)).data,
    });
}

export function useCadQuestao(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["cad-questoes", id],
        enabled,
        queryFn: async () => (await cadQuestoesAPI.getById(id as number)).data,
    });
}

export function useCreateCadQuestoes() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<CadQuestao>) =>
            (await cadQuestoesAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cad-questoes"] });
        },
    });
}

export function useUpdateCadQuestoes() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<CadQuestao> }) =>
            (await cadQuestoesAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["cad-questoes"] });
            qc.invalidateQueries({ queryKey: ["cad-questoes", id] });
        },
    });
}

export function useDeleteCadQuestao() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await cadQuestoesAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cad-questoes"] });
        },
    });
}
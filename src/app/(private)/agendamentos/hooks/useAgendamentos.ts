// src/hooks/useAgendamentos.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agendamentoAPI } from "@/services/api";
import type { Agendamento } from "@/types";

export function useAgendamentos(filters?: Record<string, any>, enabled = true) {
    return useQuery({
        queryKey: ["agendamentos", filters],
        enabled,
        queryFn: async () => (await agendamentoAPI.getAll(filters)).data,
    });
}

export function useAgendamento(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["agendamentos", id],
        enabled,
        queryFn: async () => (await agendamentoAPI.getById(id as number)).data,
    });
}

export function useCreateAgendamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Agendamento>) =>
            (await agendamentoAPI.create(data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["agendamentos"] });
        },
    });
}

export function useUpdateAgendamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Agendamento> }) =>
            (await agendamentoAPI.update(id, data)).data,
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: ["agendamentos"] });
            qc.invalidateQueries({ queryKey: ["agendamentos", id] });
        },
    });
}

export function useDeleteAgendamento() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => (await agendamentoAPI.delete(id)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["agendamentos"] });
        },
    });
}
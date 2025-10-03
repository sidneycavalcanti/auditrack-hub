// src/app/(private)/auditorias/hooks/useAuditorias.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditoriaAPI, handleApiError } from "@/services/api";
import type { Auditoria, FilterOptions, Loja, User } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const QUERY_KEY = "auditorias";

/** Normaliza "YYYY-MM-DD" para ISO ancorado ao meio-dia UTC (evita -1 dia). */
function toServerDate(ymd?: string | null): string | undefined {
    if (!ymd) return undefined;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return ymd || undefined; // já vem ISO? envia como está
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).toISOString();
}

/** Garante HH:mm:ss (ex.: "14:45" -> "14:45:00"). */
function normTime(t?: string | null): string | undefined {
    if (!t) return undefined;
    return /^\d{2}:\d{2}:\d{2}$/.test(t) ? t : `${t}:00`;
}

export const useAuditorias = (filters?: FilterOptions & { q?: string }) => {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await auditoriaAPI.getAll(filters as any);
            const payload = response.data as any;

            const items: Auditoria[] = Array.isArray(payload.auditoria)
                ? payload.auditoria.map((a: any) => ({
                    id: a.id,
                    // mantém apenas "YYYY-MM-DD" para o front
                    data: (a.data ?? "").slice(0, 10),
                    horaInicial: a.horaInicial,
                    horaFinal: a.horaFinal,
                    lojaId: a.lojaId,
                    usuarioId: a.usuarioId,
                    criadorId: a.criadorId,
                    loja: a.loja as Loja,
                    usuario: a.usuario as User,
                    criador: a.criador as User,
                    createdAt: a.createdAt,
                    updatedAt: a.updatedAt,
                }))
                : [];

            const total = payload.totalItems ?? payload.total ?? items.length;
            const totalPages =
                payload.totalPages ??
                (filters?.limit ? Math.ceil(total / (filters.limit || 10)) : 1);
            const page = payload.currentPage ?? payload.page ?? filters?.page ?? 1;
            const limit = payload.limit ?? filters?.limit ?? items.length;

            return { data: items, total, totalPages, page, limit };
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
};

export function useAuditoria(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: ["auditorias", id],
        enabled,
        queryFn: async () => (await auditoriaAPI.getById(id as number)).data,
    });
}

export const useCreateAuditoria = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: Partial<Auditoria>) => {
            const payload = {
                lojaId: data.lojaId,
                usuarioId: data.usuarioId,
                criadorId: data.criadorId ?? user?.id,
                // ⬇⬇⬇ ancorado ao meio-dia UTC
                data: toServerDate(data.data),
                horaInicial: normTime(data.horaInicial),
                horaFinal: normTime(data.horaFinal),
            };
            const response = await auditoriaAPI.create(payload as any);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Auditoria criada", {
                description: "Agendamento criado com sucesso.",
            });
        },
        onError: (error) => {
            toast.error("Erro ao criar auditoria", {
                description: handleApiError(error),
            });
        },
    });
};

export const useUpdateAuditoria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Auditoria> }) => {
            const payload = {
                lojaId: data.lojaId,
                usuarioId: data.usuarioId,
                criadorId: data.criadorId,
                // ⬇⬇⬇ ancorado ao meio-dia UTC
                data: toServerDate(data.data),
                horaInicial: normTime(data.horaInicial),
                horaFinal: normTime(data.horaFinal),
            };
            const response = await auditoriaAPI.update(id, payload as any);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            toast.success("Auditoria atualizada", {
                description: "Agendamento atualizado com sucesso.",
            });
        },
        onError: (error) => {
            toast.error("Erro ao atualizar auditoria", {
                description: handleApiError(error),
            });
        },
    });
};

export const useDeleteAuditoria = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await auditoriaAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Auditoria removida", {
                description: "Agendamento excluído com sucesso.",
            });
        },
        onError: (error) => {
            toast.error("Erro ao excluir auditoria", {
                description: handleApiError(error),
            });
        },
    });
};
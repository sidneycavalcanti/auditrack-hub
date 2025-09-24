// src/app/(private)/relatorios/avoperacional/hooks/useAvOperacional.ts
"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { avOperacionalAPI } from "@/services/api";
import type { AvOperacional, FilterOptions, PaginatedResponse } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = "avoperacional";

// adicionamos campos de filtro (mes/ano/lojaId)
type AvOperacionalFilters = FilterOptions & {
    mes?: number;   // 1..12
    ano?: number;   // ex: 2025
    lojaId?: number;
};

const normalizeFilters = (f: AvOperacionalFilters = {}) => ({
    page: f.page ?? 1,
    limit: f.limit ?? 10,
    search: f.search ?? f.name ?? undefined,
    mes: f.mes ?? undefined,
    ano: f.ano ?? undefined,
    lojaId: f.lojaId ?? undefined,
});

export function useAvaliacoesOperacional(filters: AvOperacionalFilters = {}) {
    const norm = normalizeFilters(filters);

    return useQuery<PaginatedResponse<AvOperacional>>({
        queryKey: [QUERY_KEY, norm],
        queryFn: async () => {
            const res = await avOperacionalAPI.getAll(norm as any);
            const payload = res.data as any;

            // Array de avaliações
            const list: any[] = Array.isArray(payload?.avaliacoes) ? payload.avaliacoes : [];

            // Mapeia para o tipo do front
            let items: AvOperacional[] = list.map((a: any) => ({
                id: a.id,
                auditoriaId: a.auditoriaId ?? a.auditoria?.id,
                cadAvOperacionalId: a.cadavoperacionalId ?? a.cadavoperacional?.id,
                pontuacao: a.nota ?? 0,
                observacoes: a.resposta ?? undefined,

                auditoria: a.auditoria,                 // contém data/loja/usuario
                cadAvOperacional: a.cadavoperacional,   // contém descricao
                questao: a.cadquestoes,                 // se o backend enviar

                nota: a.nota,
                resposta: a.resposta,

                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
            }));

            // 🔎 Filtros locais (fallback), caso o backend não aplique:
            if (norm.ano || norm.mes || norm.lojaId) {
                items = items.filter((it) => {
                    const d = it.auditoria?.data?.slice(0, 10);
                    const lojaMatch = norm.lojaId ? (it.auditoria?.loja?.id === norm.lojaId) : true;
                    const anoMatch =
                        norm.ano ? (d ? Number(d.slice(0, 4)) === norm.ano : false) : true;
                    const mesMatch =
                        norm.mes ? (d ? Number(d.slice(5, 7)) === norm.mes : false) : true;
                    return lojaMatch && anoMatch && mesMatch;
                });
            }

            const total = payload.totalItems ?? payload.total ?? items.length;
            const limit = (payload.limit ?? norm.limit ?? items.length) || 10;
            const totalPages = payload.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? norm.page ?? 1;

            return { data: items, total, totalPages, page, limit };
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (d) => d,
    });
}

/** UPDATE (corrigir texto/nota) */
export function useUpdateAvOperacional() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { resposta?: string; nota?: number; pontuacao?: number } }) => {
            // envia na nomenclatura que seu backend espera
            const payload: any = {};
            if (data.resposta !== undefined) payload.resposta = data.resposta;
            if (data.nota !== undefined) payload.nota = data.nota;
            if (data.pontuacao !== undefined) payload.nota = data.pontuacao;
            const res = await avOperacionalAPI.update(id, payload);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success("Avaliação operacional atualizada.");
        },
        onError: (err: any) => {
            toast.error("Não foi possível atualizar a avaliação.", {
                description: err?.message ?? "Tente novamente.",
            });
        },
    });
}
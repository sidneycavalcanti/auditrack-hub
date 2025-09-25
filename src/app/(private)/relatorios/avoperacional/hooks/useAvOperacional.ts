// src/app/(private)/relatorios/avoperacional/hooks/useAvOperacional.ts
"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { avOperacionalAPI } from "@/services/api";
import type { AvOperacional, FilterOptions, PaginatedResponse } from "@/types";
import { toast } from "sonner";

const QUERY_KEY = "avoperacional";

// adicionamos campos de filtro (mes/ano/lojaId)
export type AvOperacionalFilters = FilterOptions & {
    // já existiam:
    mes?: number;     // 1..12
    ano?: number;     // ex: 2025
    lojaId?: number;

    // novos:
    from?: string;    // "YYYY-MM-DD"
    to?: string;      // "YYYY-MM-DD"
    auditorId?: number;
    questaoId?: number;
    cadAvOperacionalId?: number;
    notaMin?: number;
    notaMax?: number;
};

const normalizeFilters = (f: AvOperacionalFilters = {}) => ({
    page: f.page ?? 1,
    limit: f.limit ?? 10,
    search: f.search ?? f.name ?? undefined,
    mes: f.mes ?? undefined,
    ano: f.ano ?? undefined,
    lojaId: f.lojaId ?? undefined,

    from: f.from ?? undefined,
    to: f.to ?? undefined,
    auditorId: f.auditorId ?? undefined,
    questaoId: f.questaoId ?? undefined,
    cadAvOperacionalId: f.cadAvOperacionalId ?? undefined,
    notaMin: f.notaMin ?? undefined,
    notaMax: f.notaMax ?? undefined,
});

/** Filtro local reutilizável (fallback caso o backend não filtre tudo) */
export function applyAvOpFilters(items: AvOperacional[], f: AvOperacionalFilters) {
    const n = normalizeFilters(f);
    return items.filter((it) => {
        // datas
        const dateISO = it.auditoria?.data ?? it.createdAt?.slice(0, 10);
        if (n.ano || n.mes) {
            if (!dateISO) return false;
            const y = Number(dateISO.slice(0, 4));
            const m = Number(dateISO.slice(5, 7));
            if (n.ano && y !== n.ano) return false;
            if (n.mes && m !== n.mes) return false;
        }
        if (n.from && dateISO && dateISO < n.from) return false;
        if (n.to && dateISO && dateISO > n.to) return false;

        // entidades
        if (n.lojaId && it.auditoria?.loja?.id !== n.lojaId) return false;
        if (n.auditorId && it.auditoria?.usuario?.id !== n.auditorId) return false;
        if (n.cadAvOperacionalId && (it.cadAvOperacionalId ?? it.cadAvOperacional?.id) !== n.cadAvOperacionalId) return false;
        if (n.questaoId && it.questao?.id !== n.questaoId) return false;

        // notas
        const nota = typeof it.nota === "number" ? it.nota
            : typeof it.pontuacao === "number" ? it.pontuacao
                : null;
        if (nota != null) {
            if (n.notaMin != null && nota < n.notaMin) return false;
            if (n.notaMax != null && nota > n.notaMax) return false;
        }

        // search
        if (n.search) {
            const s = n.search.toLowerCase();
            const auditor = it.auditoria?.usuario?.name?.toLowerCase() ?? "";
            const loja = (it.auditoria?.loja?.name ?? (it.auditoria?.loja as any)?.descricao ?? "").toLowerCase();
            const itemOp = it.cadAvOperacional?.descricao?.toLowerCase() ?? "";
            const questao = it.questao?.name?.toLowerCase() ?? "";
            const obs = (it.resposta ?? it.observacoes ?? "").toLowerCase();
            if (![auditor, loja, itemOp, questao, obs].some((t) => t.includes(s))) return false;
        }

        return true;
    });
}

export function useAvaliacoesOperacional(filters: AvOperacionalFilters = {}) {
    const norm = normalizeFilters(filters);

    return useQuery<PaginatedResponse<AvOperacional>>({
        queryKey: [QUERY_KEY, norm],
        queryFn: async () => {
            // passamos todos os filtros que o backend suportar
            const res = await avOperacionalAPI.getAll(norm as any);
            const payload = res.data as any;

            const list: any[] = Array.isArray(payload?.avaliacoes) ? payload.avaliacoes : [];
            let items: AvOperacional[] = list.map((a: any) => ({
                id: a.id,
                auditoriaId: a.auditoriaId ?? a.auditoria?.id,
                cadAvOperacionalId: a.cadavoperacionalId ?? a.cadavoperacional?.id,
                pontuacao: a.nota ?? 0,
                observacoes: a.resposta ?? undefined,
                auditoria: a.auditoria,
                cadAvOperacional: a.cadavoperacional,
                questao: a.cadquestoes,
                nota: a.nota,
                resposta: a.resposta,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
            }));

            // 🔁 fallback local
            items = applyAvOpFilters(items, norm);

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
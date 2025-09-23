// src/app/(private)/relatorios/avoperacional/hooks/useAvOperacional.ts
"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { avOperacionalAPI } from "@/services/api";
import type { AvOperacional, FilterOptions, PaginatedResponse } from "@/types";

/** Chave estável da query */
const QUERY_KEY = "avoperacional";

/** Normaliza filtros para key estável e evita enviar undefineds desnecessários */
const normalize = (f: FilterOptions = {}) => ({
    page: f.page ?? 1,
    limit: f.limit ?? 10,
    search: f.search ?? f.name ?? undefined,
});

/**
 * Hook principal – apenas GET – para relatórios/gráficos.
 * Retorna dados já mapeados + paginação.
 */
export function useAvaliacoesOperacional(filters: FilterOptions = {}) {
    const norm = normalize(filters);

    return useQuery<PaginatedResponse<AvOperacional>>({
        queryKey: [QUERY_KEY, norm],
        queryFn: async (): Promise<PaginatedResponse<AvOperacional>> => {
            const res = await avOperacionalAPI.getAll(norm as any);
            const payload = res.data as any;

            const list: any[] = Array.isArray(payload?.avaliacoes) ? payload.avaliacoes : [];

            const items: AvOperacional[] = list.map((a: any) => ({
                id: a.id,
                auditoriaId: a.auditoriaId ?? a.auditoria?.id,
                cadAvOperacionalId: a.cadavoperacionalId ?? a.cadavoperacional?.id,
                pontuacao: a.nota ?? 0,
                observacoes: a.resposta ?? undefined,

                createdAt: a.createdAt,
                updatedAt: a.updatedAt,

                // extras (opcionais) – o seu tipo permite
                auditoria: a.auditoria,               // já vem com loja/usuario/data
                cadAvOperacional: a.cadavoperacional, // já vem com descricao
            }));

            // console.log(items);


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

/** GET por ID (caso precise detalhar uma avaliação) */
export function useAvaliacaoOperacionalById(id?: number, enabled = !!id) {
    return useQuery({
        queryKey: [QUERY_KEY, "byId", id],
        enabled,
        queryFn: async () => (await avOperacionalAPI.getById(id as number)).data,
    });
}

/* =====================================================================================
 * Helpers para gráficos/relatórios
 * ===================================================================================== */

/** Média e contagem de notas por loja (Bar/Column chart) */
export function useAvOpGroupByLoja(items: AvOperacional[] = []) {
    return React.useMemo(() => {
        const map = new Map<
            string,
            { label: string; count: number; sum: number; avg: number }
        >();

        for (const it of items) {
            const label =
                it.auditoria?.loja?.name ||
                (it.auditoria?.loja as any)?.descricao ||
                `Loja ${it.auditoria?.loja?.id ?? "-"}`;

            const nota = typeof it.nota === "number" ? it.nota : (typeof it.pontuacao === "number" ? it.pontuacao : null);
            if (nota == null) continue;

            const entry = map.get(label) ?? { label, count: 0, sum: 0, avg: 0 };
            entry.count += 1;
            entry.sum += nota;
            map.set(label, entry);
        }

        const rows = [...map.values()].map((r) => ({ ...r, avg: r.count ? r.sum / r.count : 0 }));
        // ideal para Recharts: labels + series
        return {
            labels: rows.map((r) => r.label),
            seriesAvg: rows.map((r) => Number(r.avg.toFixed(2))),
            seriesCount: rows.map((r) => r.count),
            table: rows,
        };
    }, [items]);
}

/** Média e contagem de notas por auditor (Bar/Column chart) */
export function useAvOpGroupByAuditor(items: AvOperacional[] = []) {
    return React.useMemo(() => {
        const map = new Map<string, { label: string; count: number; sum: number; avg: number }>();

        for (const it of items) {
            const label = it.auditoria?.usuario?.name ?? `Usuário ${it.auditoria?.usuario?.id ?? "-"}`;
            const nota = typeof it.nota === "number" ? it.nota : (typeof it.pontuacao === "number" ? it.pontuacao : null);
            if (nota == null) continue;

            const entry = map.get(label) ?? { label, count: 0, sum: 0, avg: 0 };
            entry.count += 1;
            entry.sum += nota;
            map.set(label, entry);
        }

        const rows = [...map.values()].map((r) => ({ ...r, avg: r.count ? r.sum / r.count : 0 }));
        return {
            labels: rows.map((r) => r.label),
            seriesAvg: rows.map((r) => Number(r.avg.toFixed(2))),
            seriesCount: rows.map((r) => r.count),
            table: rows,
        };
    }, [items]);
}

/** Média de notas por questão (útil para ranking de perguntas) */
export function useAvOpGroupByQuestao(items: AvOperacional[] = []) {
    return React.useMemo(() => {
        const map = new Map<number, { id: number; label: string; count: number; sum: number; avg: number }>();

        for (const it of items) {
            if (!it.questao) continue;
            const id = it.questao.id;
            const label = it.questao.name;
            const nota = typeof it.nota === "number" ? it.nota : (typeof it.pontuacao === "number" ? it.pontuacao : null);
            if (nota == null) continue;

            const entry = map.get(id) ?? { id, label, count: 0, sum: 0, avg: 0 };
            entry.count += 1;
            entry.sum += nota;
            map.set(id, entry);
        }

        const rows = [...map.values()].map((r) => ({ ...r, avg: r.count ? r.sum / r.count : 0 }));
        return {
            labels: rows.map((r) => r.label),
            seriesAvg: rows.map((r) => Number(r.avg.toFixed(2))),
            seriesCount: rows.map((r) => r.count),
            table: rows,
        };
    }, [items]);
}

/** Série temporal (por data da auditoria) – média de nota por dia */
export function useAvOpTimeline(items: AvOperacional[] = []) {
    return React.useMemo(() => {
        const map = new Map<string, { date: string; count: number; sum: number; avg: number }>();

        for (const it of items) {
            const dateStr = it.auditoria?.data ?? it.createdAt?.slice(0, 10);
            if (!dateStr) continue;

            const nota = typeof it.nota === "number" ? it.nota : (typeof it.pontuacao === "number" ? it.pontuacao : null);
            if (nota == null) continue;

            const entry = map.get(dateStr) ?? { date: dateStr, count: 0, sum: 0, avg: 0 };
            entry.count += 1;
            entry.sum += nota;
            map.set(dateStr, entry);
        }

        const points = [...map.values()]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((p) => ({ ...p, avg: p.count ? p.sum / p.count : 0 }));

        return {
            points,                            // [{date, avg, count, sum}]
            labels: points.map((p) => p.date), // eixo X
            seriesAvg: points.map((p) => Number(p.avg.toFixed(2))),
        };
    }, [items]);
}
// FILE: src/app/(private)/relatorios/fluxos/hooks/useFluxoPorDia.ts
"use client";

import * as React from "react";
import { useFluxoPessoas } from "./useFluxoPessoas";

export type LinhaDia = { dia: string; total: number;[categoria: string]: number | string };

const DOW = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const norm = (s?: string) => (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function useFluxoPorDia(filters: Parameters<typeof useFluxoPessoas>[0] = {}, opts?: { enabled?: boolean }) {
    const q = useFluxoPessoas(filters, opts);
    const rows = q.data?.data ?? [];

    // categorias detectadas dinamicamente
    const categorias = React.useMemo(() => {
        const set = new Set<string>();
        rows.forEach(r => { if (r.categoria) set.add(r.categoria); });
        return Array.from(set);
    }, [rows]);

    const linhas: LinhaDia[] = React.useMemo(() => {
        const map = new Map<string, LinhaDia>();
        for (const r of rows) {
            const d = r.auditoria?.data ?? r.createdAt ?? "";
            const dow = d ? DOW[new Date(d).getDay()] : "";
            const key = dow || "—";
            const item = map.get(key) ?? { dia: key, total: 0 };
            const qtd = typeof r.quantidade === "number" ? r.quantidade : 1;
            const cat = r.categoria ?? "Outros";
            item[cat] = (Number(item[cat] ?? 0) + qtd) as number;
            item.total += qtd;
            map.set(key, item);
        }
        return DOW.map(d => map.get(d) ?? { dia: d, total: 0 });
    }, [rows]);

    const totalPorCategoria = React.useMemo(() => {
        const t: Record<string, number> = {};
        for (const l of linhas) {
            for (const cat of categorias) {
                t[cat] = (t[cat] ?? 0) + Number(l[cat] ?? 0);
            }
        }
        return t;
    }, [linhas, categorias]);

    const totalGeral = linhas.reduce((a, l) => a + l.total, 0);

    return { ...q, categorias, linhas, totalPorCategoria, totalGeral };
}
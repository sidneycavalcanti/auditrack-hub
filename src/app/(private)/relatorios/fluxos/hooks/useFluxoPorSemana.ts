"use client";

import * as React from "react";
import { useFluxoPessoas } from "./useFluxoPessoas";

const DOW = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function weekOfMonth(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = start.getDay();             // 0..6
    return Math.floor((date.getDate() + day - 1) / 7) + 1; // 1..6
}

export type LinhaSemana = { semana: string;[dia: string]: number | string; total: number };

export function useFluxoPorSemana(filters: Parameters<typeof useFluxoPessoas>[0] = {}, opts?: { enabled?: boolean }) {
    const q = useFluxoPessoas(filters, opts);
    const rows = q.data?.data ?? [];

    const semanas = ["1ª Semana", "2ª Semana", "3ª Semana", "4ª Semana", "5ª Semana", "6ª Semana"];

    const linhas: LinhaSemana[] = React.useMemo(() => {
        const map = new Map<string, LinhaSemana>();
        for (const r of rows) {
            const sISO = r.auditoria?.data ?? r.createdAt;
            if (!sISO) continue;
            const d = new Date(sISO);
            const semIdx = weekOfMonth(d) - 1;
            const semLabel = semanas[semIdx] ?? `${semIdx + 1}ª Semana`;
            const dow = DOW[d.getDay()];
            const item = map.get(semLabel) ?? { semana: semLabel, total: 0 };
            const qtd = typeof r.quantidade === "number" ? r.quantidade : 1;
            item[dow] = (Number(item[dow] ?? 0) + qtd) as number;
            item.total += qtd;
            map.set(semLabel, item);
        }
        return semanas.map(s => map.get(s) ?? { semana: s, total: 0 });
    }, [rows]);

    // para gráficos
    const porDia: { dia: string;[semana: string]: number | string }[] = DOW.map((dia) => {
        const entry: any = { dia };
        for (const l of linhas) entry[l.semana] = Number(l[dia] ?? 0);
        return entry;
    });

    const totalPorSemana = linhas.map(l => ({ semana: l.semana, total: l.total }));
    const total = totalPorSemana.reduce((a, t) => a + t.total, 0);

    return { ...q, linhas, porDia, totalPorSemana, total };
}
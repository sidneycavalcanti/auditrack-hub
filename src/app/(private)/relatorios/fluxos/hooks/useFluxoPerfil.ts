// FILE: src/app/(private)/relatorios/fluxos/hooks/useFluxoPerfil.ts
"use client";

import * as React from "react";
import { useFluxoPessoas } from "./useFluxoPessoas";

export type PerfilGenero = { dia: string; masculino: number; feminino: number; outros: number; total: number };
export type PerfilIdade = { dia: string; crianca: number; jovem: number; adulto: number; idoso: number; total: number };

type Filters = Parameters<typeof useFluxoPessoas>[0];

const DOW = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const norm = (s?: string) => (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function useFluxoPerfil(filters: Filters = {}, opts?: { enabled?: boolean }) {
    const q = useFluxoPessoas(filters, opts);
    const rows = q.data?.data ?? [];

    const genero: PerfilGenero[] = React.useMemo(() => {
        const map = new Map<string, PerfilGenero>();
        for (const r of rows) {
            const d = r.auditoria?.data ?? r.createdAt ?? "";
            const dow = d ? DOW[new Date(d).getDay()] : "";
            const key = dow || "—";
            const item = map.get(key) ?? { dia: key, masculino: 0, feminino: 0, outros: 0, total: 0 };
            const qtd = typeof r.quantidade === "number" ? r.quantidade : 1;
            const sx = norm(r.sexo);
            if (sx === "masculino") item.masculino += qtd;
            else if (sx === "feminino") item.feminino += qtd;
            else item.outros += qtd;
            item.total += qtd;
            map.set(key, item);
        }
        return DOW.map(d => map.get(d) ?? { dia: d, masculino: 0, feminino: 0, outros: 0, total: 0 });
    }, [rows]);

    const idade: PerfilIdade[] = React.useMemo(() => {
        const map = new Map<string, PerfilIdade>();
        for (const r of rows) {
            const d = r.auditoria?.data ?? r.createdAt ?? "";
            const dow = d ? DOW[new Date(d).getDay()] : "";
            const key = dow || "—";
            const item = map.get(key) ?? { dia: key, crianca: 0, jovem: 0, adulto: 0, idoso: 0, total: 0 };
            const qtd = typeof r.quantidade === "number" ? r.quantidade : 1;
            const cat = norm(r.categoria);
            if (cat.startsWith("cri")) item.crianca += qtd;
            else if (cat.startsWith("jov")) item.jovem += qtd;
            else if (cat.startsWith("ado")) item.adulto += qtd;
            else if (cat.startsWith("ido")) item.idoso += qtd;
            item.total += qtd;
            map.set(key, item);
        }
        return DOW.map(d => map.get(d) ?? { dia: d, crianca: 0, jovem: 0, adulto: 0, idoso: 0, total: 0 });
    }, [rows]);

    const totalsGenero = genero.reduce((a, r) => ({
        masculino: a.masculino + r.masculino,
        feminino: a.feminino + r.feminino,
        outros: a.outros + r.outros,
        total: a.total + r.total,
    }), { masculino: 0, feminino: 0, outros: 0, total: 0 });

    const totalsIdade = idade.reduce((a, r) => ({
        crianca: a.crianca + r.crianca,
        jovem: a.jovem + r.jovem,
        adulto: a.adulto + r.adulto,
        idoso: a.idoso + r.idoso,
        total: a.total + r.total,
    }), { crianca: 0, jovem: 0, adulto: 0, idoso: 0, total: 0 });

    return { ...q, genero, idade, totalsGenero, totalsIdade };
}
// src/app/(private)/relatorios/fluxos/hooks/useVendasPerfil.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { vendaAPI } from "@/services/api";
import type { FilterOptions, PaginatedResponse } from "@/types";

export type VendaMin = {
    id: number;
    createdAt?: string;
    auditoria?: {
        id: number;
        data?: string; // yyyy-mm-dd
        loja?: { id: number; name?: string; descricao?: string };
    };
    sexo?: { id?: number; name?: string }; // "Masculino" | "Feminino"
    faixaetaria?: string; // "infantil" | "adolescente" | "adulto" | "idoso"
};

export type PerfilFilters = FilterOptions & {
    lojaId?: number;
    mes?: number; // 1..12
    ano?: number; // 2025
};

const QUERY_KEY = "vendas-perfil";

const PT_WEEK = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
];

/**
 * Converte 'YYYY-MM-DD' para Date LOCAL (sem deslocar para UTC)
 */
function parseLocalDate(iso?: string): Date | undefined {
    if (!iso) return;
    // aceita 'YYYY-MM-DD' no início
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return new Date(iso); // último recurso
    const y = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    // new Date(y,m-1,d) cria no timezone local sem shift de fuso
    return new Date(y, mm - 1, dd, 12, 0, 0, 0); // meio-dia evita DST edge
}

/** 0=Seg..6=Dom (baseado na data LOCAL) */
function weekdayIndexFromISO(iso?: string): number | undefined {
    const d = parseLocalDate(iso);
    if (!d) return;
    // getDay() => 0=Dom..6=Sáb  ->  0=Seg..6=Dom
    return (d.getDay() + 6) % 7;
}

const normalize = (f: PerfilFilters = {}) => ({
    page: f.page ?? 1,
    limit: f.limit ?? 5000,
    lojaId: f.lojaId ?? undefined,
    mes: f.mes ?? undefined,
    ano: f.ano ?? undefined,
});

type Row = {
    dia: string;
    masculino: number;
    feminino: number;
    crianca: number;
    jovem: number;
    adulto: number;
    idoso: number;
    total: number;
};

type Totals = {
    masculino: number;
    feminino: number;
    crianca: number;
    jovem: number;
    adulto: number;
    idoso: number;
    total: number;
};

type Percent = {
    masculino: number;
    feminino: number;
    crianca: number;
    jovem: number;
    adulto: number;
    idoso: number;
};

export type PerfilVendasResponse = PaginatedResponse<VendaMin> & {
    rows: Row[];
    totals: Totals;
    percent: Percent;
    chartGenero: Array<{ name: string; Masculino: number; Feminino: number }>;
    chartIdade: Array<{ name: string; Criança: number; Jovem: number; Adulto: number; Idoso: number }>;
};

const normTxt = (s?: string) =>
    (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function useVendasPerfil(filters: PerfilFilters = {}, opts?: { enabled?: boolean }) {
    const norm = normalize(filters);

    return useQuery<PerfilVendasResponse>({
        queryKey: [QUERY_KEY, norm],
        enabled: opts?.enabled ?? true,
        refetchOnWindowFocus: false,
        staleTime: 10 * 60 * 1000,
        placeholderData: (d) => d,
        queryFn: async () => {
            const res = await vendaAPI.getAll(norm as any);
            const payload = res.data as any;

            const list: any[] = Array.isArray(payload?.vendas)
                ? payload.vendas
                : Array.isArray(payload)
                    ? payload
                    : [];

            // Filtro local adicional (defensivo)
            const vendas: VendaMin[] = list.filter((v: any) => {
                const dISO: string = v?.auditoria?.data ?? v?.createdAt ?? "";
                const y = dISO ? Number(String(dISO).slice(0, 4)) : undefined;
                const m = dISO ? Number(String(dISO).slice(5, 7)) : undefined;

                if (norm.ano && y !== norm.ano) return false;
                if (norm.mes && m !== norm.mes) return false;
                if (norm.lojaId && (v?.auditoria?.loja?.id ?? v?.lojaId) !== norm.lojaId) return false;
                return true;
            });

            // Agregadores por semana
            const genero = { masculino: Array(7).fill(0), feminino: Array(7).fill(0) };
            const idade = { crianca: Array(7).fill(0), jovem: Array(7).fill(0), adulto: Array(7).fill(0), idoso: Array(7).fill(0) };

            for (const v of vendas) {
                const dISO = v?.auditoria?.data ?? v?.createdAt;
                const w = weekdayIndexFromISO(dISO);
                if (w === undefined) continue;

                // Gênero
                const sx = normTxt(v?.sexo?.name);
                if (sx === "masculino") genero.masculino[w] += 1;
                else if (sx === "feminino") genero.feminino[w] += 1;

                // Faixa etária — mapeamento solicitado
                const fx = normTxt(v?.faixaetaria);
                if (fx.startsWith("infantil")) idade.crianca[w] += 1;
                else if (fx.startsWith("adolesc")) idade.jovem[w] += 1; // “Jovem” na UI
                else if (fx.startsWith("adult")) idade.adulto[w] += 1;
                else if (fx.startsWith("idos")) idade.idoso[w] += 1;
            }

            const rows: Row[] = PT_WEEK.map((dia, i) => {
                const m = genero.masculino[i];
                const f = genero.feminino[i];
                const c = idade.crianca[i];
                const j = idade.jovem[i];
                const a = idade.adulto[i];
                const id = idade.idoso[i];
                const total = m + f;
                return { dia, masculino: m, feminino: f, crianca: c, jovem: j, adulto: a, idoso: id, total };
            });

            const totals: Totals = rows.reduce(
                (acc, r) => ({
                    masculino: acc.masculino + r.masculino,
                    feminino: acc.feminino + r.feminino,
                    crianca: acc.crianca + r.crianca,
                    jovem: acc.jovem + r.jovem,
                    adulto: acc.adulto + r.adulto,
                    idoso: acc.idoso + r.idoso,
                    total: acc.total + r.total,
                }),
                { masculino: 0, feminino: 0, crianca: 0, jovem: 0, adulto: 0, idoso: 0, total: 0 }
            );

            const percent: Percent = {
                masculino: totals.total ? Math.round((100 * totals.masculino) / totals.total) : 0,
                feminino: totals.total ? Math.round((100 * totals.feminino) / totals.total) : 0,
                crianca: totals.total ? Math.round((100 * totals.crianca) / totals.total) : 0,
                jovem: totals.total ? Math.round((100 * totals.jovem) / totals.total) : 0,
                adulto: totals.total ? Math.round((100 * totals.adulto) / totals.total) : 0,
                idoso: totals.total ? Math.round((100 * totals.idoso) / totals.total) : 0,
            };

            const chartGenero = PT_WEEK.map((name, i) => ({
                name,
                Masculino: genero.masculino[i],
                Feminino: genero.feminino[i],
            }));

            const chartIdade = PT_WEEK.map((name, i) => ({
                name,
                Criança: idade.crianca[i],
                Jovem: idade.jovem[i],
                Adulto: idade.adulto[i],
                Idoso: idade.idoso[i],
            }));

            const totalCount = payload.totalItems ?? payload.total ?? vendas.length;
            const limit = payload.limit ?? norm.limit ?? vendas.length;
            const totalPages = payload.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(totalCount / limit)) : 1);
            const page = payload.currentPage ?? payload.page ?? norm.page ?? 1;

            return {
                data: vendas,
                total: totalCount,
                page,
                limit,
                totalPages,
                rows,
                totals,
                percent,
                chartGenero,
                chartIdade,
            };
        },
    });
}

export type { Row as PerfilRow, Totals as PerfilTotals, Percent as PerfilPercent };
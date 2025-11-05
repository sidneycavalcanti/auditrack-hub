// src/app/(private)/relatorios/avoperacional/hooks/useVendasPorHora.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { vendaAPI } from "@/services/api";

export type SemanaIndex = "1" | "2" | "3" | "4" | "5";

export type VendasHoraRow = {
    intervalo: string;        // "09:00 / 10:00"
    valores: number[];        // 7 colunas (dom..sab)
    totalLinha: number;
};

export type VendasHoraPayload = {
    rows: VendasHoraRow[];
    totaisColuna: number[];          // 7 colunas (dom..sab)
    totalGeral: number;
    diasCabecalho: (number | null)[]; // nº do dia por coluna
    periodoTexto: string;
};

export type VendasHoraFilters =
    | { lojaId?: number; ano?: number; mes?: number; semana?: SemanaIndex }               // semana do mês
    | { lojaId?: number; dateFrom?: string; dateTo?: string };                            // faixa de datas

const EMPTY: VendasHoraPayload = {
    rows: [],
    totaisColuna: Array(7).fill(0),
    totalGeral: 0,
    diasCabecalho: Array(7).fill(null),
    periodoTexto: "",
};

export function useVendasPorHora(filters: VendasHoraFilters | null, opts?: { enabled?: boolean }) {
    const hasWeekParams = !!(filters && "semana" in filters && filters.lojaId && filters.ano && filters.mes && filters.semana);
    const hasRangeParams = !!(filters && "dateFrom" in filters && filters.lojaId && filters.dateFrom && filters.dateTo);
    const enabled = (opts?.enabled ?? true) && (hasWeekParams || hasRangeParams);

    return useQuery({
        queryKey: ["vendas-por-hora-report", filters],
        enabled,
        placeholderData: EMPTY,
        queryFn: async (): Promise<VendasHoraPayload> => {
            if (!enabled) return EMPTY;
            const { data } = await vendaAPI.reports.porHora(filters as any);
            return data as VendasHoraPayload;
        },
        staleTime: 60_000,
    });
}
// src/app/(private)/relatorios/vendas/hooks/useRelatoriosAPI.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { vendaAPI } from "@/services/api";

/* ====== tipos retornados pela API ====== */
export type TurnoSlot = { valor: number; qtd: number };
export type Turnos = {
    geral: TurnoSlot;
    manha: TurnoSlot;
    tarde: TurnoSlot;
    noite: TurnoSlot;
};

export type ResumoRow = {
    label: string;
    kind: "valor" | "qtd" | "fluxo" | "perda";
    data: Turnos;
};

/* ====== Resumo Mensal ====== */
export function useResumoMensalReport(
    params: { lojaId?: number; ano?: number; mes?: number } | null,
    opts?: { enabled?: boolean }
) {
    const enabled = !!(params?.lojaId && params?.ano && params?.mes);
    return useQuery({
        queryKey: ["relatorio-resumo-mensal", params?.lojaId ?? null, params?.ano ?? null, params?.mes ?? null],
        enabled: (opts?.enabled ?? true) && enabled,
        queryFn: async (): Promise<{ periodo: { ano: number; mes: number }; lojaId: number; rows: ResumoRow[] }> => {
            const { lojaId, ano, mes } = params!;
            const { data } = await vendaAPI.reports.resumoMensal({ lojaId: lojaId!, ano: ano!, mes: mes! });
            return data;
        },
        staleTime: 60_000,
    });
}

/* ====== Resumo Diário ====== */
export function useResumoDiarioReport(
    params: { lojaId?: number; date?: string } | null,
    opts?: { enabled?: boolean }
) {
    const enabled = !!(params?.lojaId && params?.date);
    return useQuery({
        queryKey: ["relatorio-resumo-diario", params?.lojaId ?? null, params?.date ?? null],
        enabled: (opts?.enabled ?? true) && enabled,
        queryFn: async (): Promise<{ lojaId: number; date: string; rows: ResumoRow[] }> => {
            const { lojaId, date } = params!;
            const { data } = await vendaAPI.reports.resumoDiario({ lojaId: lojaId!, date: date! });
            return data;
        },
        staleTime: 60_000,
    });
}
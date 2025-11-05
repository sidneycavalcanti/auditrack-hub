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

    // helper: ISO -> BR (YYYY-MM-DD -> DD/MM/YYYY)
    const isoToBR = (iso: string) => {
        const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
    };

    return useQuery({
        queryKey: ["relatorio-resumo-diario", params?.lojaId ?? null, params?.date ?? null],
        enabled: (opts?.enabled ?? true) && enabled,
        queryFn: async (): Promise<{ lojaId: number; date: string; rows: ResumoRow[] }> => {
            const { lojaId, date } = params!;

            // Envia no formato que o backend espera (DD/MM/YYYY)
            const dateBR = isoToBR(date!);

            const { data } = await vendaAPI.reports.resumoDiario({ lojaId: lojaId!, date: dateBR });

            // Normalização defensiva (se vierem strings ou nulos, garante números)
            const rows: ResumoRow[] = (data?.rows ?? data?.resumo ?? []).map((r: any) => {
                const n = (x: any) => (x == null ? 0 : typeof x === "number" ? x : Number(String(x).replace(",", ".")) || 0);
                return {
                    label: r.label ?? r.item ?? "",
                    kind: (r.kind ?? "valor") as ResumoRow["kind"],
                    data: {
                        geral: { valor: n(r.data?.geral?.valor), qtd: n(r.data?.geral?.qtd) },
                        manha: { valor: n(r.data?.manha?.valor), qtd: n(r.data?.manha?.qtd) },
                        tarde: { valor: n(r.data?.tarde?.valor), qtd: n(r.data?.tarde?.qtd) },
                        noite: { valor: n(r.data?.noite?.valor), qtd: n(r.data?.noite?.qtd) },
                    },
                };
            });

            return { lojaId: data?.lojaId ?? lojaId!, date: data?.date ?? dateBR, rows };
        },
        staleTime: 60_000,
    });
}
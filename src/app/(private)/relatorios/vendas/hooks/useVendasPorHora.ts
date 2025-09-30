// src/app/(private)/relatorios/avoperacional/hooks/useVendasPorHora.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { vendaAPI } from "@/services/api";

/** chave estável e exclusiva deste relatório */
const QUERY_KEY = "vendas-por-hora";

export type SemanaIndex = 1 | 2 | 3 | 4 | 5;

export type VendasHoraFilters = {
    lojaId?: number;
    mes?: number;   // 1..12
    ano?: number;   // yyyy
    semana?: SemanaIndex;
    limit?: number;
};

export type VendasHoraRow = {
    intervalo: string;        // "09:00 / 10:00"
    valores: number[];        // 7 colunas (dom..sab)
    totalLinha: number;
};

export type VendasHoraPayload = {
    rows: VendasHoraRow[];
    totaisColuna: number[];         // 7 colunas (dom..sab)
    totalGeral: number;
    diasCabecalho: (number | null)[]; // 7 colunas com o nº do dia do mês (ou null)
    periodoTexto: string;           // "PRIMEIRA SEMANA - PERÍODO 01 À 07/12/2024"
};

function pad2(n: number) { return String(n).padStart(2, "0"); }

function diasNoMes(ano: number, mes1: number) {
    // mes1: 1..12  -> retorna qtd de dias no mês
    return new Date(ano, mes1, 0).getDate();
}

// semana → [diaInicial, diaFinal]
function rangeSemana(ano: number, mes1: number, semana: SemanaIndex) {
    const starts = [1, 8, 15, 22, 29] as const;
    const di = starts[semana - 1];
    const df = Math.min(di + 6, diasNoMes(ano, mes1));
    return { di, df };
}

function periodoLabel(ano: number, mes1: number, semana: SemanaIndex) {
    const nomes = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA"] as const;
    const { di, df } = rangeSemana(ano, mes1, semana);
    return `${nomes[semana - 1]} SEMANA - PERÍODO ${pad2(di)} À ${pad2(df)}/${pad2(mes1)}/${ano}`;
}

function dentroDaSemana(d: Date, ano: number, mes1: number, semana: SemanaIndex) {
    if (d.getFullYear() !== ano || (d.getMonth() + 1) !== mes1) return false;
    const { di, df } = rangeSemana(ano, mes1, semana);
    const dia = d.getDate();
    return dia >= di && dia <= df;
}

function diaCabecalhoPorColuna(ano: number, mes1: number, semana: SemanaIndex) {
    const { di, df } = rangeSemana(ano, mes1, semana);
    const out: (number | null)[] = Array(7).fill(null);
    for (let dia = di; dia <= df; dia++) {
        const dow = new Date(ano, mes1 - 1, dia).getDay(); // 0..6 (dom..sab)
        out[dow] = dia;
    }
    return out;
}

function intervaloLabel(h: number) {
    return `${pad2(h)}:00 / ${pad2(h + 1)}:00`;
}

/** Payload vazio para placeholder/estados sem dados */
const EMPTY_PAYLOAD: VendasHoraPayload = {
    rows: [],
    totaisColuna: Array(7).fill(0),
    totalGeral: 0,
    diasCabecalho: Array(7).fill(null),
    periodoTexto: "",
};

export function useVendasPorHora(
    filters: VendasHoraFilters,
    opts?: { enabled?: boolean }
) {
    const hasAll =
        !!filters?.lojaId && !!filters?.mes && !!filters?.ano && !!filters?.semana;

    const { lojaId, mes, ano, semana, limit = 8000 } = filters ?? {};

    return useQuery({
        // queryKey exclusiva e estável (evita colisão com outras queries de "vendas")
        queryKey: [
            QUERY_KEY,
            lojaId ?? null,
            mes ?? null,
            ano ?? null,
            semana ?? null,
            limit,
        ],
        enabled: (opts?.enabled ?? true) && hasAll,
        placeholderData: EMPTY_PAYLOAD,
        staleTime: 30_000,
        gcTime: 5 * 60_000,

        queryFn: async (): Promise<VendasHoraPayload> => {
            // segurança (não deveria cair aqui se enabled=false)
            if (!hasAll) return EMPTY_PAYLOAD;

            const { di, df } = rangeSemana(ano!, mes!, semana!);
            const dateFrom = `${ano}-${pad2(mes!)}-${pad2(di)}T00:00:00.000Z`;
            const dateTo = `${ano}-${pad2(mes!)}-${pad2(df)}T23:59:59.999Z`;

            // rota é /vendas (queryKey não precisa refletir a URL)
            const resp = await vendaAPI.getAll({
                lojaId, mes, ano, dateFrom, dateTo, page: 1, limit,
            } as any);

            const payload = resp.data as any;
            const list: any[] = Array.isArray(payload?.vendas) ? payload.vendas : [];

            if (list.length === 0) {
                return {
                    ...EMPTY_PAYLOAD,
                    diasCabecalho: diaCabecalhoPorColuna(ano!, mes!, semana!),
                    periodoTexto: periodoLabel(ano!, mes!, semana!),
                };
            }

            // grade: horas 09..23 (linha) × 7 dias (coluna)
            const horas = Array.from({ length: 15 }, (_, i) => 9 + i); // 9..23
            const matriz: number[][] = horas.map(() => Array(7).fill(0));

            // agrega
            for (const v of list) {
                try {
                    const dt = new Date(v.createdAt ?? v.auditoria?.data);
                    if (!dentroDaSemana(dt, ano!, mes!, semana!)) continue;

                    const dow = dt.getDay(); // 0..6
                    const h = dt.getHours(); // 0..23 (local)
                    if (dow < 0 || dow > 6) continue;
                    if (h < 9 || h > 23) continue;

                    const row = h - 9;
                    const valor = Number(v.valor) || 0;
                    matriz[row][dow] += valor;
                } catch {
                    // ignora registros malformados
                }
            }

            // monta rows
            const rows: VendasHoraRow[] = horas.map((h, idx) => {
                const valores = matriz[idx];
                const totalLinha = valores.reduce((a, b) => a + b, 0);
                return { intervalo: intervaloLabel(h), valores, totalLinha };
            });

            // totais por coluna e geral
            const totaisColuna = Array(7).fill(0);
            for (let c = 0; c < 7; c++) {
                for (let r = 0; r < matriz.length; r++) totaisColuna[c] += matriz[r][c];
            }
            const totalGeral = totaisColuna.reduce((a, b) => a + b, 0);

            return {
                rows,
                totaisColuna,
                totalGeral,
                diasCabecalho: diaCabecalhoPorColuna(ano!, mes!, semana!),
                periodoTexto: periodoLabel(ano!, mes!, semana!),
            };
        },
    });
}
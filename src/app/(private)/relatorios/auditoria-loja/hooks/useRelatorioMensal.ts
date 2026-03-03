"use client";

import { useQuery } from "@tanstack/react-query";
import { relatorioAPI } from "@/services/api";
import type { RelatorioMensalData } from "../types/auditoria";

interface Params {
  lojaId?: number;
  mes?: number;
  ano?: number;
}

export function useRelatorioMensal(params: Params | null, opts?: { enabled?: boolean }) {
  const enabled = !!(params?.lojaId && params?.mes && params?.ano);

  return useQuery({
    queryKey: ["relatorio-mensal", params?.lojaId ?? null, params?.mes ?? null, params?.ano ?? null],
    enabled: (opts?.enabled ?? true) && enabled,
    queryFn: async (): Promise<RelatorioMensalData> => {
      const { lojaId, mes, ano } = params!;
      const { data } = await relatorioAPI.mensal({
        lojaId: Number(lojaId),
        mes: Number(mes),
        ano: Number(ano),
      });
      return data;
    },
    staleTime: 60_000,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { fluxoAPI, handleApiError } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type FluxoPessoaRow = any;

type Filters = { lojaId?: number | string; mes?: number; ano?: number };

const QUERY_KEY = "relatorio_fluxo";

export function useFluxoPessoas(filters: Filters = {}, opts?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (opts?.enabled ?? true) && isAuthenticated;

  const lojaId = filters.lojaId ? Number(filters.lojaId) : undefined;

  return useQuery({
    queryKey: [QUERY_KEY, { lojaId, mes: filters.mes, ano: filters.ano }],
    enabled: enabled && !!lojaId && !!filters.mes && !!filters.ano,
    queryFn: async () => {
      try {
        const res = await fluxoAPI.getAll({ lojaId, mes: filters.mes, ano: filters.ano });
        const payload = res.data;

        const rows =
          payload?.fluxopessoa ?? payload?.fluxo ?? payload?.data ?? payload?.rows ?? payload ?? [];

        return { data: rows as FluxoPessoaRow[] };
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },
    staleTime: 60_000,
    placeholderData: (d) => d,
  });
}
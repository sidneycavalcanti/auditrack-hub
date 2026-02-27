"use client";

import { useQuery } from "@tanstack/react-query";
import { vendaAPI, handleApiError } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type VendaRow = {
  id: number;
  valor?: string;
  troca?: boolean;
  faixaetaria?: string;
  createdAt?: string;

  auditoria?: {
    id: number;
    data: string;
    loja?: { id: number; name: string };
  };

  sexo?: { id: number; name: string } | string;
};

type Filters = { lojaId?: number | string; mes?: number; ano?: number };

const QUERY_KEY = "relatorio_vendas";

export function useVendas(filters: Filters = {}, opts?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (opts?.enabled ?? true) && isAuthenticated;

  const lojaId = filters.lojaId ? Number(filters.lojaId) : undefined;

  return useQuery({
    queryKey: [QUERY_KEY, { lojaId, mes: filters.mes, ano: filters.ano }],
    enabled: enabled && !!lojaId && !!filters.mes && !!filters.ano,
    queryFn: async () => {
      try {
        const res = await vendaAPI.getAll({ lojaId, mes: filters.mes, ano: filters.ano });
        const payload = res.data;

        const rows: VendaRow[] =
          payload?.vendas ?? payload?.data ?? payload?.rows ?? payload ?? [];

        return { data: rows };
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },
    staleTime: 60_000,
    placeholderData: (d) => d,
  });
}
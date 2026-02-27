"use client";

import { useQuery } from "@tanstack/react-query";
import { api, handleApiError } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type VendaPerdidaRow = {
  id: number;
  categoria?: string;      // "Falta de Mercadoria", "Preço"...
  quantidade?: number;
  createdAt?: string;
  auditoria?: { data: string };
};

type Filters = {
  lojaId?: number | string;
  mes?: number;
  ano?: number;
};

const QUERY_KEY = "relatorio_vendas_perdidas";

const norm = (s?: string) =>
  (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function bucketCategoria(causa?: string) {
  const c = norm(causa);
  if (c.includes("preco") || c.includes("valor") || c.includes("caro")) return "preco";
  if (c.includes("falta") || c.includes("mercadoria") || c.includes("estoque")) return "faltaMercadoria";
  if (c.includes("modelo") || c.includes("cor") || c.includes("tamanho")) return "modeloCorTamanho";
  if (c.includes("pag") || c.includes("cartao") || c.includes("pix") || c.includes("forma")) return "formaPagamento";
  if (c.includes("atend")) return "atendimento";
  return "outros";
}

export function useVendasPerdidas(filters: Filters = {}, opts?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  const enabled = (opts?.enabled ?? true) && isAuthenticated;

  const lojaId = filters.lojaId ? Number(filters.lojaId) : undefined;
  const mes = filters.mes;
  const ano = filters.ano;

  return useQuery({
    queryKey: [QUERY_KEY, { lojaId, mes, ano }],
    enabled: enabled && !!lojaId && !!mes && !!ano,
    queryFn: async () => {
      try {
        const params: Record<string, any> = { lojaId, mes, ano };

        // 🔁 ajuste endpoint conforme seu backend (ex: "/vendasperdidas" etc)
        const res = await api.get("/vendas-perdidas", { params });

        const payload = res.data;
        const rows: VendaPerdidaRow[] =
          payload?.perdas ??
          payload?.data ??
          payload?.rows ??
          payload ??
          [];

        const aggregated = rows.map((r) => ({
          ...r,
          bucket: bucketCategoria(r.categoria),
          qtd: typeof r.quantidade === "number" ? r.quantidade : 1,
        }));

        return { data: rows, aggregated };
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },
    staleTime: 60 * 1000,
    placeholderData: (d) => d,
  });
}
"use client";

import * as React from "react";

export type PerdaRow = {
  id: number;
  categoria: string;        // categoria dinâmica
  quantidade?: number;      // se não existir, usamos 1
  createdAt?: string;
  auditoria?: { data: string };
  loja?: { id: number; name: string };
};

type Filters = {
  lojaId?: number | string;
  mes?: number;
  ano?: number;
};

export function usePerdasVendas(filters: Filters = {}, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;

  const [data, setData] = React.useState<{ perdas: PerdaRow[] } | { data: PerdaRow[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    if (!enabled) return;
    if (!filters.lojaId || !filters.mes || !filters.ano) return;

    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL não configurada");

        const params = new URLSearchParams();
        params.set("lojaId", String(filters.lojaId));
        params.set("mes", String(filters.mes));
        params.set("ano", String(filters.ano));

        const res = await fetch(`${API_URL}/perdas-vendas?${params.toString()}`, {
          cache: "no-store",
        });

        if (res.status === 204) {
          if (!cancelled) setData({ perdas: [] });
          return;
        }

        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, filters.lojaId, filters.mes, filters.ano]);

  return { data, isLoading, error };
}
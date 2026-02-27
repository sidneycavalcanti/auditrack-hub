"use client";

import * as React from "react";

export type Loja = {
  id: number;
  name: string;
  ativa?: boolean;     // ou status, ativo, etc
  inativa?: boolean;   // caso backend use isso
};

type Filters = {
  includeInativas?: boolean;
};

export function useLojas(filters: Filters = {}, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;

  const [data, setData] = React.useState<{ lojas: Loja[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL não configurada");

        const params = new URLSearchParams();
        params.set("includeInativas", filters.includeInativas ? "1" : "0");

        const res = await fetch(`${API_URL}/lojas?${params.toString()}`, {
          cache: "no-store",
        });

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
  }, [enabled, filters.includeInativas]);

  return { data, isLoading, error };
}
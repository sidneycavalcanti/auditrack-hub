// src/app/(private)/relatorios/fluxos/hooks/useFluxoPessoas.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fluxoAPI } from "@/services/api";
import type { FilterOptions, PaginatedResponse } from "@/types";

export type FluxoPessoa = {
  id: number;
  lojaId?: number;
  auditoriaId?: number;
  categoria?: string;                // ex.: "outros"
  sexo?: string;                     // "masculino" | "feminino" | "outros"
  quantidade?: number;               // pode vir 0; se faltar, assumimos 1
  createdAt?: string;
  updatedAt?: string;
  loja?: { id: number; name?: string; descricao?: string };
  auditoria?: { id: number; data?: string };
};

export type FluxoFilters = FilterOptions & {
  lojaId?: number;
  mes?: number;             // 1..12
  ano?: number;             // ex.: 2025
  sexo?: string;            // "masculino" | "feminino" | "outros"
  categoria?: string;
  dateFrom?: string;        // ISO yyyy-mm-dd
  dateTo?: string;          // ISO yyyy-mm-dd
};

const QUERY_KEY = "fluxo";

const normalize = (f: FluxoFilters = {}) => ({
  page: f.page ?? 1,
  limit: f.limit ?? 1000,
  lojaId: f.lojaId ?? undefined,
  mes: f.mes ?? undefined,
  ano: f.ano ?? undefined,
  sexo: f.sexo ?? undefined,
  categoria: f.categoria ?? undefined,
  dateFrom: f.dateFrom ?? undefined,
  dateTo: f.dateTo ?? undefined,
  search: f.search ?? f.name ?? undefined,
});

export function useFluxoPessoas(filters: FluxoFilters = {}, opts?: { enabled?: boolean }) {
  const norm = normalize(filters);

  return useQuery<PaginatedResponse<FluxoPessoa>>({
    queryKey: [QUERY_KEY, norm],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      const res = await fluxoAPI.getAll(norm as any);
      const payload = res.data as any;

      // o backend pode mandar "fluxo", "fluxopessoa" ou "fluxopessoas"
      const listRaw: any[] =
        Array.isArray(payload?.fluxo) ? payload.fluxo :
        Array.isArray(payload?.fluxopessoa) ? payload.fluxopessoa :
        Array.isArray(payload?.fluxopessoas) ? payload.fluxopessoas :
        [];

      // mapeia pro tipo do front
      let items: FluxoPessoa[] = listRaw.map((it: any) => ({
        id: it.id,
        lojaId: it.lojaId ?? it.loja?.id,
        auditoriaId: it.auditoriaId ?? it.auditoria?.id,
        categoria: it.categoria,
        sexo: it.sexo,
        quantidade: typeof it.quantidade === "number" ? it.quantidade : undefined,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        loja: it.loja,
        auditoria: it.auditoria, // contém data "YYYY-MM-DD"
      }));

      // fallback de filtros locais (caso o backend não aplique)
      if (norm.lojaId || norm.mes || norm.ano || norm.sexo) {
        items = items.filter((r) => {
          const lojaOk = norm.lojaId ? r.lojaId === norm.lojaId : true;

          const data = r.auditoria?.data ?? r.createdAt ?? "";
          const y = data ? Number(String(data).slice(0, 4)) : undefined;
          const m = data ? Number(String(data).slice(5, 7)) : undefined;
          const anoOk = norm.ano ? y === norm.ano : true;
          const mesOk = norm.mes ? m === norm.mes : true;

          const sexoOk = norm.sexo ? (r.sexo?.toLowerCase() === norm.sexo.toLowerCase()) : true;

          return lojaOk && anoOk && mesOk && sexoOk;
        });
      }

      const total = payload.totalItems ?? payload.total ?? items.length;
      const limit = (payload.limit ?? norm.limit ?? items.length) || 10;
      const totalPages = payload.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
      const page = payload.currentPage ?? payload.page ?? norm.page ?? 1;

      return { data: items, total, totalPages, page, limit };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (d) => d,
  });
}
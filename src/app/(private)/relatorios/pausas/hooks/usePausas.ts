// src/app/(private)/relatorios/pausas/hooks/usePausas.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { pausaAPI } from "@/services/api";
import type { Pausa, FilterOptions, PaginatedResponse } from "@/types";

const QUERY_KEY = "pausas";

export type PausasFilters = FilterOptions & {
  lojaId?: number;
  usuarioId?: number;
  motivoDePausaId?: number;
  mes?: number;
  ano?: number;
  dia?: number;
  dateFrom?: string;
  dateTo?: string;
};

const normalize = (f: PausasFilters = {}) => ({
  page: f.page ?? 1,
  limit: f.limit ?? 1000,
  lojaId: f.lojaId ?? undefined,
  usuarioId: f.usuarioId ?? undefined,
  motivoDePausaId: f.motivoDePausaId ?? undefined,
  mes: f.mes ?? undefined,
  ano: f.ano ?? undefined,
  dia: f.dia ?? undefined,
  dateFrom: f.dateFrom ?? undefined,
  dateTo: f.dateTo ?? undefined,
});

const pad2 = (n: number) => String(n).padStart(2, "0");

export function buildDayFilters(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const ymd = `${y}-${pad2(m)}-${pad2(day)}`;
  return {
    mes: m,
    ano: y,
    dateOnly: ymd,
    dateFrom: `${ymd}T00:00:00.000Z`,
    dateTo: `${ymd}T23:59:59.999Z`,
  } as const;
}

export function filterPausasByDay<T extends { auditoria?: { data?: string }; createdAt?: string }>(
  items: T[],
  dateOnly: string
): T[] {
  const d = (s?: string) => (s ?? "").slice(0, 10);
  return items.filter((it) => d(it.auditoria?.data ?? it.createdAt) === dateOnly);
}

/* ---------- helpers p/ ler ids mesmo quando vêm aninhados ---------- */
function getUsuarioId(p: any): number | undefined {
  return p?.usuarioId ?? p?.auditoria?.usuarioId ?? p?.auditoria?.usuario?.id ?? p?.usuario?.id;
}
function getLojaId(p: any): number | undefined {
  return p?.lojaId ?? p?.auditoria?.lojaId ?? p?.auditoria?.loja?.id;
}
function getMotivoId(p: any): number | undefined {
  return p?.motivoDePausaId ?? p?.motivodepausaId ?? p?.motivodepausa?.id;
}

export function usePausas(filters: PausasFilters = {}, opts?: { enabled?: boolean }) {
  const norm = normalize(filters);

  return useQuery<PaginatedResponse<Pausa>>({
    queryKey: [QUERY_KEY, norm],
    enabled: opts?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    placeholderData: (d) => d,

    queryFn: async () => {
      const res = await pausaAPI.getAll(norm as any);
      const payload = res.data as any;

      const list: any[] =
        Array.isArray(payload?.pausas)
          ? payload.pausas
          : Array.isArray(payload)
          ? payload
          : [];

      let items: Pausa[] = list.map((p: any) => ({
        id: p.id,
        auditoriaId: p.auditoriaId ?? p.auditoria?.id,
        usuarioId: getUsuarioId(p),
        motivoDePausaId: getMotivoId(p) ?? 0,
        duracao: Number(p.duracao) || 0,
        observacoes: p.observacoes ?? p.obs ?? p.observacao,
        auditoria: p.auditoria,
        motivoDepausa: p.motivodepausa ?? p.motivoDePausa,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      // Fallback de filtros locais, caso o back não aplique todos
      if (norm.lojaId || norm.usuarioId || norm.motivoDePausaId || norm.ano || norm.mes || norm.dia || norm.dateFrom || norm.dateTo) {
        items = items.filter((it) => {
          const dISO = (it as any)?.auditoria?.data ?? (it as any)?.createdAt ?? "";
          const y = dISO ? Number(dISO.slice(0, 4)) : undefined;
          const m = dISO ? Number(dISO.slice(5, 7)) : undefined;
          const day = dISO ? Number(dISO.slice(8, 10)) : undefined;

          if (norm.ano && y !== norm.ano) return false;
          if (norm.mes && m !== norm.mes) return false;
          if (norm.dia && day !== norm.dia) return false;

          const lojaId = getLojaId(it);
          if (norm.lojaId && lojaId !== norm.lojaId) return false;

          const usuarioId = getUsuarioId(it);
          if (norm.usuarioId && usuarioId !== norm.usuarioId) return false;

          const motivoId = getMotivoId(it);
          if (norm.motivoDePausaId && motivoId !== norm.motivoDePausaId) return false;

          const dYMD = dISO.slice(0, 10);
          const fromYM = norm.dateFrom?.slice(0, 10);
          const toYM = norm.dateTo?.slice(0, 10);
          if (fromYM && (!dYMD || dYMD < fromYM)) return false;
          if (toYM && (!dYMD || dYMD > toYM)) return false;

          return true;
        });
      }

      const total = payload.totalItems ?? payload.total ?? items.length;
      const limit = (payload.limit ?? norm.limit ?? items.length) || 10;
      const totalPages = payload.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
      const page = payload.currentPage ?? payload.page ?? norm.page ?? 1;

      return { data: items, total, totalPages, page, limit };
    },
  });
}
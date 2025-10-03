// src/app/(private)/relatorios/avoperacional/hooks/useVendas.ts
"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { vendaAPI } from "@/services/api";
import type { FilterOptions, PaginatedResponse, Venda } from "@/types";

/** chave estável */
const QUERY_KEY = "vendas";

/** filtros estendidos p/ vendas */
export type VendasFilters = FilterOptions & {
  mes?: number;      // 1..12
  ano?: number;      // ex: 2025
  lojaId?: number;
  auditorId?: number;
  formaPagamentoId?: number;
  sexoId?: number;   // 1=masc, 2=fem
  valorMin?: number;
  valorMax?: number;
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
  troca?: boolean;
};

const normalize = (f: VendasFilters = {}) => ({
  page: f.page ?? 1,
  limit: f.limit ?? 1000,
  search: f.search ?? f.name ?? undefined,

  mes: f.mes ?? undefined,
  ano: f.ano ?? undefined,
  lojaId: f.lojaId ?? undefined,

  auditorId: f.auditorId ?? undefined,
  formaPagamentoId: f.formaPagamentoId ?? undefined,
  sexoId: f.sexoId ?? undefined,
  valorMin: f.valorMin ?? undefined,
  valorMax: f.valorMax ?? undefined,
  dateFrom: f.dateFrom ?? undefined,
  dateTo: f.dateTo ?? undefined,
  troca: f.troca ?? undefined,
});

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Converte strings de dinheiro para número.
 * Aceita: "780,00" | "780.00" | "1.234,56" | "1,234.56" | 451.87
 */
function toNumber(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;

  const s = v.trim();
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  let normalized = s;

  if (hasComma && hasDot) {
    // Decide o separador decimal pela última ocorrência
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      // padrão pt-BR: 1.234,56
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      // padrão en-US: 1,234.56
      normalized = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // "780,00" -> "780.00"
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    // "780.00" ou "780" -> mantém
    normalized = s.replace(/,/g, "");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function useVendas(filters: VendasFilters = {}, opts?: { enabled?: boolean }) {
  const norm = normalize(filters);

  return useQuery<PaginatedResponse<Venda>>({
    queryKey: [QUERY_KEY, norm],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      const res = await vendaAPI.getAll(norm as any);
      const payload = res.data as any;

      // resposta -> payload.vendas
      const list: any[] = Array.isArray(payload?.vendas) ? payload.vendas : [];

      // mapeia para o tipo do front
      let items: Venda[] = list.map((v: any) => ({
        id: v.id,
        auditoriaId: v.auditoriaId ?? v.auditoria?.id,
        valor: toNumber(v.valor),
        formaPagamentoId: v.formadepagamentoId ?? v.formaPagamentoId ?? v.formaPagamento?.id,
        quantidade: v.quantidade ?? 1,

        // datas e metadados
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        auditoria: v.auditoria, // { data, loja, usuario }
        formaPagamento: v.formadepagamento ?? v.formaPagamento,

        sexoId: v.sexoId ?? v.sexo?.id,
        troca: v.troca ?? false,
        faixaetaria: v.faixaetaria,
      }));

      // fallback local (se backend não aplicar todos os filtros)
      if (
        norm.mes || norm.ano || norm.lojaId ||
        norm.sexoId || norm.valorMin != null || norm.valorMax != null ||
        norm.dateFrom || norm.dateTo || norm.troca != null
      ) {
        items = items.filter((it) => {
          // prioriza auditoria.data; se ausente, cai para createdAt
          const dISO = (it.auditoria?.data as string | undefined) ?? (it.createdAt?.slice(0, 10) as string | undefined);
          const y = dISO ? Number(dISO.slice(0, 4)) : undefined;
          const m = dISO ? Number(dISO.slice(5, 7)) : undefined;

          if (norm.ano && y !== norm.ano) return false;
          if (norm.mes && m !== norm.mes) return false;
          if (norm.lojaId && it.auditoria?.loja?.id !== norm.lojaId) return false;

          // sexo
          // @ts-expect-error
          if (norm.sexoId && it.sexoId !== norm.sexoId) return false;

          if (norm.valorMin != null && it.valor < norm.valorMin) return false;
          if (norm.valorMax != null && it.valor > norm.valorMax) return false;

          // ✅ compara apenas "YYYY-MM-DD" para evitar problemas com fuso/UTC
          const dYMD = (dISO ?? "").slice(0, 10);
          const fromYM = norm.dateFrom?.slice(0, 10);
          const toYM = norm.dateTo?.slice(0, 10);
          if (fromYM && (!dYMD || dYMD < fromYM)) return false;
          if (toYM && (!dYMD || dYMD > toYM)) return false;

          // @ts-expect-error
          if (norm.troca != null && !!it.troca !== !!norm.troca) return false;

          return true;
        });
      }

      const total = payload.totalItems ?? payload.total ?? items.length;
      const limit = (payload.limit ?? norm.limit ?? items.length) || 10;
      const totalPages = payload.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
      const page = payload.currentPage ?? payload.page ?? norm.page ?? 1;

      return { data: items, total, totalPages, page, limit };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (d) => d, // “keep previous data”
  });
}

/**
 * Constrói filtros de "um dia" prontos para enviar ao backend.
 * - dateOnly: "YYYY-MM-DD" (útil para filtros locais)
 * - dateFrom/dateTo: limites UTC do dia (ISO)
 * - mes/ano: conveniência
 */
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

/**
 * Corta a lista de vendas exatamente para o dia informado (YYYY-MM-DD),
 * priorizando auditoria.data; se ausente, usa createdAt.
 */
export function filterVendasByDay<T extends { auditoria?: { data?: string }; createdAt?: string }>(
  items: T[],
  dateOnly: string
): T[] {
  const d = (s?: string) => (s ?? "").slice(0, 10);
  return items.filter((it) => d(it.auditoria?.data ?? it.createdAt) === dateOnly);
}
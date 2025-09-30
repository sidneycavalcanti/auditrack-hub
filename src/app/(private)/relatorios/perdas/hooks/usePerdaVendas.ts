// src/app/(private)/relatorios/perdas/hooks/usePerdaVendas.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { perdaAPI } from "@/services/api";
import type { FilterOptions, PaginatedResponse } from "@/types";

export type PerdaVenda = {
    id: number;
    obs?: string;
    motivoId?: number;
    motivoName?: string;
    lojaId?: number;
    auditoriaId?: number;
    createdAt?: string;
    updatedAt?: string;

    auditoria?: { id: number; data?: string; loja?: { id: number; name?: string; descricao?: string } };
    motivoperdas?: { id: number; name?: string };
};

export type PerdaFilters = FilterOptions & {
    lojaId?: number;
    mes?: number;
    ano?: number;
    motivoId?: number;
    motivo?: string;        // texto livre para filtrar por nome de motivo
    dateFrom?: string;
    dateTo?: string;
};

const QUERY_KEY = "perdas";

const normalize = (f: PerdaFilters = {}) => ({
    page: f.page ?? 1,
    limit: f.limit ?? 1000,
    lojaId: f.lojaId ?? undefined,
    mes: f.mes ?? undefined,
    ano: f.ano ?? undefined,
    motivoId: f.motivoId ?? undefined,
    motivo: f.motivo ?? undefined,
    dateFrom: f.dateFrom ?? undefined,
    dateTo: f.dateTo ?? undefined,
    search: f.search ?? f.name ?? undefined,
});

export function usePerdaVendas(filters: PerdaFilters = {}, opts?: { enabled?: boolean }) {
    const norm = normalize(filters);

    return useQuery<PaginatedResponse<PerdaVenda>>({
        queryKey: [QUERY_KEY, norm],
        enabled: opts?.enabled ?? true,
        queryFn: async () => {
            const res = await perdaAPI.getAll(norm as any);
            const payload = res.data as any;

            const listRaw: any[] = Array.isArray(payload?.perdas) ? payload.perdas : [];

            let items: PerdaVenda[] = listRaw.map((it: any) => ({
                id: it.id,
                obs: it.obs,
                motivoId: it.motivoperdas?.id ?? it.motivoId,
                motivoName: it.motivoperdas?.name ?? it.motivoName,
                lojaId: it.lojaId ?? it.auditoria?.loja?.id,
                auditoriaId: it.auditoriaId ?? it.auditoria?.id,
                createdAt: it.createdAt,
                updatedAt: it.updatedAt,
                auditoria: it.auditoria,
                motivoperdas: it.motivoperdas,
            }));

            // filtros locais caso a API não aplique todos
            if (norm.lojaId || norm.mes || norm.ano || norm.motivoId || norm.motivo) {
                const normTxt = (s?: string) =>
                    (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

                items = items.filter((r) => {
                    const lojaOk = norm.lojaId ? r.lojaId === norm.lojaId : true;

                    const data = r.auditoria?.data ?? r.createdAt ?? "";
                    const y = data ? Number(String(data).slice(0, 4)) : undefined;
                    const m = data ? Number(String(data).slice(5, 7)) : undefined;
                    const anoOk = norm.ano ? y === norm.ano : true;
                    const mesOk = norm.mes ? m === norm.mes : true;

                    const motivoIdOk = norm.motivoId ? r.motivoId === norm.motivoId : true;
                    const motivoTxtOk = norm.motivo
                        ? normTxt(r.motivoName).includes(normTxt(norm.motivo))
                        : true;

                    return lojaOk && anoOk && mesOk && motivoIdOk && motivoTxtOk;
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
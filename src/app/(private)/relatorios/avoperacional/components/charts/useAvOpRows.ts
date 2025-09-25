"use client";
import * as React from "react";
import type { AvOperacional } from "@/types";

export type AvOpRow = { data: string; loja: string; questao: string; score: number };

export function useAvOpRows(items: AvOperacional[]) {
    return React.useMemo<AvOpRow[]>(() => {
        return items
            .map((it) => {
                const data = it.auditoria?.data?.slice(0, 10) ?? "";
                const loja =
                    (it.auditoria as any)?.loja?.name ??
                    (it.auditoria as any)?.loja?.descricao ??
                    `Loja ${it.auditoria?.loja?.id ?? "-"}`;
                const raw = (it as any).pontuacao ?? (it as any).nota;
                const score = Number(raw);
                const questao =
                    it.cadAvOperacional?.descricao ??
                    (it as any).cadAvOperacional?.name ??
                    String(it.cadAvOperacionalId ?? "—");

                return { data, loja, questao, score };
            })
            .filter((r) => r.data && Number.isFinite(r.score));
    }, [items]);
}
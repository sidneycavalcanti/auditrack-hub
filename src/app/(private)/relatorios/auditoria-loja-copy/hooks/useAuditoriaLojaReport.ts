"use client";

import * as React from "react";
import type { AudReportData } from "../types/auditoria";

import { useFluxoPessoas } from "./useFluxoPessoas";
import { useVendas } from "./useVendas";
import { useVendasPerdidas } from "./useVendasPerdidas";

type Filters = {
  lojaId?: number | string;
  lojaNome?: string;
  muc?: string;
  mes?: number; // 1-12
  ano?: number;
};

const DOW = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const SEMANAS = ["1ª Semana","2ª Semana","3ª Semana","4ª Semana"];

const norm = (s?: string) =>
  (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function mesNomePtBr(mes?: number) {
  const nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return mes ? (nomes[mes - 1] ?? "—") : "—";
}

function weekOfMonthLabel(date: Date) {
  const w = Math.min(4, Math.max(1, Math.ceil(date.getDate() / 7)));
  return `${w}ª Semana`;
}

function toShortDow(dia: string) {
  return dia === "Segunda-feira" ? "Segunda" :
    dia === "Terça-feira" ? "Terça" :
    dia === "Quarta-feira" ? "Quarta" :
    dia === "Quinta-feira" ? "Quinta" :
    dia === "Sexta-feira" ? "Sexta" :
    dia;
}

function buildEmptyReport(filters: Filters): AudReportData {
  return {
    meta: {
      loja: filters.lojaNome ?? "—",
      muc: filters.muc ?? "—",
      mes: mesNomePtBr(filters.mes),
      ano: typeof filters.ano === "number" ? filters.ano : new Date().getFullYear(),
    },

    fluxoPorGrupo: [
      { name: "Vendas Realizadas", value: 0 },
      { name: "Acompanhantes", value: 0 },
      { name: "Vendas Perdidas Identificadas", value: 0 },
      { name: "Possíveis Vendas Perdidas", value: 0 },
      { name: "Outros", value: 0 },
    ],

    fluxoPorDiaSemana: DOW.map((dia) => ({
      dia, vendasRealizadas: 0, acompanhantes: 0, vendasPerdidasIdentificadas: 0,
      possiveisVendasPerdidas: 0, outros: 0, trocas: 0,
    })),

    perdasPorGrupo: [
      { name: "Preço", value: 0 },
      { name: "Falta de Mercadoria", value: 0 },
      { name: "Modelo / Cor / Tamanho", value: 0 },
      { name: "Forma de Pagamento", value: 0 },
      { name: "Atendimento", value: 0 },
      { name: "Outros", value: 0 },
    ],

    perdasPorDiaSemana: DOW.map((dia) => ({
      dia, preco: 0, faltaMercadoria: 0, modeloCorTamanho: 0, formaPagamento: 0, atendimento: 0, outros: 0,
    })),

    perfilPorIdade: DOW.map((dia) => ({ dia: toShortDow(dia), crianca: 0, adulto: 0, idoso: 0 })),
    fluxoPorSemanaMes: SEMANAS.map((semana) => ({ semana, crianca: 0, adulto: 0, idoso: 0 })),
    compradoresPorGenero: DOW.map((dia) => ({ dia, feminino: 0, masculino: 0 })),

    clientesCompraramVsNao: { compraram: 0, naoCompraram: 0, total: 0 },
    conversaoGeral: { totalFluxo: 0, totalVendas: 0, aproveitamento: 0 },
    ticketMedioGeral: 0,
  };
}

export function useAuditoriaLojaReport(filters: Filters = {}, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;
  const canRun = enabled && !!filters.lojaId && !!filters.mes && !!filters.ano;

  const qFluxo = useFluxoPessoas({ lojaId: filters.lojaId, mes: filters.mes, ano: filters.ano }, { enabled: canRun });
  const qVendas = useVendas({ lojaId: filters.lojaId, mes: filters.mes, ano: filters.ano }, { enabled: canRun });
  const qPerdas = useVendasPerdidas({ lojaId: filters.lojaId, mes: filters.mes, ano: filters.ano }, { enabled: canRun });

const fluxoRows = qFluxo.data?.data ?? [];
const vendasRows = qVendas.data?.data ?? [];
const perdasAgg = qPerdas.data?.aggregated ?? [];

  

  const report: AudReportData = React.useMemo(() => {
    if (!canRun) return buildEmptyReport(filters);

    // mês sem dados -> tudo zerado
    if (!fluxoRows.length && !vendasRows.length && !perdasAgg.length) return buildEmptyReport(filters);

    const lojaNome =
      filters.lojaNome ??
      fluxoRows?.[0]?.loja?.name ??
      vendasRows?.[0]?.auditoria?.loja?.name ??
      "—";

    const meta: AudReportData["meta"] = {
      loja: lojaNome,
      muc: filters.muc ?? "—",
      mes: mesNomePtBr(filters.mes),
      ano: typeof filters.ano === "number" ? filters.ano : new Date().getFullYear(),
    };

    // ======================
    // FLUXO - por grupo e por dia
    // ======================
    const grupoTotals = {
      vendasRealizadas: 0,
      acompanhantes: 0,
      vendasPerdidasIdentificadas: 0,
      possiveisVendasPerdidas: 0,
      outros: 0,
    };

    const fluxoPorDiaMap = new Map<string, AudReportData["fluxoPorDiaSemana"][number]>();

    for (const r of fluxoRows) {
      const dStr = r.auditoria?.data ?? r.createdAt ?? "";
      const date = dStr ? new Date(dStr) : null;
      const dia = date ? DOW[date.getDay()] : "—";

      const item = fluxoPorDiaMap.get(dia) ?? {
        dia,
        vendasRealizadas: 0,
        acompanhantes: 0,
        vendasPerdidasIdentificadas: 0,
        possiveisVendasPerdidas: 0,
        outros: 0,
        trocas: 0,
      };

      const qtd = typeof r.quantidade === "number" ? r.quantidade : 0;
      const cat = norm(r.categoria);

      if (cat.includes("venda") && (cat.includes("real") || cat.includes("realiz"))) {
        grupoTotals.vendasRealizadas += qtd;
        item.vendasRealizadas += qtd;
      } else if (cat.includes("acomp")) {
        grupoTotals.acompanhantes += qtd;
        item.acompanhantes += qtd;
      } else if (cat.includes("perdid") && (cat.includes("ident") || cat.includes("identific"))) {
        grupoTotals.vendasPerdidasIdentificadas += qtd;
        item.vendasPerdidasIdentificadas += qtd;
      } else if (cat.includes("poss") && cat.includes("perd")) {
        grupoTotals.possiveisVendasPerdidas += qtd;
        item.possiveisVendasPerdidas += qtd;
      } else {
        grupoTotals.outros += qtd;
        item.outros += qtd;
      }

      fluxoPorDiaMap.set(dia, item);
    }

    // trocas vindo de vendas
    for (const v of vendasRows) {
      if (!v.troca) continue;
      const dStr = v.auditoria?.data ?? v.createdAt ?? "";
      const date = dStr ? new Date(dStr) : null;
      const dia = date ? DOW[date.getDay()] : "—";

      const item = fluxoPorDiaMap.get(dia) ?? {
        dia, vendasRealizadas: 0, acompanhantes: 0, vendasPerdidasIdentificadas: 0,
        possiveisVendasPerdidas: 0, outros: 0, trocas: 0,
      };

      item.trocas += 1;
      fluxoPorDiaMap.set(dia, item);
    }

    const fluxoPorDiaSemana = DOW.map((dia) => fluxoPorDiaMap.get(dia) ?? {
      dia, vendasRealizadas: 0, acompanhantes: 0, vendasPerdidasIdentificadas: 0,
      possiveisVendasPerdidas: 0, outros: 0, trocas: 0,
    });

    const somaGrupo =
      grupoTotals.vendasRealizadas +
      grupoTotals.acompanhantes +
      grupoTotals.vendasPerdidasIdentificadas +
      grupoTotals.possiveisVendasPerdidas +
      grupoTotals.outros;

    const toPct = (n: number) => (somaGrupo > 0 ? (n / somaGrupo) * 100 : 0);

    const fluxoPorGrupo = [
      { name: "Vendas Realizadas", value: toPct(grupoTotals.vendasRealizadas) },
      { name: "Acompanhantes", value: toPct(grupoTotals.acompanhantes) },
      { name: "Vendas Perdidas Identificadas", value: toPct(grupoTotals.vendasPerdidasIdentificadas) },
      { name: "Possíveis Vendas Perdidas", value: toPct(grupoTotals.possiveisVendasPerdidas) },
      { name: "Outros", value: toPct(grupoTotals.outros) },
    ];

    // ======================
    // PERFIL - compradores por gênero (VENDAS)
    // ======================
    const generoMap = new Map<string, { dia: string; feminino: number; masculino: number }>();

    for (const v of vendasRows) {
      const dStr = v.auditoria?.data ?? v.createdAt ?? "";
      const date = dStr ? new Date(dStr) : null;
      const dia = date ? DOW[date.getDay()] : "—";

      const item = generoMap.get(dia) ?? { dia, feminino: 0, masculino: 0 };
      const sx = norm((v.sexo as any)?.name ?? (v.sexo as any) ?? "");
      if (sx.startsWith("fem")) item.feminino += 1;
      else if (sx.startsWith("mas")) item.masculino += 1;

      generoMap.set(dia, item);
    }

    const compradoresPorGenero = DOW.map((dia) => generoMap.get(dia) ?? { dia, feminino: 0, masculino: 0 });

    // ======================
    // PERFIL - idade por DIA (VENDAS)
    // (no Excel tem jovem, aqui soma jovem dentro de adulto)
    // ======================
    const idadeDiaMap = new Map<string, { dia: string; crianca: number; adulto: number; idoso: number }>();

    for (const v of vendasRows) {
      const dStr = v.auditoria?.data ?? v.createdAt ?? "";
      const date = dStr ? new Date(dStr) : null;
      const dia = date ? DOW[date.getDay()] : "—";

      const item = idadeDiaMap.get(dia) ?? { dia, crianca: 0, adulto: 0, idoso: 0 };
      const fx = norm(v.faixaetaria ?? "");

      if (fx.startsWith("cri")) item.crianca += 1;
      else if (fx.startsWith("ido")) item.idoso += 1;
      else item.adulto += 1; // jovem/adulto -> adulto

      idadeDiaMap.set(dia, item);
    }

    const perfilPorIdade = DOW.map((dia) => {
      const base = idadeDiaMap.get(dia) ?? { dia, crianca: 0, adulto: 0, idoso: 0 };
      return { ...base, dia: toShortDow(base.dia) };
    });

    // ======================
    // PERFIL - idade por SEMANA (VENDAS)
    // ======================
    const idadeSemanaMap = new Map<string, { semana: string; crianca: number; adulto: number; idoso: number }>();

    for (const v of vendasRows) {
      const dStr = v.auditoria?.data ?? v.createdAt ?? "";
      const date = dStr ? new Date(dStr) : null;
      if (!date) continue;

      const semana = weekOfMonthLabel(date);
      const item = idadeSemanaMap.get(semana) ?? { semana, crianca: 0, adulto: 0, idoso: 0 };

      const fx = norm(v.faixaetaria ?? "");
      if (fx.startsWith("cri")) item.crianca += 1;
      else if (fx.startsWith("ido")) item.idoso += 1;
      else item.adulto += 1;

      idadeSemanaMap.set(semana, item);
    }

    const fluxoPorSemanaMes = SEMANAS.map((s) => idadeSemanaMap.get(s) ?? { semana: s, crianca: 0, adulto: 0, idoso: 0 });

    // ======================
    // PERDAS - por grupo e por dia (6 buckets fixos)
    // ======================
    const perdasTot = {
      preco: 0,
      faltaMercadoria: 0,
      modeloCorTamanho: 0,
      formaPagamento: 0,
      atendimento: 0,
      outros: 0,
    };

    const perdasDiaMap = new Map<string, AudReportData["perdasPorDiaSemana"][number]>();

    for (const p of perdasAgg) {
      const dStr = p.auditoria?.data ?? p.createdAt ?? "";
      const date = dStr ? new Date(dStr) : null;
      const dia = date ? DOW[date.getDay()] : "—";

      const item = perdasDiaMap.get(dia) ?? {
        dia,
        preco: 0,
        faltaMercadoria: 0,
        modeloCorTamanho: 0,
        formaPagamento: 0,
        atendimento: 0,
        outros: 0,
      };

      const qtd = p.qtd ?? 1;
      const b = p.bucket as keyof typeof perdasTot;

      perdasTot[b] += qtd;
      item[b] += qtd;

      perdasDiaMap.set(dia, item);
    }

    const perdasPorDiaSemana = DOW.map((dia) => perdasDiaMap.get(dia) ?? {
      dia,
      preco: 0,
      faltaMercadoria: 0,
      modeloCorTamanho: 0,
      formaPagamento: 0,
      atendimento: 0,
      outros: 0,
    });

    const perdasPorGrupo = [
      { name: "Preço", value: perdasTot.preco },
      { name: "Falta de Mercadoria", value: perdasTot.faltaMercadoria },
      { name: "Modelo / Cor / Tamanho", value: perdasTot.modeloCorTamanho },
      { name: "Forma de Pagamento", value: perdasTot.formaPagamento },
      { name: "Atendimento", value: perdasTot.atendimento },
      { name: "Outros", value: perdasTot.outros },
    ];

    // ======================
    // Conversão / Ticket / Compraram vs Não
    // ======================
    const totalFluxo = somaGrupo;
    const totalVendas = vendasRows.length;

    const somaValor = vendasRows.reduce((acc: number, v: any) => {
      const n = Number(String(v.valor ?? "0").replace(",", "."));
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

    const ticketMedioGeral = totalVendas > 0 ? somaValor / totalVendas : 0;
    const aproveitamento = totalFluxo > 0 ? totalVendas / totalFluxo : 0;

    const clientesCompraramVsNao = {
      compraram: totalVendas,
      naoCompraram: Math.max(0, totalFluxo - totalVendas),
      total: totalFluxo,
    };

    const conversaoGeral = { totalFluxo, totalVendas, aproveitamento };

    return {
      meta,
      fluxoPorGrupo,
      fluxoPorDiaSemana,

      perdasPorGrupo,
      perdasPorDiaSemana,

      compradoresPorGenero,
      perfilPorIdade,
      fluxoPorSemanaMes,

      clientesCompraramVsNao,
      conversaoGeral,
      ticketMedioGeral,
    };
  }, [canRun, filters, fluxoRows, vendasRows, perdasAgg]);

  return {
    fluxo: qFluxo,
    vendas: qVendas,
    perdas: qPerdas,
    loading: qFluxo.isLoading || qVendas.isLoading || qPerdas.isLoading,
    error: qFluxo.error || qVendas.error || qPerdas.error,
    report,
  };
}
// src/app/(private)/relatorios/vendas/components/TabelaResumoVendas.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import { useVendas, type VendasFilters } from "@/app/(private)/relatorios/vendas/hooks/useVendas";
import { useFluxoPessoas } from "@/app/(private)/relatorios/fluxos/hooks/useFluxoPessoas";
import { usePerdaVendas } from "@/app/(private)/relatorios/perdas/hooks/usePerdaVendas";
import type { Loja } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, FunnelX, Search, X } from "lucide-react";
import type * as ExcelTypes from "exceljs";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const LOGO_PLAZA_URL = "/logo_plaza.png";

// utilitário opcional para carregar o logo como dataURL
async function loadImageAsDataURL(url: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

const MONTHS = [
  { v: 1, n: "01" }, { v: 2, n: "02" }, { v: 3, n: "03" }, { v: 4, n: "04" },
  { v: 5, n: "05" }, { v: 6, n: "06" }, { v: 7, n: "07" }, { v: 8, n: "08" },
  { v: 9, n: "09" }, { v: 10, n: "10" }, { v: 11, n: "11" }, { v: 12, n: "12" },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

type SlotTotals = { valor: number; qtd: number };
type TurnoTotals = { geral: SlotTotals; manha: SlotTotals; tarde: SlotTotals; noite: SlotTotals };

function emptyTotals(): TurnoTotals {
  return {
    geral: { valor: 0, qtd: 0 },
    manha: { valor: 0, qtd: 0 },
    tarde: { valor: 0, qtd: 0 },
    noite: { valor: 0, qtd: 0 },
  };
}

const normTxt = (s?: string) =>
  (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// 06–12 manhã, 12–18 tarde, resto noite (usa createdAt; ajusta se backend tiver "turno")
function getTurno(d?: string): "manha" | "tarde" | "noite" {
  if (!d) return "noite";
  const h = new Date(d).getHours();
  if (h >= 6 && h < 12) return "manha";
  if (h >= 12 && h < 18) return "tarde";
  return "noite";
}

type Row = {
  label: string;
  kind: "valor" | "qtd" | "fluxo" | "perda";
  filter?: (v: any) => boolean;        // vendas
  fluxoFilter?: (f: any) => boolean;   // fluxo
  perdaFilter?: (p: any) => boolean;   // perdas
};

function matchMotivo(p: any, key: string) {
  const name = normTxt(p.motivoperdas?.name ?? p.motivoName);
  switch (key) {
    case "preco": return name.includes("preco");
    case "modelo": return name.includes("modelo");
    case "tamanho": return name.includes("tamanho");
    case "cor": return name.includes("cor");
    case "forma-pagamento": return name.includes("forma") && name.includes("pag");
    case "falta-mercadoria": return name.includes("falta") || name.includes("mercador") || name.includes("estoque");
    case "atendimento": return name.includes("atendimento");
    case "outros": return name.includes("outro");
    default: return false;
  }
}

/** define as linhas que sabemos calcular com o dataset atual */
const ROWS: Row[] = [
  { label: "Total do valor de vendas", kind: "valor" },

  // por sexo (ajuste sexoId se necessário)
  { label: "Total do valor de vendas feminino", kind: "valor", filter: (v) => v.sexoId === 2 },
  { label: "Total do valor de vendas masculino", kind: "valor", filter: (v) => v.sexoId === 1 },

  { label: "Total do número de vendas feminino", kind: "qtd", filter: (v) => v.sexoId === 2 },
  { label: "Total do número de vendas masculino", kind: "qtd", filter: (v) => v.sexoId === 1 },
  { label: "Total do número de vendas", kind: "qtd" },

  // As linhas abaixo existem no modelo, mas exigem outras fontes (especulador, perdidas, fluxo).
  // Mantemos aqui como “zeradas” até existir endpoint/campo correspondente.
  { label: "Total do fluxo feminino", kind: "fluxo", fluxoFilter: (f) => (f.sexo ?? "").toLowerCase() === "feminino" },
  { label: "Total do fluxo masculino", kind: "fluxo", fluxoFilter: (f) => (f.sexo ?? "").toLowerCase() === "masculino" },
  { label: "Total do fluxo de público", kind: "fluxo" },

  { label: "Total de Vendas Perdidas - Preço", kind: "perda", perdaFilter: (p) => matchMotivo(p, "preco") },
  { label: "Total de Vendas Perdidas - Modelo", kind: "perda", perdaFilter: (p) => matchMotivo(p, "modelo") },
  { label: "Total de Vendas Perdidas - Tamanho", kind: "perda", perdaFilter: (p) => matchMotivo(p, "tamanho") },
  { label: "Total de Vendas Perdidas - Cor", kind: "perda", perdaFilter: (p) => matchMotivo(p, "cor") },
  { label: "Total de Vendas Perdidas - Forma de Pagamento", kind: "perda", perdaFilter: (p) => matchMotivo(p, "forma-pagamento") },
  { label: "Total de Vendas Perdidas - Falta de Mercadoria", kind: "perda", perdaFilter: (p) => matchMotivo(p, "falta-mercadoria") },
  { label: "Total de Vendas Perdidas - Atendimento", kind: "perda", perdaFilter: (p) => matchMotivo(p, "atendimento") },
  { label: "Total de Vendas Perdidas - Outros", kind: "perda", perdaFilter: (p) => matchMotivo(p, "outros") },
];

// agregador de vendas (só conta quantidade)
function aggregateVendas(items: any[], row: Row): TurnoTotals {
  const out = emptyTotals();
  for (const v of items) {
    if (row.filter && !row.filter(v)) continue;
    // >>> usa auditoria.data como referência primária
    const turno = getTurno(v.auditoria?.data ?? v.createdAt);
    const qtd = 1; // cada venda = 1
    const valor = Number(v.valor) || 0;

    // geral
    out.geral.qtd += qtd;
    out.geral.valor += valor;

    // por turno
    out[turno].qtd += qtd;
    out[turno].valor += valor;
  }
  return out;
}

// agregador de fluxo (só conta quantidade)
function aggregateFluxo(fluxo: any[], row: Row) {
  const out = emptyTotals();
  for (const f of fluxo) {
    if (row.fluxoFilter && !row.fluxoFilter(f)) continue;
    const turno = getTurno(f.createdAt ?? f.auditoria?.data);
    const qtd = typeof f.quantidade === "number" ? f.quantidade : 1;

    out.geral.qtd += qtd;
    out[turno].qtd += qtd;
  }
  return out;
}

function aggregatePerdas(perdas: any[], row: Row) {
  const out = emptyTotals();
  for (const p of perdas) {
    if (row.perdaFilter && !row.perdaFilter(p)) continue;
    const turno = getTurno(p.createdAt ?? p.auditoria?.data);
    const qtd = 1; // cada registro de perda = 1
    out.geral.qtd += qtd;
    out[turno].qtd += qtd;
  }
  return out;
}

function pct(part: number, whole: number) {
  return whole > 0 ? part / whole : 0;
}

/** Constrói as linhas prontas para renderizar e exportar */
function buildTableData(vendas: any[], fluxo: any[], perdas: any[]) {
  type PrintableRow = {
    ITEM: string;
    GERAL: string | number;
    "MANHÃ": string | number;
    "% MANHÃ": string;
    "TARDE": string | number;
    "% TARDE": string;
    "NOITE": string | number;
    "% NOITE": string;
  };

  const rows: PrintableRow[] = [];

  for (const r of ROWS) {
    const agg =
      r.kind === "fluxo" ? aggregateFluxo(fluxo, r) :
        r.kind === "perda" ? aggregatePerdas(perdas, r) :
          aggregateVendas(vendas, r);

    const baseGeral = r.kind === "valor" ? agg.geral.valor : agg.geral.qtd;
    const vManha = r.kind === "valor" ? agg.manha.valor : agg.manha.qtd;
    const vTarde = r.kind === "valor" ? agg.tarde.valor : agg.tarde.qtd;
    const vNoite = r.kind === "valor" ? agg.noite.valor : agg.noite.qtd;

    const fmt = (x: number) => (r.kind === "valor" ? currency.format(x) : x);
    rows.push({
      ITEM: r.label,
      GERAL: fmt(baseGeral),
      "MANHÃ": fmt(vManha),
      "% MANHÃ": percent.format(pct(vManha, baseGeral)),
      "TARDE": fmt(vTarde),
      "% TARDE": percent.format(pct(vTarde, baseGeral)),
      "NOITE": fmt(vNoite),
      "% NOITE": percent.format(pct(vNoite, baseGeral)),
    });
  }

  return rows;
}

/* ========================== componente ========================== */

export default function TabelaResumoVendas() {
  const { data: lojasResp } = useLojas({ limit: 500 });
  const lojas = (lojasResp?.data as Loja[]) ?? [];

  const anos = React.useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => now - i); // ano atual .. -5
  }, []);

  // estado do formulário (não dispara busca)
  const [formLojaId, setFormLojaId] = React.useState<number | undefined>();
  const [formMes, setFormMes] = React.useState<number | undefined>();
  const [formAno, setFormAno] = React.useState<number | undefined>();

  // parâmetros efetivos da query (só mudam no clique de Buscar)
  const [queryParams, setQueryParams] = React.useState<VendasFilters | null>(null);
  const enabled = !!queryParams;

  const { data, isFetching } = useVendas(queryParams ?? {}, { enabled });
  const items = data?.data ?? [];

  const { data: fluxoResp, isFetching: isFetchingFluxo } = useFluxoPessoas(
    queryParams ?? {},
    { enabled }
  );

  const fluxoItems = fluxoResp?.data ?? [];


  const { data: perdasResp, isFetching: isFetchingPerdas } = usePerdaVendas(
    queryParams ?? {},
    { enabled }
  );

  const perdaItems = perdasResp?.data ?? [];

  const isLoadingAny = isFetching || isFetchingFluxo || isFetchingPerdas;

  const lojaNome =
    (lojas.find((l) => l.id === queryParams?.lojaId)?.descricao ??
      lojas.find((l) => l.id === queryParams?.lojaId)?.name) ?? "-";

  // exportação
  const [exportFmt, setExportFmt] = React.useState<"xlsx" | "xls" | "pdf" | "">("");

  const canSearch = !!(formLojaId && formMes && formAno);

  const onBuscar = () => {
    if (!canSearch) return;
    setQueryParams({
      lojaId: formLojaId,
      mes: formMes,
      ano: formAno,
      page: 1,
      limit: 4000, // ajuste se necessário
    });
  };

  const rows = React.useMemo(
    () => (enabled ? buildTableData(items, fluxoItems, perdaItems) : []),
    [enabled, items, fluxoItems, perdaItems]
  );

  const canExport = enabled && !isLoadingAny && rows.length > 0 && !!exportFmt;

  const onLimpar = () => {
    setFormLojaId(undefined);
    setFormMes(undefined);
    setFormAno(undefined);
    setQueryParams(null); // limpa resultado
    setExportFmt("");
  };

  // ===== export helpers =====
  // monta cabeçalho textual (reaproveitado nos 3 formatos)
  function buildHeader(lojaNome: string, mes: number, ano: number) {
    return {
      title: "RESUMO DO MAPA MENSAL DE VENDAS",
      loja: `LOJA / NOME FANTASIA: ${lojaNome || "—"}`,
      periodo: `MÊS/ANO: ${String(mes).padStart(2, "0")}/${ano}`,
    };
  }

  // helper (reaproveita sua função, só garante URL absoluta)
  async function getLogoDataURL() {
    try {
      const url = new URL(LOGO_PLAZA_URL, window.location.origin).toString();
      const res = await fetch(url);
      if (!res.ok) return "";
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  }

  /** ================= XLSX com logo (exceljs) ================= */
  async function exportXLSX(
    dataRows: any[],
    filename: string,
    header: { title: string; loja: string; periodo: string }
  ) {
    const ExcelJS = await import("exceljs");

    // helpers: parse valores vindos como string formatada
    const toNumber = (v: any) => {
      if (typeof v === "number") return v;
      const s = String(v ?? "").trim();
      if (!s) return 0;
      if (s.includes("%")) {
        // "29,88%" -> 0.2988
        const n = s.replace("%", "").replace(/\./g, "").replace(",", ".");
        return Number(n) / 100;
      }
      // "R$ 1.234,56" | "1.234,56" -> 1234.56
      const n = s.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".");
      return Number(n || 0);
    };
    const isMoney = (v: any) => String(v ?? "").includes("R$");
    const isPercent = (v: any) => String(v ?? "").includes("%");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Resumo", { properties: { defaultRowHeight: 18 } });

    // colunas
    ws.columns = [
      { header: "ITEM", key: "ITEM", width: 45 },
      { header: "GERAL", key: "GERAL", width: 16 },
      { header: "MANHÃ", key: "MANHA", width: 16 },
      { header: "% MANHÃ", key: "PCT_MANHA", width: 12 },
      { header: "TARDE", key: "TARDE", width: 16 },
      { header: "% TARDE", key: "PCT_TARDE", width: 12 },
      { header: "NOITE", key: "NOITE", width: 16 },
      { header: "% NOITE", key: "PCT_NOITE", width: 12 },
    ];

    // ===== Cabeçalho (com primeira linha alta para caber a logo)
    ws.mergeCells("A1:H1");
    ws.getCell("A1").value = header.title;
    ws.getCell("A1").font = { name: "Arial", bold: true, size: 14 };
    ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    ws.mergeCells("A2:H2");
    ws.getCell("A2").value = header.loja;
    ws.getCell("A2").font = { name: "Arial", size: 10 };

    ws.mergeCells("A3:H3");
    ws.getCell("A3").value = header.periodo;
    ws.getCell("A3").font = { name: "Arial", size: 10 };

    // linha vazia
    ws.addRow([]);

    // header da grade (linha 5)
    ws.getRow(5).font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(5).alignment = { horizontal: "center" };
    ws.getRow(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212121" } };

    // ===== Dados (gravamos número e aplicamos formato por célula)
    dataRows.forEach((r) => {
      // constrói coluna-a-coluna com info para formatar
      const cols = [
        r.ITEM,
        { v: toNumber(r.GERAL), isMoney: isMoney(r.GERAL) },
        { v: toNumber(r["MANHÃ"]), isMoney: isMoney(r["MANHÃ"]) },
        { v: toNumber(r["% MANHÃ"]), isPct: isPercent(r["% MANHÃ"]) },
        { v: toNumber(r.TARDE), isMoney: isMoney(r.TARDE) },
        { v: toNumber(r["% TARDE"]), isPct: isPercent(r["% TARDE"]) },
        { v: toNumber(r.NOITE), isMoney: isMoney(r.NOITE) },
        { v: toNumber(r["% NOITE"]), isPct: isPercent(r["% NOITE"]) },
      ];

      const row = ws.addRow(cols.map((c) => (typeof c === "object" ? c.v : c)));

      // formatações numéricas por célula
      const moneyFmt = '"R$"#,##0.00';
      [2, 3, 5, 7].forEach((i) => {
        const c: any = cols[i - 1];
        if (c && typeof c === "object") row.getCell(i).numFmt = c.isMoney ? moneyFmt : "0";
      });
      [4, 6, 8].forEach((i) => (row.getCell(i).numFmt = "0.00%"));
    });

    // bordas e fonte nas linhas de dados
    ws.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
      if (rowNumber >= 5) {
        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.font = { name: "Arial", size: 10 };
        });
      }
    });

    // ===== Logo (altura > largura) e altura da 1ª linha
    const logo = await loadImageAsDataURL(LOGO_PLAZA_URL);
    if (logo) {
      const imageId = wb.addImage({ base64: logo, extension: "png" });
      // tamanho em pixels
      const LOGO_W = 70; // largura menor
      const LOGO_H = 90; // altura um pouco maior
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: LOGO_W, height: LOGO_H } });

      // excel usa "points" (~= pixels * 0.75)
      ws.getRow(1).height = Math.max(22, LOGO_H * 0.75);
    }

    // download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** ===================== XLS (HTML TABLE + LOGO) ===================== */
  async function exportXLS(
    dataRows: any[],
    filename: string,
    header: { title: string; loja: string; periodo: string }
  ) {
    const logo = await loadImageAsDataURL(LOGO_PLAZA_URL);

    // helpers para converter para número
    const toNumber = (v: any) => {
      if (typeof v === "number") return v;
      const s = String(v ?? "").trim();
      if (!s) return 0;
      if (s.includes("%")) {
        const n = s.replace("%", "").replace(/\./g, "").replace(",", ".");
        return Number(n) / 100;
      }
      const n = s.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".");
      return Number(n || 0);
    };
    const isMoney = (v: any) => String(v ?? "").includes("R$");

    const moneyStyle = 'mso-number-format:"\\0022R$\\0022 #,##0.00"';
    const pctStyle = 'mso-number-format:0.00%';
    const intStyle = 'mso-number-format:0';

    const esc = (s: string) =>
      String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const headRow =
      "<tr><th>ITEM</th><th>GERAL</th><th>MANHÃ</th><th>% MANHÃ</th><th>TARDE</th><th>% TARDE</th><th>NOITE</th><th>% NOITE</th></tr>";

    const bodyRows = dataRows
      .map((r) => {
        // valores numéricos "crus" (ponto como decimal)
        const geral = toNumber(r.GERAL);
        const manha = toNumber(r["MANHÃ"]);
        const pctM = toNumber(r["% MANHÃ"]);
        const tarde = toNumber(r.TARDE);
        const pctT = toNumber(r["% TARDE"]);
        const noite = toNumber(r.NOITE);
        const pctN = toNumber(r["% NOITE"]);

        const tdMoney = (n: number, wasMoney: boolean) =>
          `<td style="${wasMoney ? moneyStyle : intStyle}">${n}</td>`;
        const tdPct = (n: number) => `<td style="${pctStyle}">${n}</td>`;

        return `<tr>
          <td>${esc(r.ITEM)}</td>
          ${tdMoney(geral, isMoney(r.GERAL))}
          ${tdMoney(manha, isMoney(r["MANHÃ"]))}
          ${tdPct(pctM)}
          ${tdMoney(tarde, isMoney(r.TARDE))}
          ${tdPct(pctT)}
          ${tdMoney(noite, isMoney(r.NOITE))}
          ${tdPct(pctN)}
        </tr>`;
      })
      .join("");

    // header com tabela (ajusta altura = altura da logo)
    const LOGO_H = 80; // px (altura > largura)
    const LOGO_W = 64;

    const html = `<!DOCTYPE html>
  <html>
  <meta charset="utf-8">
  <head>
    <title>${esc(header.title)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #333;padding:4px 6px;font-size:12px}
      th{background:#212121;color:#fff}
      .hdr{width:100%; border-collapse:collapse; margin-bottom:8px}
      .hdr td{border:none;}
      .hdr .logo-cell{height:${LOGO_H}px; width:${LOGO_W + 8}px; vertical-align:middle}
      .hdr .title-cell{font-weight:bold; font-size:16px; text-align:center; vertical-align:middle}
      .meta{margin:6px 0 12px 0}
    </style>
  </head>
  <body>
    <table class="hdr">
      <tr>
        <td class="logo-cell">
          ${logo ? `<img src="${logo}" alt="logo" style="height:${LOGO_H}px;width:auto" />` : ""}
        </td>
        <td class="title-cell">${esc(header.title)}</td>
      </tr>
    </table>

    <div class="meta">
      <div>${esc(header.loja)}</div>
      <div>${esc(header.periodo)}</div>
    </div>

    <table>
      <thead>${headRow}</thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
  </html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // .PDF — importar jsPDF e chamar a função autoTable(doc, opts)
  async function exportPDF(
    dataRows: any[],
    filename: string,
    header: { title: string; loja: string; periodo: string }
  ) {
    const { default: jsPDF } = await import("jspdf");

    // importe a função (sem depender do patch em doc)
    const autoTableMod = await import("jspdf-autotable");
    const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

    const doc = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });

    // tentar carregar o logo do /public/logo.png
    try {
      const absoluteLogoUrl = new URL(LOGO_PLAZA_URL, window.location.origin).toString();
      const res = await fetch(absoluteLogoUrl);
      if (res.ok) {
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });
        doc.addImage(b64, "PNG", 20, 14, 78, 60);
      }
    } catch {
      /* se falhar, segue sem logo */
    }

    // título central
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(header.title, pageW / 2, 46, { align: "center" });

    // infos à esquerda
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(header.loja, 20, 80);
    doc.text(header.periodo, 20, 96);

    const head = [
      ["ITEM", "GERAL", "MANHÃ", "% MANHÃ", "TARDE", "% TARDE", "NOITE", "% NOITE"],
    ];
    const body = dataRows.map((r) => [
      r.ITEM,
      r.GERAL,
      r["MANHÃ"],
      r["% MANHÃ"],
      r.TARDE,
      r["% TARDE"],
      r.NOITE,
      r["% NOITE"],
    ]);

    // chama a função diretamente
    autoTable(doc, {
      head,
      body,
      startY: 112,
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [33, 33, 33] },
      columnStyles: { 0: { cellWidth: 250 } },
      margin: { left: 20, right: 20 },
    });

    doc.save(filename);
  }

  const handleExport = async () => {
    if (!canExport) return;

    const hdr = buildHeader(lojaNome || "-", queryParams!.mes!, queryParams!.ano!);
    const base = `resumo-vendas_${String(queryParams!.mes).padStart(2, "0")}-${queryParams!.ano}_loja-${queryParams!.lojaId}`;

    if (exportFmt === "xlsx") await exportXLSX(rows, `${base}.xlsx`, hdr);
    else if (exportFmt === "xls") await exportXLS(rows, `${base}.xls`, hdr);
    else if (exportFmt === "pdf") await exportPDF(rows, `${base}.pdf`, hdr);
  };

  return (
    <>
      <Card className="bg-transparent mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">RESUMO DO MAPA MENSAL DE VENDAS E FLUXOS</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Linha de identificação */}
            {enabled && String(queryParams?.mes).padStart(2, "0") !== undefined ? (
              <div className="flex-1 text-xs text-muted-foreground">
                <div>LOJA / NOME FANTASIA: <span className="text-foreground">{lojaNome || "--"}</span></div>
                <div>MÊS/ANO: <span className="text-foreground">{String(queryParams?.mes).padStart(2, "0")}/{queryParams?.ano}</span></div>
              </div>
            ) : (
              <div className="flex-1 text-xs text-muted-foreground">
                <div>LOJA / NOME FANTASIA: <span className="text-foreground">--</span></div>
                <div>MÊS/ANO: <span className="text-foreground">--/----</span></div>
              </div>
            )}

            {/* Filtros */}
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-end gap-2">
              <div className="space-y-1">
                <Label className="ml-1.5">Loja</Label>
                <Select value={formLojaId ? String(formLojaId) : ""} onValueChange={(v) => setFormLojaId(v ? Number(v) : undefined)}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.descricao ?? l.name ?? `Loja ${l.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="ml-1.5">Mês</Label>
                <Select value={formMes ? String(formMes) : ""} onValueChange={(v) => setFormMes(v ? Number(v) : undefined)}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="ml-1.5">Ano</Label>
                <Select value={formAno ? String(formAno) : ""} onValueChange={(v) => setFormAno(v ? Number(v) : undefined)}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">

                <div className="flex gap-2">
                  <Button onClick={onBuscar} size="sm" disabled={!canSearch} className="cursor-pointer">
                    <Search className="mr-2 h-4 w-4" /> Buscar
                  </Button>
                  <Button variant="outline" size="sm" title="Limpar filtros" onClick={onLimpar} className="cursor-pointer">
                    <FunnelX />
                  </Button>
                </div>

                <div className="flex gap-2 items-end justify-center">
                  <div className="space-y-1">
                    <Label className="ml-1.5">Exportar como</Label>
                    <Select value={exportFmt} onValueChange={(v: any) => setExportFmt(v)}>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        <SelectItem value="xls">Excel 97–2003 (.xls)</SelectItem>
                        <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleExport} disabled={!canExport} title="Exportar" size="sm" variant="outline" className="cursor-pointer">
                    <Download />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabela */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-card shadow-card text-muted-foreground">
              <TableHead className="min-w-[220px] text-center py-1.5">ITEM</TableHead>
              <TableHead className="py-1.5">GERAL</TableHead>
              <TableHead className="py-1.5">MANHÃ</TableHead>
              <TableHead className="py-1.5">% MANHÃ</TableHead>
              <TableHead className="py-1.5">TARDE</TableHead>
              <TableHead className="py-1.5">% TARDE</TableHead>
              <TableHead className="py-1.5">NOITE</TableHead>
              <TableHead className="py-1.5">% NOITE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!enabled && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Selecione Loja, Mês e Ano para carregar.
                </TableCell>
              </TableRow>
            )}

            {enabled && isLoadingAny && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  <LoadingSpinner size="lg" text="Carregando..." />
                </TableCell>
              </TableRow>
            )}

            {enabled && !isLoadingAny && ROWS.map((r) => {
              const agg =
                r.kind === "fluxo" ? aggregateFluxo(fluxoItems, r) :
                  r.kind === "perda" ? aggregatePerdas(perdaItems, r) :
                    aggregateVendas(items, r);

              const baseGeral = r.kind === "valor" ? agg.geral.valor : agg.geral.qtd;
              const vManha = r.kind === "valor" ? agg.manha.valor : agg.manha.qtd;
              const vTarde = r.kind === "valor" ? agg.tarde.valor : agg.tarde.qtd;
              const vNoite = r.kind === "valor" ? agg.noite.valor : agg.noite.qtd;

              const fmt = (x: number) => (r.kind === "valor" ? currency.format(x) : x.toString());
              return (
                <TableRow key={r.label}>
                  <TableCell className="py-1 whitespace-nowrap">{r.label}</TableCell>
                  <TableCell className="py-1">{fmt(baseGeral)}</TableCell>
                  <TableCell className="py-1">{fmt(vManha)}</TableCell>
                  <TableCell className="py-1">{percent.format(pct(vManha, baseGeral))}</TableCell>
                  <TableCell className="py-1">{fmt(vTarde)}</TableCell>
                  <TableCell className="py-1">{percent.format(pct(vTarde, baseGeral))}</TableCell>
                  <TableCell className="py-1">{fmt(vNoite)}</TableCell>
                  <TableCell className="py-1">{percent.format(pct(vNoite, baseGeral))}</TableCell>
                </TableRow>
              );
            })}

          </TableBody>
        </Table>
      </div>
    </>

  );
}
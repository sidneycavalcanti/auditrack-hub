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
import type { Loja } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, FunnelX, Search, X } from "lucide-react";
import type * as ExcelTypes from "exceljs";

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
  kind: "valor" | "qtd" | "fluxo";
  filter?: (v: any) => boolean;          // para vendas
  fluxoFilter?: (f: any) => boolean;      // para fluxo
};

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
  { label: "Total do fluxo feminino",  kind: "fluxo", fluxoFilter: (f) => (f.sexo ?? "").toLowerCase() === "feminino" },
  { label: "Total do fluxo masculino", kind: "fluxo", fluxoFilter: (f) => (f.sexo ?? "").toLowerCase() === "masculino" },
  { label: "Total do fluxo de público", kind: "fluxo" },

  { label: "Total de Vendas Perdidas - Preço", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Modelo", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Tamanho", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Cor", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Forma de Pagamento", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Falta de Mercadoria", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Atendimento", kind: "qtd", filter: () => false },
  { label: "Total de Vendas Perdidas - Outros", kind: "qtd", filter: () => false },
];

// agregador de vendas (só conta quantidade)
function aggregateVendas(items: any[], row: Row): TurnoTotals {
  const out = emptyTotals();
  for (const v of items) {
    if (row.filter && !row.filter(v)) continue;
    const turno = getTurno(v.createdAt);
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

function pct(part: number, whole: number) {
  return whole > 0 ? part / whole : 0;
}

/** Constrói as linhas prontas para renderizar e exportar */
function buildTableData(vendas: any[], fluxo: any[]) {
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
    const agg = r.kind === "fluxo" ? aggregateFluxo(fluxo, r) : aggregateVendas(vendas, r);

    const baseGeral = r.kind === "valor" ? agg.geral.valor : agg.geral.qtd;
    const vManha    = r.kind === "valor" ? agg.manha.valor : agg.manha.qtd;
    const vTarde    = r.kind === "valor" ? agg.tarde.valor : agg.tarde.qtd;
    const vNoite    = r.kind === "valor" ? agg.noite.valor : agg.noite.qtd;

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
  const isLoadingAny = isFetching || isFetchingFluxo;

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
    () => (enabled ? buildTableData(items, fluxoItems) : []),
    [enabled, items, fluxoItems]
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
    // dynamic import -> usa build de browser do exceljs
    const ExcelJS = await import("exceljs");

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

    // título + linhas de identificação
    ws.mergeCells("A1:H1");
    ws.getCell("A1").value = header.title;
    ws.getCell("A1").font = { name: "Arial", bold: true, size: 14 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:H2");
    ws.getCell("A2").value = header.loja;
    ws.getCell("A2").font = { name: "Arial", size: 10 };

    ws.mergeCells("A3:H3");
    ws.getCell("A3").value = header.periodo;
    ws.getCell("A3").font = { name: "Arial", size: 10 };

    // linha vazia
    ws.addRow([]);

    // cabeçalho da tabela (linha 5)
    ws.getRow(5).font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(5).alignment = { horizontal: "center" };
    ws.getRow(5).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF212121" },
    };

    // dados
    dataRows.forEach((r) => {
      ws.addRow([
        r.ITEM,
        r.GERAL,
        r["MANHÃ"],
        r["% MANHÃ"],
        r.TARDE,
        r["% TARDE"],
        r.NOITE,
        r["% NOITE"],
      ]);
    });

    // bordas simples nas linhas de dados (a partir da linha 5)
    ws.eachRow({ includeEmpty: false }, (row: ExcelTypes.Row, rowNumber: number) => {
      if (rowNumber >= 5) {
        row.eachCell((cell: ExcelTypes.Cell) => {
          (cell as any).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          (cell as any).font = { name: "Arial", size: 10 };
        });
      }
    });

    // logo (se existir)
    const logo = await loadImageAsDataURL(LOGO_PLAZA_URL);
    if (logo) {
      const imageId = wb.addImage({ base64: logo, extension: "png" });
      // canto superior esquerdo, tamanho em pixels
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 39, height: 28 } });
    }

    // baixa o arquivo
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
    const logo = await loadImageAsDataURL(LOGO_PLAZA_URL); // opcional
    const esc = (s: string) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const headRow =
      "<tr><th>ITEM</th><th>GERAL</th><th>MANHÃ</th><th>% MANHÃ</th><th>TARDE</th><th>% TARDE</th><th>NOITE</th><th>% NOITE</th></tr>";

    const bodyRows = dataRows
      .map(
        (r) =>
          `<tr>
            <td>${esc(r.ITEM)}</td>
            <td>${esc(r.GERAL)}</td>
            <td>${esc(r["MANHÃ"])}</td>
            <td>${esc(r["% MANHÃ"])}</td>
            <td>${esc(r.TARDE)}</td>
            <td>${esc(r["% TARDE"])}</td>
            <td>${esc(r.NOITE)}</td>
            <td>${esc(r["% NOITE"])}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
  <html>
  <meta charset="utf-8">
  <head>
    <title>${esc(header.title)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;}
      .logo{height:48px;margin-right:12px;vertical-align:middle}
      .title{font-weight:bold;font-size:16px;text-align:center}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #333;padding:4px 6px;font-size:12px}
      th{background:#212121;color:#fff}
    </style>
  </head>
  <body>
    <div>
      ${logo ? `<img class="logo" src="${logo}" alt="logo"/>` : ""}
      <span class="title">${esc(header.title)}</span>
    </div>
    <div style="margin:6px 0 12px 0">
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
    const base = `resumo-vendas_${String(queryParams!.mes).padStart(2,"0")}-${queryParams!.ano}_loja-${queryParams!.lojaId}`;

    if (exportFmt === "xlsx") await exportXLSX(rows, `${base}.xlsx`, hdr);
    else if (exportFmt === "xls") await exportXLS(rows, `${base}.xls`, hdr);
    else if (exportFmt === "pdf") await exportPDF(rows, `${base}.pdf`, hdr);
  };

  return (
      <>
        <Card className="bg-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">RESUMO DO MAPA MENSAL DE VENDAS</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              {/* Linha de identificação */}
              {enabled && (
                <div className="flex-1 text-xs text-muted-foreground">
                  <div>LOJA / NOME FANTASIA: <span className="text-foreground">{lojaNome || "—"}</span></div>
                  <div>MÊS/ANO: <span className="text-foreground">{String(queryParams?.mes).padStart(2, "0")}/{queryParams?.ano}</span></div>
                </div>
              )}

              {/* Filtros */}
              <div className="flex-1 flex flex-col lg:flex-row items-center justify-end gap-2">
                <div className="space-y-1">
                  <Label className="ml-1.5">Loja</Label>
                  <Select value={formLojaId ? String(formLojaId) : ""} onValueChange={(v) => setFormLojaId(v ? Number(v) : undefined)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
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
                    <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="ml-1.5">Ano</Label>
                  <Select value={formAno ? String(formAno) : ""} onValueChange={(v) => setFormAno(v ? Number(v) : undefined)}>
                    <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>
                      {anos.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">

                  <div className="flex gap-2">
                    <Button onClick={onBuscar}  size="sm" disabled={!canSearch} className="cursor-pointer">
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
                        <SelectTrigger><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
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
                    Carregando…
                  </TableCell>
                </TableRow>
              )}

              {enabled && !isLoadingAny && ROWS.map((r) => {
                const agg = r.kind === "fluxo" ? aggregateFluxo(fluxoItems, r) : aggregateVendas(items, r);
                const baseGeral = r.kind === "valor" ? agg.geral.valor : agg.geral.qtd;
                const vManha    = r.kind === "valor" ? agg.manha.valor : agg.manha.qtd;
                const vTarde    = r.kind === "valor" ? agg.tarde.valor : agg.tarde.qtd;
                const vNoite    = r.kind === "valor" ? agg.noite.valor : agg.noite.qtd;

                const fmt = (x: number) => (r.kind === "valor" ? currency.format(x) : x.toString());
                return (
                  <TableRow key={r.label}>
                    <TableCell className="whitespace-nowrap">{r.label}</TableCell>
                    <TableCell>{fmt(baseGeral)}</TableCell>
                    <TableCell>{fmt(vManha)}</TableCell>
                    <TableCell>{percent.format(pct(vManha, baseGeral))}</TableCell>
                    <TableCell>{fmt(vTarde)}</TableCell>
                    <TableCell>{percent.format(pct(vTarde, baseGeral))}</TableCell>
                    <TableCell>{fmt(vNoite)}</TableCell>
                    <TableCell>{percent.format(pct(vNoite, baseGeral))}</TableCell>
                  </TableRow>
                );
              })}

            </TableBody>
          </Table>
        </div>
      </>
    
  );
}
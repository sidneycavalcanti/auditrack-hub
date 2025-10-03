// src/app/(private)/relatorios/vendas/components/TabelaResumoVendasDiario.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FunnelX, ChevronDown } from "lucide-react";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import {
    useVendas,
    type VendasFilters,
    buildDayFilters,
    filterVendasByDay,
} from "@/app/(private)/relatorios/vendas/hooks/useVendas";
import { useFluxoPessoas } from "@/app/(private)/relatorios/fluxos/hooks/useFluxoPessoas";
import { usePerdaVendas } from "@/app/(private)/relatorios/perdas/hooks/usePerdaVendas";
import type { Loja } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const LOGO_PLAZA_URL = "/logo_plaza.png";

/* ================= helpers ================= */

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ymdToBR = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;

type SlotTotals = { valor: number; qtd: number };
type TurnoTotals = { geral: SlotTotals; manha: SlotTotals; tarde: SlotTotals; noite: SlotTotals };

const emptyTotals = (): TurnoTotals => ({
    geral: { valor: 0, qtd: 0 },
    manha: { valor: 0, qtd: 0 },
    tarde: { valor: 0, qtd: 0 },
    noite: { valor: 0, qtd: 0 },
});

const normTxt = (s?: string) => (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// 06–12 manhã, 12–18 tarde, resto noite
function getTurno(d?: string) {
    if (!d) return "noite" as const;
    const h = new Date(d).getHours();
    if (h >= 6 && h < 12) return "manha" as const;
    if (h >= 12 && h < 18) return "tarde" as const;
    return "noite" as const;
}

type Row = {
    label: string;
    kind: "valor" | "qtd" | "fluxo" | "perda";
    filter?: (v: any) => boolean;
    fluxoFilter?: (f: any) => boolean;
    perdaFilter?: (p: any) => boolean;
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

/** mesmas linhas do mensal */
const ROWS: Row[] = [
    { label: "Total do valor de vendas", kind: "valor" },
    { label: "Total do valor de vendas feminino", kind: "valor", filter: (v) => v.sexoId === 2 },
    { label: "Total do valor de vendas masculino", kind: "valor", filter: (v) => v.sexoId === 1 },
    { label: "Total do número de vendas feminino", kind: "qtd", filter: (v) => v.sexoId === 2 },
    { label: "Total do número de vendas masculino", kind: "qtd", filter: (v) => v.sexoId === 1 },
    { label: "Total do número de vendas", kind: "qtd" },

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

function aggregateVendas(items: any[], row: Row): TurnoTotals {
    const out = emptyTotals();
    for (const v of items) {
        if (row.filter && !row.filter(v)) continue;
        const turno = getTurno(v.auditoria?.data ?? v.createdAt);
        const qtd = 1;
        const valor = Number(v.valor) || 0;

        out.geral.qtd += qtd;
        out.geral.valor += valor;
        out[turno].qtd += qtd;
        out[turno].valor += valor;
    }
    return out;
}
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
        const qtd = 1;
        out.geral.qtd += qtd;
        out[turno].qtd += qtd;
    }
    return out;
}
const pct = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

// formata data DD/MM/YYYY
const fmtBR = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

// retorna limites ISO do dia (UTC) — usados apenas para o backend;
// o fallback do hook já compara só "YYYY-MM-DD"
function dayRangeISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return {
        from: `${y}-${m}-${day}T00:00:00.000Z`,
        to: `${y}-${m}-${day}T23:59:59.999Z`,
    };
}

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
    } catch { return ""; }
}

// monta as linhas (mesmo cálculo da renderização)
function buildRowsPrintable(vendas: any[], fluxo: any[], perdas: any[]) {
    const rows = ROWS.map((r) => {
        const agg =
            r.kind === "fluxo" ? aggregateFluxo(fluxo, r) :
                r.kind === "perda" ? aggregatePerdas(perdas, r) :
                    aggregateVendas(vendas, r);

        const baseGeral = r.kind === "valor" ? agg.geral.valor : agg.geral.qtd;
        const vManha = r.kind === "valor" ? agg.manha.valor : agg.manha.qtd;
        const vTarde = r.kind === "valor" ? agg.tarde.valor : agg.tarde.qtd;
        const vNoite = r.kind === "valor" ? agg.noite.valor : agg.noite.qtd;

        return {
            ITEM: r.label,
            GERAL: r.kind === "valor" ? currency.format(baseGeral) : String(baseGeral),
            MANHA: r.kind === "valor" ? currency.format(vManha) : String(vManha),
            PCT_MANHA: percent.format(pct(vManha, baseGeral)),
            TARDE: r.kind === "valor" ? currency.format(vTarde) : String(vTarde),
            PCT_TARDE: percent.format(pct(vTarde, baseGeral)),
            NOITE: r.kind === "valor" ? currency.format(vNoite) : String(vNoite),
            PCT_NOITE: percent.format(pct(vNoite, baseGeral)),
        };
    });
    return rows;
}

async function exportXLSX_Dia(dataRows: any[], filename: string, header: { title: string; loja: string; data: string }) {
    const ExcelJS = await import("exceljs");

    const toNumber = (v: any) => {
        if (typeof v === "number") return v;
        const s = String(v ?? "");
        if (s.includes("%")) return Number(s.replace("%", "").replace(/\./g, "").replace(",", ".")) / 100;
        return Number(s.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".") || 0);
    };
    const isMoney = (v: any) => String(v).includes("R$");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Resumo diário");

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

    // Cabeçalho
    ws.mergeCells("A1:H1"); ws.getCell("A1").value = header.title; ws.getCell("A1").font = { bold: true, size: 14 }; ws.getCell("A1").alignment = { horizontal: "center" };
    ws.mergeCells("A2:H2"); ws.getCell("A2").value = header.loja; ws.getCell("A2").font = { size: 10 };
    ws.mergeCells("A3:H3"); ws.getCell("A3").value = header.data; ws.getCell("A3").font = { size: 10 };
    ws.addRow([]);

    ws.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(5).alignment = { horizontal: "center" };
    ws.getRow(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212121" } };

    const moneyFmt = '"R$"#,##0.00';

    dataRows.forEach(r => {
        const cols = [
            r.ITEM,
            { v: toNumber(r.GERAL), isMoney: isMoney(r.GERAL) },
            { v: toNumber(r.MANHA), isMoney: isMoney(r.MANHA) },
            { v: toNumber(r.PCT_MANHA), isPct: true },
            { v: toNumber(r.TARDE), isMoney: isMoney(r.TARDE) },
            { v: toNumber(r.PCT_TARDE), isPct: true },
            { v: toNumber(r.NOITE), isMoney: isMoney(r.NOITE) },
            { v: toNumber(r.PCT_NOITE), isPct: true },
        ];
        const row = ws.addRow(cols.map(c => typeof c === "object" ? c.v : c));
        [2, 3, 5, 7].forEach(i => { const c: any = cols[i - 1]; if (c?.isMoney) row.getCell(i).numFmt = moneyFmt; else if (i !== 4 && i !== 6 && i !== 8) row.getCell(i).numFmt = "0"; });
        [4, 6, 8].forEach(i => row.getCell(i).numFmt = "0.00%");
    });

    ws.eachRow({ includeEmpty: false }, (row, idx) => {
        if (idx >= 5) row.eachCell(cell => { cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }; cell.font = { size: 10 }; });
    });

    // Logo
    const logo = await getLogoDataURL();
    if (logo) {
        const imgId = wb.addImage({ base64: logo, extension: "png" });
        ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 90 } });
        ws.getRow(1).height = 90 * 0.75;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

async function exportPDF_Dia(dataRows: any[], filename: string, header: { title: string; loja: string; data: string }) {
    const { default: jsPDF } = await import("jspdf");
    const autoTableMod = await import("jspdf-autotable");
    const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

    const doc = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });

    // logo
    try {
        const logo = await getLogoDataURL();
        if (logo) doc.addImage(logo, "PNG", 20, 14, 78, 60);
    } catch { }

    const pageW = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(header.title, pageW / 2, 46, { align: "center" });

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(header.loja, 20, 80);
    doc.text(header.data, 20, 96);

    const head = [["ITEM", "GERAL", "MANHÃ", "% MANHÃ", "TARDE", "% TARDE", "NOITE", "% NOITE"]];
    const body = dataRows.map(r => [r.ITEM, r.GERAL, r.MANHA, r.PCT_MANHA, r.TARDE, r.PCT_TARDE, r.NOITE, r.PCT_NOITE]);

    autoTable(doc, {
        head, body, startY: 112,
        styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [33, 33, 33] },
        columnStyles: { 0: { cellWidth: 250 } },
        margin: { left: 20, right: 20 },
    });

    doc.save(filename);
}


/* ================= componente ================= */

export default function TabelaResumoVendasDiario() {
    const { data: lojasResp } = useLojas({ limit: 500 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    // filtro do formulário
    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [dataDia, setDataDia] = React.useState<Date | undefined>();

    // estado do popover do calendário
    const [openDate, setOpenDate] = React.useState(false);

    // parâmetros efetivos da query
    const [params, setParams] = React.useState<VendasFilters | null>(null);
    const [exportFmt, setExportFmt] = React.useState<"" | "xlsx" | "pdf">("");


    const enabled = !!params;

    const { data, isFetching } = useVendas(params ?? {}, { enabled });
    const dateOnly = React.useMemo(
        () => (params?.dateFrom ? (params.dateFrom as string).slice(0, 10) : ""),
        [params?.dateFrom]
    );
    const vendas = React.useMemo(
        () => (dateOnly ? filterVendasByDay(data?.data ?? [], dateOnly) : data?.data ?? []),
        [data?.data, dateOnly]
    );

    const { data: fluxoResp, isFetching: fetchingFluxo } = useFluxoPessoas(params ?? {}, { enabled });
    const fluxo = fluxoResp?.data ?? [];

    const { data: perdasResp, isFetching: fetchingPerdas } = usePerdaVendas(params ?? {}, { enabled });
    const perdas = perdasResp?.data ?? [];

    const isLoadingAny = isFetching || fetchingFluxo || fetchingPerdas;

    const lojaNome =
        (lojas.find((l) => l.id === params?.lojaId)?.descricao ??
            lojas.find((l) => l.id === params?.lojaId)?.name) ?? "-";

    const canSearch = !!(lojaId && dataDia);

    function onBuscar() {
        if (!canSearch || !dataDia) return;
        const range = buildDayFilters(dataDia); // << aqui
        setParams({
            lojaId,
            mes: range.mes,
            ano: range.ano,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
            page: 1,
            limit: 4000,
        });
    }

    function onLimpar() {
        setLojaId(undefined);
        setDataDia(undefined);
        setParams(null);
    }



    const rowsPrintable = React.useMemo(
        () => (enabled && !isLoadingAny ? buildRowsPrintable(vendas, fluxo, perdas) : []),
        [enabled, isLoadingAny, vendas, fluxo, perdas]
    );

    const canExport = enabled && !isLoadingAny && rowsPrintable.length > 0 && !!exportFmt;

    async function handleExport() {
        if (!canExport) return;
        const ymd = (params!.dateFrom as string).slice(0, 10);
        const hdr = {
            title: "RESUMO DO MAPA DIÁRIO DE VENDAS E FLUXOS",
            loja: `LOJA / NOME FANTASIA: ${lojaNome || "—"}`,
            data: `DATA: ${ymdToBR(ymd)}`,
        };
        const base = `resumo-diario_${ymd.replace(/-/g, "")}_loja-${params!.lojaId}`;
        if (exportFmt === "xlsx") await exportXLSX_Dia(rowsPrintable, `${base}.xlsx`, hdr);
        if (exportFmt === "pdf") await exportPDF_Dia(rowsPrintable, `${base}.pdf`, hdr);
    }

    return (
        <>
            <Card className="bg-transparent mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-center">RESUMO DO MAPA DIÁRIO DE VENDAS E FLUXOS</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        {/* identificação à esquerda */}
                        {enabled ? (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>LOJA / NOME FANTASIA: <span className="text-foreground">{lojaNome}</span></div>
                                <div>DATA: <span className="text-foreground">
                                    {params?.dateFrom ? ymdToBR((params.dateFrom as string).slice(0, 10)) : "--/--/----"}
                                </span></div>
                            </div>
                        ) : (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>LOJA / NOME FANTASIA: <span className="text-foreground">--</span></div>
                                <div>DATA: <span className="text-foreground">--/--/----</span></div>
                            </div>
                        )}

                        {/* filtros */}
                        <div className="flex-1 flex flex-col lg:flex-row items-center justify-end gap-2">
                            <div className="space-y-1">
                                <Label className="ml-1.5">Loja</Label>
                                <Select value={lojaId ? String(lojaId) : ""} onValueChange={(v) => setLojaId(v ? Number(v) : undefined)}>
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
                                <Label className="ml-1.5">Data</Label>
                                <Popover open={openDate} onOpenChange={setOpenDate}>
                                    <PopoverTrigger asChild>
                                        <Button variant="secondary" size="sm" className="justify-between w-[180px] cursor-pointer">
                                            {dataDia ? fmtBR(dataDia) : "Selecione a data"}
                                            <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dataDia}
                                            captionLayout="dropdown"
                                            onSelect={(d) => { setDataDia(d ?? undefined); setOpenDate(false); }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={onBuscar} size="sm" disabled={!canSearch} className="cursor-pointer">
                                    <Search className="mr-2 h-4 w-4" /> Buscar
                                </Button>
                                <Button variant="outline" size="sm" title="Limpar filtros" onClick={onLimpar} className="cursor-pointer">
                                    <FunnelX />
                                </Button>
                            </div>

                            <div className="flex gap-2 items-end">
                                <div className="space-y-1">
                                    <Label className="ml-1.5">Exportar como</Label>
                                    <Select value={exportFmt} onValueChange={(v: any) => setExportFmt(v)}>
                                        <SelectTrigger className="cursor-pointer">
                                            <SelectValue placeholder="Selecione o formato" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                                            <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleExport} disabled={!canExport} variant="outline" size="sm" className="cursor-pointer">
                                    Exportar
                                </Button>
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
                                    Selecione Loja e Data para carregar.
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
                                r.kind === "fluxo" ? aggregateFluxo(fluxo, r) :
                                    r.kind === "perda" ? aggregatePerdas(perdas, r) :
                                        aggregateVendas(vendas, r);

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
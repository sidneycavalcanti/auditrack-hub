// src/app/(private)/relatorios/vendas/components/TabelaVendasPorIntervalo.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FunnelX, Download } from "lucide-react";

import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import { useVendas } from "@/app/(private)/relatorios/vendas/hooks/useVendas";
import type { Loja } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// (opcional) gráfico — precisa de recharts instalado
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    Area,
    Line,
} from "recharts";

/* ================= helpers ================= */

const DAYS_PT = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const MONTHS = [
    { v: 1, n: "01" }, { v: 2, n: "02" }, { v: 3, n: "03" }, { v: 4, n: "04" },
    { v: 5, n: "05" }, { v: 6, n: "06" }, { v: 7, n: "07" }, { v: 8, n: "08" },
    { v: 9, n: "09" }, { v: 10, n: "10" }, { v: 11, n: "11" }, { v: 12, n: "12" },
];
const MONTHS_NAME_PT = [
    "", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const PCT = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

const pad2 = (n: number) => String(n).padStart(2, "0");
const horas = Array.from({ length: 15 }, (_, i) => 9 + i); // 9..23
const intervaloLabel = (h: number) => `${pad2(h)} / ${pad2(h + 1)}`;

function diasNoMes(ano: number, mes1: number) {
    return new Date(ano, mes1, 0).getDate();
}
function headerPeriodo(mes: number, ano: number) {
    const last = diasNoMes(ano, mes);
    return `VENDAS POR INTERVALO HORÁRIO - DE 01 A ${pad2(last)} DE ${MONTHS_NAME_PT[mes]} - ${ano}`;
}

/** Soma valores por [linha (hora)] x [coluna (0..6 dom..sab)] */
function agregaPorHoraDiaSemana(vendas: any[]) {
    const matriz: number[][] = horas.map(() => Array(7).fill(0));
    for (const v of vendas) {
        const dt = new Date(v.createdAt ?? v.auditoria?.data);
        const dow = dt.getDay();               // 0..6
        const h = dt.getHours();               // 0..23
        if (dow < 0 || dow > 6) continue;
        if (h < 9 || h > 23) continue;
        const row = h - 9;
        const valor = Number(v.valor) || 0;
        matriz[row][dow] += valor;
    }
    return matriz;
}

function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }

/* ================ export helpers (xlsx/pdf) ================ */

async function exportXLSX({
    rows,
    colTotals,
    grandTotal,
    mes,
    ano,
    lojaNome,
}: {
    rows: { label: string; valores: number[]; total: number; pct: number }[];
    colTotals: number[];
    grandTotal: number;
    mes: number;
    ano: number;
    lojaNome: string;
}) {
    const ExcelJS = await import("exceljs");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Vendas por intervalo", { properties: { defaultRowHeight: 18 } });

    const title = headerPeriodo(mes, ano);
    ws.mergeCells("A1:J1");
    ws.getCell("A1").value = title;
    ws.getCell("A1").font = { name: "Arial", bold: true, size: 14 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:J2");
    ws.getCell("A2").value = `LOJA: ${lojaNome || "-"}`;
    ws.getCell("A2").font = { name: "Arial", size: 10 };

    // grade
    ws.columns = [
        { header: "HORÁRIO / INT.", key: "label", width: 15 },
        ...DAYS_PT.map((d, i) => ({ header: d, key: `d${i}`, width: 14 })),
        { header: "TOTAIS", key: "tot", width: 14 },
        { header: "%", key: "pct", width: 8 },
    ];

    // cabeçalho escuro
    ws.getRow(4).font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(4).alignment = { horizontal: "center" };
    ws.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212121" } };

    const moneyFmt = '"R$"#,##0.00';
    const pctFmt = '0.0%';

    // linhas
    rows.forEach((r) => {
        const row = ws.addRow({
            label: r.label,
            ...Object.fromEntries(r.valores.map((v, i) => [`d${i}`, v] as const)),
            tot: r.total,
            pct: r.pct,
        });
        for (let i = 2; i <= 8; i++) row.getCell(i).numFmt = moneyFmt;
        row.getCell(9).numFmt = moneyFmt;
        row.getCell(10).numFmt = pctFmt;
    });

    // totais (rodapé)
    const pctCols = colTotals.map((v) => (grandTotal > 0 ? v / grandTotal : 0));
    const totRow = ws.addRow({
        label: "TOTAIS",
        ...Object.fromEntries(colTotals.map((v, i) => [`d${i}`, v] as const)),
        tot: grandTotal,
        pct: 1,
    });
    totRow.font = { bold: true };
    for (let i = 2; i <= 8; i++) totRow.getCell(i).numFmt = moneyFmt;
    totRow.getCell(9).numFmt = moneyFmt;
    totRow.getCell(10).numFmt = pctFmt;

    const pctRow = ws.addRow({
        label: "% S/TOTAL",
        ...Object.fromEntries(pctCols.map((v, i) => [`d${i}`, v] as const)),
        tot: 1,
        pct: 1,
    });
    for (let i = 2; i <= 8; i++) pctRow.getCell(i).numFmt = pctFmt;
    pctRow.getCell(9).numFmt = pctFmt;
    pctRow.getCell(10).numFmt = pctFmt;

    // bordas nas linhas de dados
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber >= 4) {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" }, left: { style: "thin" },
                    bottom: { style: "thin" }, right: { style: "thin" },
                };
                cell.font = { name: "Arial", size: 10, bold: rowNumber === ws.rowCount };
            });
        }
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas-intervalo_${pad2(mes)}-${ano}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportPDF({
    rows, colTotals, grandTotal, mes, ano, lojaNome,
}: {
    rows: { label: string; valores: number[]; total: number; pct: number }[];
    colTotals: number[];
    grandTotal: number;
    mes: number;
    ano: number;
    lojaNome: string;
}) {
    const { default: jsPDF } = await import("jspdf");
    const autoTableMod = await import("jspdf-autotable");
    const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

    const doc = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });
    const title = headerPeriodo(mes, ano);

    const pageW = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(title, pageW / 2, 40, { align: "center" });

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`LOJA: ${lojaNome || "-"}`, 20, 60);

    const head = [["HORÁRIO / INT.", ...DAYS_PT, "TOTAIS", "%"]];
    const body = rows.map((r) => [
        r.label,
        ...r.valores.map((v) => BRL.format(v)),
        BRL.format(r.total),
        PCT.format(r.pct),
    ]);

    // rodapé
    body.push([
        "TOTAIS",
        ...colTotals.map((v) => BRL.format(v)),
        BRL.format(grandTotal),
        PCT.format(1),
    ]);
    body.push([
        "% S/TOTAL",
        ...colTotals.map((v) => PCT.format(grandTotal > 0 ? v / grandTotal : 0)),
        PCT.format(1),
        PCT.format(1),
    ]);

    autoTable(doc, {
        head, body, startY: 80,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [33, 33, 33], textColor: 255 },
        columnStyles: { 0: { cellWidth: 90 } },
        margin: { left: 20, right: 20 },
    });

    doc.save(`vendas-intervalo_${pad2(mes)}-${ano}.pdf`);
}

/* ================= componente ================= */

export default function TabelaVendasPorIntervalo() {
    const { data: lojasResp } = useLojas({ limit: 500 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    const [formLojaId, setFormLojaId] = React.useState<number | undefined>();
    const [formMes, setFormMes] = React.useState<number | undefined>();
    const [formAno, setFormAno] = React.useState<number | undefined>();

    const [query, setQuery] = React.useState<{ lojaId?: number; mes?: number; ano?: number } | null>(null);
    const enabled = !!query;

    const { data, isFetching } = useVendas(
        query ? { lojaId: query.lojaId, mes: query.mes, ano: query.ano, page: 1, limit: 8000 } : {},
        { enabled }
    );
    const vendas = data?.data ?? [];

    const canSearch = !!(formLojaId && formMes && formAno);
    const lojaNome =
        (lojas.find((l) => l.id === query?.lojaId)?.descricao ??
            lojas.find((l) => l.id === query?.lojaId)?.name) ?? "-";

    function onBuscar() {
        if (!canSearch) return;
        setQuery({ lojaId: formLojaId, mes: formMes, ano: formAno });
    }
    function onLimpar() {
        setFormLojaId(undefined); setFormMes(undefined); setFormAno(undefined); setQuery(null);
    }

    // ===== agregação
    const matriz = React.useMemo(() => (enabled ? agregaPorHoraDiaSemana(vendas) : horas.map(() => Array(7).fill(0))), [enabled, vendas]);
    const rows = React.useMemo(() => {
        const r = horas.map((h, idx) => {
            const valores = matriz[idx];
            const total = sum(valores);
            return { label: `${pad2(h)}/${pad2(h + 1)}`, valores, total };
        });
        const grand = sum(r.map((x) => x.total));
        return r.map((x) => ({ ...x, pct: grand > 0 ? x.total / grand : 0 }));
    }, [matriz]);

    const colTotals = React.useMemo(() => {
        const tot = Array(7).fill(0);
        for (let c = 0; c < 7; c++) for (let r = 0; r < matriz.length; r++) tot[c] += matriz[r][c];
        return tot;
    }, [matriz]);

    const grandTotal = React.useMemo(() => sum(colTotals), [colTotals]);

    // dados do gráfico
    const chartData = rows.map((r) => ({ hora: r.label.replace("/", " / "), pct: Number((r.pct * 100).toFixed(2)) }));

    const canExport = enabled && !isFetching && grandTotal > 0;

    return (
        <>
            <Card className="bg-transparent mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-center">
                        {enabled ? headerPeriodo(query!.mes!, query!.ano!) : "VENDAS POR INTERVALO HORÁRIO"}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        {enabled ? (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>LOJA: <span className="text-foreground">{lojaNome}</span></div>
                                <div>MÊS/ANO: <span className="text-foreground">{pad2(query!.mes!)} / {query!.ano}</span></div>
                            </div>
                        ) : <div className="flex-1" />}

                        <div className="flex-1 flex flex-col lg:flex-row items-end justify-end gap-2">
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
                                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Mês" /></SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m) => <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="ml-1.5">Ano</Label>
                                <Select value={formAno ? String(formAno) : ""} onValueChange={(v) => setFormAno(v ? Number(v) : undefined)}>
                                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Ano" /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) =>
                                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <Button onClick={onBuscar} disabled={!canSearch} size="sm" className="cursor-pointer">
                                    <Search className="mr-2 h-4 w-4" /> Buscar
                                </Button>
                                <Button onClick={onLimpar} variant="outline" size="sm" className="cursor-pointer">
                                    <FunnelX />
                                </Button>
                                <Button
                                    onClick={() => exportXLSX({ rows, colTotals, grandTotal, mes: query!.mes!, ano: query!.ano!, lojaNome })}
                                    disabled={!canExport}
                                    variant="outline"
                                    size="sm"
                                    title="Exportar XLSX"
                                    className="cursor-pointer"
                                >
                                    <Download className="mr-2 h-4 w-4" /> XLSX
                                </Button>
                                <Button
                                    onClick={() => exportPDF({ rows, colTotals, grandTotal, mes: query!.mes!, ano: query!.ano!, lojaNome })}
                                    disabled={!canExport}
                                    variant="outline"
                                    size="sm"
                                    title="Exportar PDF"
                                    className="cursor-pointer"
                                >
                                    <Download className="mr-2 h-4 w-4" /> PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* tabela */}
            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-card shadow-card text-muted-foreground">
                            <TableHead className="min-w-[120px] text-center py-1.5">HORÁRIO / INT.</TableHead>
                            {DAYS_PT.map((d) => <TableHead key={d} className="py-1.5 text-center">{d}</TableHead>)}
                            <TableHead className="py-1.5 text-center">TOTAIS</TableHead>
                            <TableHead className="py-1.5 text-center">%</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!enabled && (
                            <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">
                                Selecione Loja, Mês e Ano e clique em Buscar.
                            </TableCell></TableRow>
                        )}
                        {enabled && isFetching && (
                            <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">
                                <LoadingSpinner size="lg" text="Carregando..." />
                            </TableCell></TableRow>
                        )}
                        {enabled && !isFetching && rows.map((r) => (
                            <TableRow key={r.label}>
                                <TableCell className="py-1 whitespace-nowrap">{r.label.replace("/", " / ")}</TableCell>
                                {r.valores.map((v, i) => (
                                    <TableCell key={i} className="py-1 text-right">{v ? BRL.format(v) : "-"}</TableCell>
                                ))}
                                <TableCell className="py-1 text-right font-semibold">{r.total ? BRL.format(r.total) : "-"}</TableCell>
                                <TableCell className="py-1 text-right">{PCT.format(r.pct)}</TableCell>
                            </TableRow>
                        ))}
                        {enabled && !isFetching && (
                            <>
                                <TableRow className="bg-muted/60 font-semibold">
                                    <TableCell className="py-1">TOTAIS</TableCell>
                                    {colTotals.map((v, i) => (
                                        <TableCell key={i} className="py-1 text-right">{v ? BRL.format(v) : "-"}</TableCell>
                                    ))}
                                    <TableCell className="py-1 text-right">{grandTotal ? BRL.format(grandTotal) : "-"}</TableCell>
                                    <TableCell className="py-1 text-right">{PCT.format(1)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/30">
                                    <TableCell className="py-1">% S/TOTAL</TableCell>
                                    {colTotals.map((v, i) => (
                                        <TableCell key={i} className="py-1 text-right">
                                            {PCT.format(grandTotal > 0 ? v / grandTotal : 0)}
                                        </TableCell>
                                    ))}
                                    <TableCell className="py-1 text-right">{PCT.format(1)}</TableCell>
                                    <TableCell className="py-1 text-right">{PCT.format(1)}</TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* gráfico de % por intervalo (opcional, igual ao modelo) */}
            {enabled && !isFetching && (
                <Card className="mt-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-center text-sm">
                            Gráfico de Vendas por Intervalo Horário — {MONTHS_NAME_PT[query!.mes!]} / {query!.ano}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    barSize={50}
                                >
                                    <CartesianGrid strokeDasharray="0 3" />
                                    <XAxis dataKey="hora" scale="point" />
                                    <YAxis tickFormatter={(v) => `${v.toFixed(1)}%`} />
                                    <Tooltip 
                                        formatter={(v: any) => `${Number(v).toFixed(1)}%`} 
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0.75rem',
                                        }}
                                    />
                                    <Bar dataKey="pct" fill="#FFFFC0" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
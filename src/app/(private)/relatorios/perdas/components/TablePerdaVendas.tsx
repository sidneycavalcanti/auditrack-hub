"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { Search, FunnelX, Download } from "lucide-react";

import { usePerdaVendas } from "../hooks/usePerdaVendas";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

/* ------------- helpers ------------- */

const BR_DT = (iso?: string) => {
    if (!iso) return "--/--/----";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const BR_HM = (iso?: string) => {
    if (!iso) return "--:--";
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
};

const toStartISO = (ymd: string) => `${ymd}T00:00:00.000Z`;
const toEndISO = (ymd: string) => `${ymd}T23:59:59.999Z`;

/* ------------- componente ------------- */

export default function TablePerdaVendas() {
    // filtros
    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [motivoTxt, setMotivoTxt] = React.useState<string>("");
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");

    // regra: habilita com (loja) OU (motivo texto) OU (dateFrom && dateTo)
    const canSearch = Boolean(lojaId || motivoTxt.trim() || (dateFrom && dateTo));

    // params efetivos
    const [params, setParams] = React.useState<{
        lojaId?: number;
        motivo?: string;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    } | null>(null);

    const enabled = !!params;

    // Lojas
    const { data: lojasResp } = useLojas({ limit: 1000 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    // Busca principal
    const { data, isFetching } = usePerdaVendas(params ?? {}, { enabled });
    const rows = data?.data ?? [];

    const lojaNome =
        lojas.find((l) => l.id === params?.lojaId)?.descricao ??
        lojas.find((l) => l.id === params?.lojaId)?.name ??
        "-";

    function onBuscar() {
        if (!canSearch) return;

        const p: any = { page: 1, limit: 4000 };
        if (lojaId) p.lojaId = lojaId;
        if (motivoTxt.trim()) p.motivo = motivoTxt.trim();
        if (dateFrom && dateTo) {
            p.dateFrom = toStartISO(dateFrom);
            p.dateTo = toEndISO(dateTo);
        }
        setParams(p);
    }

    function onLimpar() {
        setLojaId(undefined);
        setMotivoTxt("");
        setDateFrom("");
        setDateTo("");
        setParams(null);
    }

    // linhas para export/grade
    type PrintableRow = {
        data: string;
        hora: string;
        loja: string;
        usuario: string;
        motivo: string;
        obs: string;
    };

    const printableRows: PrintableRow[] = React.useMemo(() => {
        if (!enabled) return [];
        return rows.map((r: any) => {
            const dtISO = r.auditoria?.data ?? r.createdAt;
            const loja = r.auditoria?.loja?.name ?? r.auditoria?.loja?.descricao ?? "-";
            const usuario = r.auditoria?.usuario?.name ?? `ID ${r.auditoria?.usuario?.id ?? "-"}`;
            const motivo = r.motivoperdas?.name ?? r.motivoName ?? "-";
            const obs = r.obs ?? "";
            return {
                data: BR_DT(dtISO),
                hora: BR_HM(dtISO),
                loja,
                usuario,
                motivo,
                obs,
            };
        });
    }, [enabled, rows]);

    /* ---------- export XLSX ---------- */
    async function exportXLSX() {
        if (!printableRows.length) return;
        const ExcelJS = await import("exceljs");

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Perdas");

        const title = "RELATÓRIO DE PERDAS";
        const meta1 = `LOJA: ${lojaNome}`;
        const meta2 =
            params?.dateFrom || params?.dateTo
                ? `PERÍODO: ${params?.dateFrom?.slice(0, 10) ?? "--"} à ${params?.dateTo?.slice(0, 10) ?? "--"}`
                : "PERÍODO: —";

        ws.mergeCells("A1:F1");
        ws.getCell("A1").value = title;
        ws.getCell("A1").font = { name: "Arial", bold: true, size: 14 };
        ws.getCell("A1").alignment = { horizontal: "center" };

        ws.mergeCells("A2:F2");
        ws.getCell("A2").value = meta1;
        ws.getCell("A2").font = { name: "Arial", size: 10 };

        ws.mergeCells("A3:F3");
        ws.getCell("A3").value = meta2;
        ws.getCell("A3").font = { name: "Arial", size: 10 };

        ws.addRow([]);

        ws.columns = [
            { header: "DATA", key: "data", width: 12 },
            { header: "HORA", key: "hora", width: 8 },
            { header: "LOJA", key: "loja", width: 24 },
            { header: "USUÁRIO", key: "usuario", width: 24 },
            { header: "MOTIVO", key: "motivo", width: 24 },
            { header: "OBSERVAÇÃO", key: "obs", width: 40 },
        ];

        const headerRow = ws.addRow((ws.columns as any[]).map((c) => String(c.header ?? "")));
        headerRow.height = 20;
        headerRow.eachCell((cell) => {
            cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212121" } };
        });

        for (const r of printableRows) {
            ws.addRow(r);
        }

        // borda + fonte
        const firstTableRow = headerRow.number;
        ws.eachRow({ includeEmpty: false }, (row, idx) => {
            if (idx >= firstTableRow) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    if (idx > firstTableRow) {
                        cell.font = { name: "Arial", size: 10, color: { argb: "FF000000" } };
                    }
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
        a.download = `perdas_loja-${params?.lojaId ?? "all"}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ---------- export PDF ---------- */
    async function exportPDF() {
        if (!printableRows.length) return;
        const { default: jsPDF } = await import("jspdf");
        const autoTableMod = await import("jspdf-autotable");
        const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

        const doc = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });

        const title = "RELATÓRIO DE PERDAS";
        const meta1 = `LOJA: ${lojaNome}`;
        const meta2 =
            params?.dateFrom || params?.dateTo
                ? `PERÍODO: ${params?.dateFrom?.slice(0, 10) ?? "--"} à ${params?.dateTo?.slice(0, 10) ?? "--"}`
                : "PERÍODO: —";

        const pageW = doc.internal.pageSize.getWidth();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title, pageW / 2, 40, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(meta1, 20, 64);
        doc.text(meta2, 20, 80);

        const head = [["DATA", "HORA", "LOJA", "USUÁRIO", "MOTIVO", "OBSERVAÇÃO"]];
        const body = printableRows.map((r) => [r.data, r.hora, r.loja, r.usuario, r.motivo, r.obs]);

        autoTable(doc, {
            head,
            body,
            startY: 100,
            styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
            headStyles: { fillColor: [33, 33, 33], textColor: 255 },
            columnStyles: { 2: { cellWidth: 140 }, 3: { cellWidth: 120 }, 5: { cellWidth: 220 } },
            margin: { left: 20, right: 20 },
        });

        doc.save(`perdas_loja-${params?.lojaId ?? "all"}.pdf`);
    }

    /* ---------- render ---------- */

    return (
        <>
            <Card className="bg-transparent mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-center">Relatório de Perdas</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Identificação à esquerda */}
                        {enabled ? (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>
                                    LOJA: <span className="text-foreground">{lojaNome}</span>
                                </div>
                                {(params?.dateFrom || params?.dateTo) && (
                                    <div>
                                        PERÍODO:{" "}
                                        <span className="text-foreground">
                                            {(params?.dateFrom as string)?.slice(0, 10) ?? "--"} à{" "}
                                            {(params?.dateTo as string)?.slice(0, 10) ?? "--"}
                                        </span>
                                    </div>
                                )}
                                {!!params?.motivo && (
                                    <div>
                                        MOTIVO (texto):{" "}
                                        <span className="text-foreground">{params.motivo}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1" />
                        )}

                        {/* Filtros */}
                        <div className="flex-1 flex flex-col lg:flex-row items-end justify-end gap-2">
                            <div className="space-y-1">
                                <Label className="ml-1.5">Loja</Label>
                                <Select
                                    value={lojaId ? String(lojaId) : ""}
                                    onValueChange={(v) => setLojaId(v ? Number(v) : undefined)}
                                >
                                    <SelectTrigger className="cursor-pointer w-[220px]">
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
                                <Label className="ml-1.5">Motivo (texto)</Label>
                                <Input
                                    placeholder="ex.: Preço, Atendimento..."
                                    value={motivoTxt}
                                    onChange={(e) => setMotivoTxt(e.target.value)}
                                    className="w-[240px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="ml-1.5">Data inicial</Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="ml-1.5">Data final</Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    onClick={onBuscar}
                                    disabled={!canSearch}
                                    size="sm"
                                    className="cursor-pointer"
                                >
                                    <Search className="mr-2 h-4 w-4" /> Buscar
                                </Button>

                                <Button
                                    onClick={onLimpar}
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    title="Limpar filtros"
                                >
                                    <FunnelX />
                                </Button>

                                <Button
                                    onClick={exportXLSX}
                                    disabled={!enabled || isFetching || !printableRows.length}
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    title="Exportar XLSX"
                                >
                                    <Download className="mr-2 h-4 w-4" /> XLSX
                                </Button>

                                <Button
                                    onClick={exportPDF}
                                    disabled={!enabled || isFetching || !printableRows.length}
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    title="Exportar PDF"
                                >
                                    <Download className="mr-2 h-4 w-4" /> PDF
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
                            <TableHead className="py-1.5 text-center">DATA</TableHead>
                            <TableHead className="py-1.5 text-center">HORA</TableHead>
                            <TableHead className="py-1.5">LOJA</TableHead>
                            <TableHead className="py-1.5">USUÁRIO</TableHead>
                            <TableHead className="py-1.5">MOTIVO</TableHead>
                            <TableHead className="py-1.5">OBSERVAÇÃO</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!enabled && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Selecione <b>Loja</b>, informe um <b>Motivo</b> (texto) ou escolha um{" "}
                                    <b>Período</b> (data inicial e final) e clique em Buscar.
                                </TableCell>
                            </TableRow>
                        )}

                        {enabled && isFetching && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    <LoadingSpinner size="lg" text="Carregando..." />
                                </TableCell>
                            </TableRow>
                        )}

                        {enabled && !isFetching && printableRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Nenhuma perda encontrada.
                                </TableCell>
                            </TableRow>
                        )}

                        {enabled &&
                            !isFetching &&
                            printableRows.map((r, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="py-1 text-center whitespace-nowrap">{r.data}</TableCell>
                                    <TableCell className="py-1 text-center whitespace-nowrap">{r.hora}</TableCell>
                                    <TableCell className="py-1">{r.loja}</TableCell>
                                    <TableCell className="py-1">{r.usuario}</TableCell>
                                    <TableCell className="py-1">{r.motivo}</TableCell>
                                    <TableCell className="py-1">{r.obs}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
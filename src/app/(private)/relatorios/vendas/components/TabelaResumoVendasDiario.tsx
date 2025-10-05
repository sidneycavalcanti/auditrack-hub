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
import type { Loja } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useResumoDiarioReport, type ResumoRow } from "../hooks/useRelatoriosAPI";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (p: number, t: number) => (t > 0 ? p / t : 0);

const fmtBR = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export default function TabelaResumoVendasDiario() {
    const { data: lojasResp } = useLojas({ limit: 500 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [dataDia, setDataDia] = React.useState<Date | undefined>();
    const [openDate, setOpenDate] = React.useState(false);

    const [params, setParams] = React.useState<{ lojaId?: number; date?: string } | null>(null);
    const enabled = !!params;

    const { data, isFetching } = useResumoDiarioReport(params, { enabled });
    const rows = (data?.rows ?? []) as ResumoRow[];

    const lojaNome =
        (lojas.find((l) => l.id === params?.lojaId)?.descricao ??
            lojas.find((l) => l.id === params?.lojaId)?.name) ?? "-";

    const canSearch = !!(lojaId && dataDia);
    const onBuscar = () => {
        if (!canSearch) return;
        setParams({ lojaId, date: ymd(dataDia!) });
    };
    const onLimpar = () => { setLojaId(undefined); setDataDia(undefined); setParams(null); };

    // export (reaproveite suas funções, aqui omitimos por brevidade)
    const [exportFmt, setExportFmt] = React.useState<"" | "xlsx" | "pdf">("");
    const canExport = enabled && !isFetching && rows.length > 0 && !!exportFmt;

    async function handleExport() {
        if (!canExport) return;
        const printableRows = rows.map((r) => {
            const base = r.kind === "valor" ? r.data.geral.valor : r.data.geral.qtd;
            const m = r.kind === "valor" ? currency : new Intl.NumberFormat("pt-BR");
            const vM = r.kind === "valor" ? r.data.manha.valor : r.data.manha.qtd;
            const vT = r.kind === "valor" ? r.data.tarde.valor : r.data.tarde.qtd;
            const vN = r.kind === "valor" ? r.data.noite.valor : r.data.noite.qtd;
            return {
                ITEM: r.label,
                GERAL: r.kind === "valor" ? m.format(base) : String(base),
                MANHA: r.kind === "valor" ? m.format(vM) : String(vM),
                PCT_MANHA: percent.format(pct(vM, base)),
                TARDE: r.kind === "valor" ? m.format(vT) : String(vT),
                PCT_TARDE: percent.format(pct(vT, base)),
                NOITE: r.kind === "valor" ? m.format(vN) : String(vN),
                PCT_NOITE: percent.format(pct(vN, base)),
            };
        });

        const hdr = {
            title: "RESUMO DO MAPA DIÁRIO DE VENDAS E FLUXOS",
            loja: `LOJA / NOME FANTASIA: ${lojaNome || "—"}`,
            data: `DATA: ${fmtBR(new Date(params!.date!))}`,
        };
        const base = `resumo-diario_${params!.date!.replace(/-/g, "")}_loja-${params!.lojaId}`;
        if (exportFmt === "xlsx") {
            const { default: exporter } = await import("./_exporters/exportResumoDiarioXLSX");
            await exporter(printableRows, `${base}.xlsx`, hdr);
        } else if (exportFmt === "pdf") {
            const { default: exporter } = await import("./_exporters/exportResumoDiarioPDF");
            await exporter(printableRows, `${base}.pdf`, hdr);
        }
    }

    return (
        <>
            <Card className="bg-transparent mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-center">RESUMO DO MAPA DIÁRIO DE VENDAS E FLUXOS</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        {enabled ? (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>LOJA / NOME FANTASIA: <span className="text-foreground">{lojaNome}</span></div>
                                <div>DATA: <span className="text-foreground">{fmtBR(new Date(params!.date!))}</span></div>
                            </div>
                        ) : (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>LOJA / NOME FANTASIA: <span className="text-foreground">--</span></div>
                                <div>DATA: <span className="text-foreground">--/--/----</span></div>
                            </div>
                        )}

                        <div className="flex-1 flex flex-col lg:flex-row items-end justify-end gap-2">
                            <div className="space-y-1">
                                <Label className="ml-1.5">Loja</Label>
                                <Select value={lojaId ? String(lojaId) : ""} onValueChange={(v) => setLojaId(v ? Number(v) : undefined)}>
                                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                                    <SelectContent>
                                        {lojas.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.descricao ?? l.name ?? `Loja ${l.id}`}</SelectItem>)}
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

                            <div className="flex items-center justify-center gap-2">
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
                                        <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
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

                    {enabled && isFetching && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                        <LoadingSpinner size="lg" text="Carregando..." />
                        </TableCell>
                    </TableRow>
                    )}

                    {enabled && !isFetching && rows.map((r) => {
                    const base = r.kind === "valor" ? r.data.geral.valor : r.data.geral.qtd;
                    const vM = r.kind === "valor" ? r.data.manha.valor : r.data.manha.qtd;
                    const vT = r.kind === "valor" ? r.data.tarde.valor : r.data.tarde.qtd;
                    const vN = r.kind === "valor" ? r.data.noite.valor : r.data.noite.qtd;
                    const fmt = (x: number) => (r.kind === "valor" ? currency.format(x) : String(x));
                    return (
                        <TableRow key={r.label}>
                        <TableCell className="py-1 whitespace-nowrap">{r.label}</TableCell>
                        <TableCell className="py-1">{fmt(base)}</TableCell>
                        <TableCell className="py-1">{fmt(vM)}</TableCell>
                        <TableCell className="py-1">{percent.format(pct(vM, base))}</TableCell>
                        <TableCell className="py-1">{fmt(vT)}</TableCell>
                        <TableCell className="py-1">{percent.format(pct(vT, base))}</TableCell>
                        <TableCell className="py-1">{fmt(vN)}</TableCell>
                        <TableCell className="py-1">{percent.format(pct(vN, base))}</TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </div>
        </>
    );
}
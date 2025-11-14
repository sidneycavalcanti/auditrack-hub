// FILE: src/app/(private)/relatorios/fluxos/components/FluxoPorSemana.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"
import { useFluxoPorSemana } from "../hooks/useFluxoPorSemana";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import "@/app/styles/relatorios_pdf/fluxo-por-semana.css";

const DOW = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COLORS = ["#06b6d4", "#047857", "#ca8a04", "#1e40af", "#991b1b", "#c2410c"];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    mobile: {
        label: "Mobile",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

const fmt = (n: number | null | undefined) => Intl.NumberFormat("pt-BR").format(Number(n ?? 0));

export default function FluxoPorSemana() {
    const ALL = "ALL";

    const now = new Date();

    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [mes, setMes] = React.useState<number | undefined>();
    const [ano, setAno] = React.useState<number | undefined>(now.getFullYear());

    const { data: lojasResp } = useLojas({ limit: 1000 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];
    const lojaAtual = lojaId ? lojas.find(l => l.id === lojaId) : undefined;

    const { linhas, porDia, totalPorSemana } =
        useFluxoPorSemana({ lojaId, mes, ano }, { enabled: true });

    const metaLoja = lojaAtual?.descricao ?? lojaAtual?.name ?? (lojaId ? `Loja ${lojaId}` : "Todas");
    const metaMes = mes ? MESES[mes - 1] : "Todos";
    const metaAno = ano ?? "Todos";

    /* ===== Export XLSX ===== */
    const exportXLSX = () => {
        const header = ["Semana", ...DOW, "Total"];
        const body = linhas.map(l => [l.semana, ...DOW.map(d => Number(l[d] ?? 0)), l.total]);
        const totalsRow = [
            "Total",
            ...DOW.map(d => linhas.reduce((a, l) => a + Number(l[d] ?? 0), 0)),
            linhas.reduce((a, l) => a + Number(l.total ?? 0), 0),
        ];

        const ws = XLSX.utils.aoa_to_sheet([
            ["Fluxo de Pessoas por Semana"],
            [`Loja: ${metaLoja}   Mês: ${metaMes}   Ano: ${metaAno}`],
            [""],
            header,
            ...body,
            totalsRow,
        ]);

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } },
        ];
        ws["!cols"] = header.map((_h, i) => ({ wch: i === 0 ? 14 : 12 }));

        const center = { alignment: { horizontal: "center", vertical: "center" } } as any;
        const boldCenter = { font: { bold: true }, ...center } as any;

        const aTitle = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (ws[aTitle]) (ws[aTitle] as any).s = boldCenter;

        const aMeta = XLSX.utils.encode_cell({ r: 1, c: 0 });
        if (ws[aMeta]) (ws[aMeta] as any).s = { alignment: { horizontal: "left" } } as any;

        // Cabeçalho da tabela
        for (let c = 0; c < header.length; c++) {
            const a = XLSX.utils.encode_cell({ r: 3, c });
            if (ws[a]) (ws[a] as any).s = boldCenter;
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FluxoPorSemana");
        XLSX.writeFile(wb, "fluxo_por_semana.xlsx");
    };

    /* ===== Export PDF (print) ===== */
    const exportPDF = () => {
        const dt = new Date();
        const el = document.querySelector<HTMLSpanElement>("#print-root-fluxo-semana .print-datetime");
        if (el) {
            const f = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
            el.textContent = f.format(dt);
        }
        const prev = document.title;
        document.title = `Relatorio de Fluxo - Fluxo por Semana (${metaLoja}) ${metaMes}/${metaAno}`;
        const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
        window.addEventListener("afterprint", restore);
        window.print();
        setTimeout(restore, 1500);
    };

    return (
        <Card className="bg-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="text-center">Fluxo de Pessoas por Semana</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-end gap-3 justify-between print:hidden">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <Label className="ml-1.5">Loja</Label>
                            <Select value={lojaId ? String(lojaId) : undefined} onValueChange={(v) => setLojaId(v === ALL ? undefined : Number(v))}>
                                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todas as lojas" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>Todas</SelectItem>
                                    {lojas.map(l => (
                                        <SelectItem key={l.id} value={String(l.id)}>{l.descricao ?? l.name ?? `Loja ${l.id}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="ml-1.5">Mês</Label>
                            <Select value={mes ? String(mes) : undefined} onValueChange={(v) => setMes(v === ALL ? undefined : Number(v))}>
                                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>Todos</SelectItem>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m =>
                                        <SelectItem key={m} value={String(m)}>{m.toString().padStart(2, "0")}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="ml-1.5">Ano</Label>
                            <Select value={ano ? String(ano) : undefined} onValueChange={(v) => setAno(v === ALL ? undefined : Number(v))}>
                                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>Todos</SelectItem>
                                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(a =>
                                        <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="link" size="sm" onClick={exportXLSX} className="underline text-sm text-primary hover:opacity-80 cursor-pointer">Exportar XLSX</Button>
                        <Button variant="link" size="sm" onClick={() => { void exportPDF(); }} className="underline text-sm text-primary hover:opacity-80 cursor-pointer">Exportar PDF</Button>
                    </div>
                </div>

                {/* ================== ÁREA IMPRIMÍVEL ================== */}
                <div id="print-root-fluxo-semana" className="print-root space-y-3">
                    {/* Cabeçalho exclusivo do PDF */}
                    <h1 className="w-full text-center only-print text-xl bg-muted/30 font-semibold mb-0">
                        Relatórios de Fluxo — Fluxo por Semana
                    </h1>
                    <div className="only-print text-sm mt-0">
                        <div className="text-foreground font-semibold">LOJA: <span className="text-foreground font-normal">{metaLoja}</span></div>
                        <div className="text-foreground font-semibold">MÊS/ANO: <span className="text-foreground font-normal">{metaMes}/{metaAno}</span></div>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto rounded-md print-border-radius-0 border print-box-border">
                        <Table className="">
                            <TableHeader>
                                <TableRow className="bg-muted/20 shadow-card text-muted-foreground">
                                    <TableHead>Semana</TableHead>
                                    {DOW.map((d) => <TableHead key={d} className="text-right print-box-border">{d}</TableHead>)}
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {linhas.map((l) => (
                                    <TableRow key={l.semana}>
                                        <TableCell className="print-box-border">{l.semana}</TableCell>
                                        {DOW.map((d) => (
                                            <TableCell key={d} className="text-right print-box-border">{fmt(l[d] as number)}</TableCell>
                                        ))}
                                        <TableCell className="text-right font-medium print-box-border">{fmt(l.total)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/20 font-semibold">
                                    <TableCell className="print-box-border">Total</TableCell>
                                    {DOW.map((d) => (
                                        <TableCell key={d} className="text-right print-box-border">
                                            {fmt(linhas.reduce((a, l) => a + Number(l[d] ?? 0), 0))}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right print-box-border">
                                        {fmt(linhas.reduce((a, l) => a + Number(l.total ?? 0), 0))}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Charts */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-3 print-flex-col">
                        {/* Barras: Por dia (empilhando semanas) */}
                        <div className="w-full h-full col-span-1 lg:col-span-2 avoid-break rounded-md print-border-radius-0 border px-3 pt-2 pb-3 overflow-hidden print:overflow-visible print:chart">

                            <div className="flex flex-col lg:flex-row items-center justify-between gap-1 pb-4 mb-4 border-b print-chart-box-border-bottom">
                                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Por dia × semanas</h3>
                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Período mensal:</span> {metaMes} de {metaAno}</p>
                            </div>
                            <div className="items-center justify-center min-h-0 chart-slot">
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <BarChart data={porDia} accessibilityLayer margin={{ top: 16, bottom: 16 }}>
                                        <CartesianGrid vertical={false} horizontal={false} />
                                        <XAxis
                                            dataKey="dia"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                        />

                                        <ChartTooltip
                                            cursor={{ opacity: 0.80 }}
                                            content={<ChartTooltipContent indicator="line" />}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        {totalPorSemana.map((s, i) => (
                                            <Bar
                                                key={s.semana}
                                                dataKey={s.semana}
                                                name={s.semana}
                                                fill={COLORS[i % COLORS.length]}
                                                label={{ position: 'top', fontSize: 10 }}
                                                radius={4}
                                            />
                                        ))}
                                    </BarChart>
                                </ChartContainer>
                            </div>
                            <div className="flex flex-col items-start gap-2 text-sm pt-4 border-t print-chart-box-border-top">
                                <div className="flex gap-2 leading-none font-medium">
                                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                                </div>
                                <div className="text-muted-foreground leading-none">
                                    Showing total visitors for the last 6 months
                                </div>
                            </div>
                        </div>

                        {/* Barras: Total por Semana (card compacto com ChartContainer) */}
                        <div className="flex flex-col w-full avoid-break rounded-md print-border-radius-0 border px-3 pt-2 pb-3 overflow-hidden print:overflow-visible print:chart">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-1 pb-4 mb-4 border-b print-chart-box-border-bottom">
                                <h3 className="mb-1 text-sm font-semibold text-muted-foreground">Fluxo por semana</h3>
                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Período mensal:</span> {metaMes} de {metaAno}</p>
                            </div>

                            <div className="items-center justify-center min-h-0 chart-slot">
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <BarChart accessibilityLayer data={totalPorSemana} margin={{ top: 16 }}>
                                        <CartesianGrid vertical={false} horizontal={false} />
                                        <XAxis
                                            dataKey="semana"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false} />

                                        <ChartTooltip
                                            content={<ChartTooltipContent indicator="line" />}
                                        />
                                        <Bar dataKey="total" name="Total" fill="var(--chart-7)" radius={4} label={{ position: 'top', fontSize: 10 }} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                            <div className="flex flex-col w-full items-start gap-2 text-sm pt-4 border-t print-chart-box-border-top">
                                <div className="flex gap-2 leading-none font-medium">
                                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                                </div>
                                <div className="text-muted-foreground leading-none">
                                    Showing total visitors for the last 6 months
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé ONLY PRINT */}
                    <footer className="print-footer footer-only-print">
                        <div className="footer-left">Relatórios de Fluxo — Fluxo por Semana</div>
                        <div className="footer-center">Loja: {metaLoja} • {metaMes}/{metaAno}</div>
                        <div className="footer-right">Gerado em: <span className="print-datetime"></span></div>
                        <div className="footer-right">Página: <span className="pageNumber"></span>/<span className="totalPages"></span></div>
                    </footer>
                </div>
                {/* ================== /ÁREA IMPRIMÍVEL ================== */}
            </CardContent>
        </Card>
    );
}
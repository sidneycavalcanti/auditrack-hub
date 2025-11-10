// FILE: src/app/(private)/relatorios/fluxos/components/FluxoPorDia.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    BarProps,
    Label as RLabel,
} from "recharts";
import { useFluxoPorDia } from "../hooks/useFluxoPorDia";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import "@/app/styles/relatorios_pdf/fluxo-por-dia.css";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1", "#a4de6c", "#d0ed57"];
const COLORSPERCENT = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];



// #endregion


const TriangleBar = (props: BarProps) => {
    const { fill, x, y, width, height } = props;
    const getPath = (x: number, y: number, w: number, h: number) =>
        `M${x},${y + h}C${x + w / 3},${y + h} ${x + w / 2},${y + h / 3}
        ${x + w / 2}, ${y}
        C${x + w / 2},${y + h / 3} ${x + (2 * w) / 3},${y + h} ${x + w}, ${y + h} Z`;
    return <path d={getPath(Number(x), Number(y), Number(width), Number(height))} stroke="none" fill={fill} />;
};



const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (n: number | null | undefined) => Intl.NumberFormat("pt-BR").format(Number(n ?? 0));

export default function FluxoPorDia() {
    const ALL = "ALL";
    const now = new Date();

    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [mes, setMes] = React.useState<number | undefined>();
    const [ano, setAno] = React.useState<number | undefined>(now.getFullYear());

    const { data: lojasResp } = useLojas({ limit: 1000 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];
    const lojaAtual = lojaId ? lojas.find(l => l.id === lojaId) : undefined;

    const { categorias, linhas, totalPorCategoria, totalGeral } =
        useFluxoPorDia({ lojaId, mes, ano }, { enabled: true });

    const pieData = Object.entries(totalPorCategoria).map(([name, value]) => ({ name, value }));

    const metaLoja = lojaAtual?.descricao ?? lojaAtual?.name ?? (lojaId ? `Loja ${lojaId}` : "Todas");
    const metaMes = mes ? meses[mes - 1] : "Todos";
    const metaAno = ano ?? "Todos";

    const exportXLSX = () => {
        const header = ["Dia da Semana", ...categorias, "Total"];
        const body = linhas.map(l => [l.dia, ...categorias.map(c => Number(l[c] ?? 0)), l.total]);
        const totalsRow = ["Total", ...categorias.map(c => totalPorCategoria[c] ?? 0), totalGeral];

        const ws = XLSX.utils.aoa_to_sheet([
            ["Fluxo de Pessoas por Dia da Semana"],
            [`Loja: ${metaLoja} Mês: ${metaMes} Ano: ${metaAno}`],
            [""],
            header,
            ...body,
            totalsRow
        ]);

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } },
        ];
        ws["!cols"] = header.map((_h, i) => ({ wch: i === 0 ? 18 : 12 }));

        const center = { alignment: { horizontal: "center", vertical: "center" } } as any;
        const boldCenter = { font: { bold: true }, ...center } as any;

        const addrTitle = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (ws[addrTitle]) (ws[addrTitle] as any).s = boldCenter;
        const addrMeta = XLSX.utils.encode_cell({ r: 1, c: 0 });
        if (ws[addrMeta]) (ws[addrMeta] as any).s = { alignment: { horizontal: "left" } } as any;

        // Cabeçalho tabela
        for (let c = 0; c < header.length; c++) {
            const a = XLSX.utils.encode_cell({ r: 3, c });
            if (ws[a]) (ws[a] as any).s = boldCenter;
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FluxoPorDia");
        XLSX.writeFile(wb, "fluxo_por_dia.xlsx");
    };

    const exportPDF = () => {
        const dt = new Date();
        const el = document.querySelector<HTMLSpanElement>("#print-root-fluxo-dia .print-datetime");
        if (el) {
            const f = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
            el.textContent = f.format(dt);
        }
        const prev = document.title;
        document.title = `Relatorio de Fluxo - Fluxo por Dia (${metaLoja}) ${metaMes}/${metaAno}`;
        const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
        window.addEventListener("afterprint", restore);
        window.print();
        setTimeout(restore, 1500);
    };

    const ROTATE_DEG = -60; // ex.: 30°, pode ser negativo também
    const startAngle = 100 + ROTATE_DEG;   // mantém o topo “para cima” com offset
    const endAngle = -270 + ROTATE_DEG; // sentido horário cobrindo 360°

    // label custom para as fatias (título com fonte menor)
    const SliceLabel: React.FC<any> = (props) => {
        const { cx, cy, midAngle, outerRadius, name, value, index } = props
        const RAD = Math.PI / 180;
        const r = outerRadius + 10; // distância do texto para fora do arco
        const x = cx + r * Math.cos(-midAngle * RAD);
        const y = cy + r * Math.sin(-midAngle * RAD);
        const anchor = x > cx ? "start" : "end";
        const percentual = value && totalGeral ? Math.round((Number(value) / totalGeral) * 100) : 0;
        const color = COLORSPERCENT[index % COLORSPERCENT.length]
        return (
            <text
                x={x}
                y={y}
                fontSize={12}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill={color}
                style={{ fontWeight: 600 }}
            >
                {name}: ( {percentual}% )
            </text>
        );
    };

    return (
        <Card className="bg-transparent">
            <CardHeader className="pb-2 print:hidden">
                <CardTitle className="text-center">Fluxo de Pessoas por Dia da Semana</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filtros + Botoes */}
                <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
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
                        <Button variant="link" size="sm" onClick={exportXLSX} className="cursor-pointer">
                            <FileSpreadsheet /> XLSX
                        </Button>
                        <Button variant="link" size="sm" onClick={() => { void exportPDF(); }} className="cursor-pointer">
                            <Download /> PDF
                        </Button>
                    </div>
                </div>

                {/* ================== ÁREA IMPRIMÍVEL ================== */}
                <div id="print-root-fluxo-dia" className="print-root-fluxo-dia space-y-3">
                    {/* Cabeçalho exclusivo do PDF */}
                    <h1 className="w-full text-center only-print text-xl bg-muted/30 font-semibold mb-0">
                        Relatórios de Fluxo — Fluxo por Dia da Semana
                    </h1>
                    <div className="only-print text-sm mt-0">
                        <div className="text-foreground font-semibold">LOJA: <span className="text-foreground font-normal">{metaLoja}</span></div>
                        <div className="text-foreground font-semibold">MÊS/ANO: <span className="text-foreground font-normal">{metaMes}/{metaAno}</span></div>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto rounded-md print-table border">
                        <Table className="print-table">
                            <TableHeader>
                                <TableRow className="bg-muted/20 shadow-card text-muted-foreground">
                                    <TableHead>Dia da semana</TableHead>
                                    {categorias.map((c) => <TableHead key={c} className="text-right">{c}</TableHead>)}
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {linhas.map((l) => (
                                    <TableRow key={l.dia}>
                                        <TableCell>{l.dia}</TableCell>
                                        {categorias.map((c) => (
                                            <TableCell key={c} className="text-right">{fmt(l[c] as number)}</TableCell>
                                        ))}
                                        <TableCell className="text-right font-medium">{fmt(l.total)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/20 font-semibold">
                                    <TableCell>Total</TableCell>
                                    {categorias.map((c) => (
                                        <TableCell key={c} className="text-right">{fmt(totalPorCategoria[c] ?? 0)}</TableCell>
                                    ))}
                                    <TableCell className="text-right">{fmt(totalGeral)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Charts grid */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-3 print-flex-col">
                        {/* Pizza */}
                        <div className="rounded-md border h-72 lg:h-full w-full avoid-break px-3 pt-2 pb-0 overflow-hidden print:overflow-visible print:chart pie-card">
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">Distribuição por categoria (%)</h3>
                            <div className="pie-wrap">
                                <div className="pie-box">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 16, right: 8, left: 8, bottom: 24 }}>
                                            <Pie
                                                data={pieData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius="65%"
                                                outerRadius="75%"
                                                cornerRadius="50%"
                                                paddingAngle={5}
                                                startAngle={startAngle}
                                                endAngle={endAngle}
                                                label={(p) => <SliceLabel {...p} />}
                                                labelLine={false}
                                                cx="50%"
                                                cy="50%"

                                            >
                                                {pieData.map((_, i) => <Cell key={i} fill={COLORSPERCENT[i % COLORSPERCENT.length]} />)}

                                                <RLabel
                                                    value={`Total: ${Intl.NumberFormat("pt-BR").format(totalGeral)}`}
                                                    position="center"
                                                    fontSize={20}
                                                    fill="#0088FE90"
                                                    fontWeight={700}
                                                />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--card-foreground)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '0.75rem',
                                                    fontSize: 10,
                                                }}
                                            />
                                            {/* <Legend wrapperStyle={{ fontSize: 10, bottom: 0 }} /> */}
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Barras */}
                        <div className="col-span-1 lg:col-span-2 avoid-break rounded-md border px-3 pt-1 pb-3 overflow-hidden print:overflow-visible print:chart">
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">Por dia x categorias</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={linhas}
                                        margin={{ top: 12, right: 24, left: 8, bottom: 18 }}
                                        barCategoryGap={8}
                                        maxBarSize={22}
                                    >
                                        <CartesianGrid strokeDasharray="0.3 3" className="opacity-50" />
                                        <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#374151" }} axisLine={{ stroke: "#9CA3AF" }} tickLine={{ stroke: "#9CA3AF" }} />
                                        <YAxis tick={{ fontSize: 10, fill: "#374151" }} axisLine={{ stroke: "#9CA3AF" }} tickLine={{ stroke: "#9CA3AF" }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '0.75rem',
                                                fontSize: 12
                                            }}
                                            cursor={{ opacity: 0.12 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        {categorias.map((c, i) => (
                                            <Bar
                                                key={c}
                                                dataKey={c}
                                                name={c}
                                                fill={COLORS[i % COLORS.length]}
                                                shape={TriangleBar}
                                                label={{ position: 'top', fontSize: 10 }}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Rodapé ONLY PRINT */}
                    <footer className="print-footer footer-only-print">
                        <div className="footer-left">Relatórios de Fluxo — Fluxo por Dia</div>
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
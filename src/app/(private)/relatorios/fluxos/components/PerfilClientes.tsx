// FILE: src/app/(private)/relatorios/fluxos/components/PerfilClientes.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarProps, Cell } from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { useVendasPerfil } from "../hooks/useVendasPerfil";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";
import "@/app/styles/relatorios_pdf/fluxo-perfil-clientes.css";

// export libs
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLORS = {
    masculino: "#60a5fa",
    feminino: "#f472b6",
    crianca: "#22c55e",
    jovem: "#f59e0b",
    adulto: "#8b5cf6",
    idoso: "#ef4444",
};

type EditFilters = { lojaId?: number; mes?: number; ano?: number };

/* ======================= Helpers de exportação de gráficos ======================= */

type CursorClientGenderProps = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
};

// #endregion
const getPath = (x: number, y: number, width: number, height: number) => {
    return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
                ${x + width / 2}, ${y}
                C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width}, ${y + height}
                Z`;
};

const TriangleBar = (props: BarProps) => {
    const { fill, x, y, width, height } = props;

    return <path d={getPath(Number(x), Number(y), Number(width), Number(height))} stroke="none" fill={fill} />;
};

export const CursorClientGender: React.FC<CursorClientGenderProps> = ({ x = 0, y = 0, width = 0, height = 0 }) => {
    // largura do highlight
    const cursorWidth = 55;

    // centraliza o retângulo em relação à banda (width fornecido pelo Recharts)
    const offsetX = (cursorWidth - width) / 2;

    return (
        <rect
            x={x - offsetX}
            y={y}
            width={cursorWidth}
            height={height}
            fill="var( --primary-light)"
            opacity={0.12}
            rx={4}

        />
    );
};

type CursorClientAgeProps = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
};

export const CursorClientAge: React.FC<CursorClientAgeProps> = ({ x = 0, y = 0, width = 0, height = 0 }) => {
    // largura do highlight
    const cursorWidth = 85;

    // centraliza o retângulo em relação à banda (width fornecido pelo Recharts)
    const offsetX = (cursorWidth - width) / 2;

    return (
        <rect
            x={x - offsetX}
            y={y}
            width={cursorWidth}
            height={height}
            fill="var(--warning-light)"
            opacity={0.12}
            rx={4}

        />
    );
};

/** Copia estilos essenciais para cada nó do SVG clonado. */
// function inlineBasicStyles(root: SVGElement) {
//     const PROPS = [
//         "font", "fontFamily", "fontSize", "fontWeight", "fill", "stroke",
//         "strokeWidth", "opacity", "textAnchor", "dominantBaseline"
//     ];
//     const all = root.querySelectorAll<SVGElement>("*");
//     all.forEach((el) => {
//         const cs = window.getComputedStyle(el as Element);
//         for (const p of PROPS) {
//             const v = (cs as any)[p];
//             if (v) (el as any).style[p] = v;
//         }
//     });
// }

/** Aguarda o Recharts terminar layout (svg com largura/altura > 0). */
// async function waitForChartReady(container: HTMLElement | null, timeoutMs = 1500) {
//     const start = performance.now();
//     while (container) {
//         const svg = container.querySelector("svg.recharts-surface") as SVGSVGElement | null;
//         const box = svg?.getBoundingClientRect();
//         if (svg && box && box.width > 2 && box.height > 2) return svg;
//         if (performance.now() - start > timeoutMs) return svg ?? null;
//         await new Promise(r => requestAnimationFrame(() => r(null)));
//     }
//     return null;
// }

// async function svgNodeToPngDataUrl(svg: SVGSVGElement, targetWidth: number): Promise<string> {
//     const rect = svg.getBoundingClientRect();
//     const vb = svg.viewBox?.baseVal;
//     const w = vb?.width || rect.width || Number(svg.getAttribute("width")) || 800;
//     const h = vb?.height || rect.height || Number(svg.getAttribute("height")) || 400;

//     const clone = svg.cloneNode(true) as SVGSVGElement;
//     clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
//     if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
//     inlineBasicStyles(clone);

//     const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
//     bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
//     bg.setAttribute("width", String(w)); bg.setAttribute("height", String(h));
//     bg.setAttribute("fill", "#ffffff");
//     clone.insertBefore(bg, clone.firstChild);

//     const serializer = new XMLSerializer();
//     const svgStr = serializer.serializeToString(clone);

//     const ratio = w / h || 2;
//     const width = Math.max(1, Math.round(targetWidth));
//     const height = Math.max(1, Math.round(width / ratio));
//     const dpr = Math.min(2, window.devicePixelRatio || 1);

//     const canvas = document.createElement("canvas");
//     canvas.width = Math.round(width * dpr);
//     canvas.height = Math.round(height * dpr);
//     const ctx = canvas.getContext("2d")!;
//     ctx.scale(dpr, dpr);
//     ctx.fillStyle = "#fff";
//     ctx.fillRect(0, 0, width, height);

//     // IMPORT DINÂMICO (funciona em qualquer build do canvg 3.x)
//     const mod = await import("canvg");
//     const CanvgCtor = (mod as any).Canvg ?? (mod as any).default?.Canvg ?? (mod as any).default;
//     const v = await CanvgCtor.fromString(ctx, svgStr, { ignoreMouse: true, ignoreAnimation: true });

//     v.resize(width, height, "xMidYMid meet");
//     await v.render();

//     return canvas.toDataURL("image/png");
// }


/* =============================================================================== */

export default function PerfilClientes() {
    const now = new Date();
    const DEFAULT: EditFilters = { lojaId: undefined, mes: now.getMonth() + 1, ano: now.getFullYear() };

    const [edit, setEdit] = React.useState<EditFilters>(DEFAULT);
    const [applied, setApplied] = React.useState<EditFilters>(DEFAULT);
    const [isExporting, setIsExporting] = React.useState(false);

    const [bootApplied, setBootApplied] = React.useState(false);
    React.useEffect(() => {
        if (!bootApplied) { setApplied(DEFAULT); setBootApplied(true); }
    }, [bootApplied]);

    const { data: lojasResp } = useLojas({ limit: 2000 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];
    const lojaAtual = applied.lojaId ? lojas.find(l => l.id === applied.lojaId) : undefined;

    const { data, isFetching, refetch } = useVendasPerfil(
        { lojaId: applied.lojaId, mes: applied.mes, ano: applied.ano, limit: 5000 },
        { enabled: bootApplied }
    );

    const rows = data?.rows ?? [];
    const totals = data?.totals ?? { masculino: 0, feminino: 0, crianca: 0, jovem: 0, adulto: 0, idoso: 0, total: 0 };
    const pct = data?.percent ?? { masculino: 0, feminino: 0, crianca: 0, jovem: 0, adulto: 0, idoso: 0 };

    const onBuscar = () => { setApplied(edit); refetch(); };
    const onLimpar = () => { setEdit(DEFAULT); setApplied(DEFAULT); refetch(); };

    // refs dos gráficos para exportação
    const generoRef = React.useRef<HTMLDivElement>(null);
    const idadeRef = React.useRef<HTMLDivElement>(null);

    // para XLSX e PDF (metadados)
    const metaLoja = lojaAtual?.descricao ?? lojaAtual?.name ?? (applied.lojaId ? `Loja ${applied.lojaId}` : "Todas");
    const metaMes = applied.mes ? meses[applied.mes - 1] : "Todos";
    const metaAno = applied.ano ?? "Todos";

    /** XLSX com título/Metadados + agrupamentos centralizados */
    const exportXLSX = () => {
        const body = rows.map(r => [r.dia, r.masculino, r.feminino, r.crianca, r.jovem, r.adulto, r.idoso, r.total]);
        const totalsRow = ["Total", totals.masculino, totals.feminino, totals.crianca, totals.jovem, totals.adulto, totals.idoso, totals.total];
        const percentRow = ["Participação %", `${pct.masculino}%`, `${pct.feminino}%`, `${pct.crianca}%`, `${pct.jovem}%`, `${pct.adulto}%`, `${pct.idoso}%`, "100%"];

        const ws = XLSX.utils.aoa_to_sheet([
            ["Perfil de Clientes (Compradores)"],
            [`Loja: ${metaLoja}    Mês: ${metaMes}    Ano: ${metaAno}`],
            [""],
            ["", "Gênero", "", "", "Idade", "", "", ""],
            ["Dia da Semana", "Masculino", "Feminino", "Criança", "Jovem", "Adulto", "Idoso", "Total"],
            ...body, totalsRow, percentRow,
        ]);

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
            { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
            { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } },
        ];
        ws["!cols"] = [{ wch: 16 }, { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        (ws as any)["!freeze"] = { xSplit: 1, ySplit: 5 };

        const center = { alignment: { horizontal: "center", vertical: "center" } } as any;
        const boldCenter = { font: { bold: true }, ...center } as any;

        const addrTitle = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (ws[addrTitle]) (ws[addrTitle] as any).s = boldCenter;

        const addrMeta = XLSX.utils.encode_cell({ r: 1, c: 0 });
        if (ws[addrMeta]) (ws[addrMeta] as any).s = { alignment: { horizontal: "left" } } as any;

        for (let c = 0; c <= 7; c++) {
            const a = XLSX.utils.encode_cell({ r: 3, c });
            if (ws[a]) (ws[a] as any).s = boldCenter;
        }
        for (let c = 0; c <= 7; c++) {
            const a = XLSX.utils.encode_cell({ r: 4, c });
            if (ws[a]) (ws[a] as any).s = boldCenter;
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PerfilClientes");
        XLSX.writeFile(wb, "perfil_clientes.xlsx");
    };

    // PDF via print() com título dinâmico (vira o nome do arquivo)
    const exportPDF = () => {


        // Preenche a data/hora (fuso America/Recife)
        const dt = new Date();
        const el = document.querySelector<HTMLSpanElement>("#print-root .print-datetime");
        if (el) {
            const f = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
            el.textContent = f.format(dt);
        }

        const prev = document.title;
        document.title = `Relatórios de Fluxo — Perfil de Clientes (${metaLoja} • ${metaMes}/${metaAno})`;
        const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
        window.addEventListener("afterprint", restore);
        window.print();

        // fallback caso afterprint não dispare
        setTimeout(restore, 1500);
    };

    return (
        <Card className="bg-transparent">
            <CardHeader className="pb-2 print:hidden">
                <CardTitle className="text-center">Perfil de Clientes (Compradores)</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <Label className="ml-1.5">Loja</Label>
                            <Select
                                value={edit.lojaId !== undefined ? String(edit.lojaId) : "all"}
                                onValueChange={(v) => setEdit(s => ({ ...s, lojaId: v === "all" ? undefined : Number(v) }))}>
                                <SelectTrigger className="w-[220px] cursor-pointer">
                                    <SelectValue placeholder="Todas as lojas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {lojas.map(l => (
                                        <SelectItem key={l.id} value={String(l.id)}>
                                            {l.descricao ?? l.name ?? `Loja ${l.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="ml-1.5">Mês</Label>
                            <Select
                                value={edit.mes !== undefined ? String(edit.mes) : "all"}
                                onValueChange={(v) => setEdit(s => ({ ...s, mes: v === "all" ? undefined : Number(v) }))}>
                                <SelectTrigger className="w-[140px] cursor-pointer">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {meses.map((m, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="ml-1.5">Ano</Label>
                            <Select
                                value={edit.ano !== undefined ? String(edit.ano) : "all"}
                                onValueChange={(v) => setEdit(s => ({ ...s, ano: v === "all" ? undefined : Number(v) }))}>
                                <SelectTrigger className="w-[140px] cursor-pointer">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {Array.from({ length: 6 }, (_, k) => now.getFullYear() - k).map(a => (
                                        <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button size="sm" onClick={onBuscar} disabled={isFetching} className="cursor-pointer">
                            {isFetching ? "Buscando..." : "Buscar"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={onLimpar} className="cursor-pointer">
                            Limpar filtro
                        </Button>
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
                <div id="print-root" className="print-root space-y-3">
                    {/* Título exclusivo do PDF */}
                    <h1 className="w-full text-center only-print text-xl bg-muted/30 font-semibold mb-0">
                        Relatórios de Fluxo — Perfil de Clientes (Compradores)
                    </h1>
                    <div className="only-print text-sm mt-0">
                        <div className="text-foreground font-semibold">LOJA: <span className="text-foreground font-normal">{metaLoja}</span></div>
                        <div className="text-foreground font-semibold">MÊS/ANO: <span className="text-foreground font-normal">{metaMes}/{metaAno}</span></div>
                    </div>
                    {/* Tabela com cabeçalho agrupado */}
                    <div className="overflow-x-auto rounded-md print-table border">
                        <Table className="print-table">
                            <TableHeader className="">
                                <TableRow className="bg-muted/20 shadow-card text-muted-foreground">
                                    <TableHead className="py-1.5 text-center align-middle border-r" rowSpan={2}>Dia da Semana</TableHead>
                                    <TableHead className="py-1.5 text-center border-r" colSpan={2}>Gênero</TableHead>
                                    <TableHead className="py-1.5 text-center" colSpan={4}>Idade</TableHead>
                                    <TableHead className="py-1.5 text-center align-middle border-l" rowSpan={2}>Total</TableHead>
                                </TableRow>
                                <TableRow className="bg-muted/20 shadow-card text-muted-foreground">
                                    <TableHead className="py-1 text-center border-r">Masculino</TableHead>
                                    <TableHead className="py-1 text-center border-r">Feminino</TableHead>
                                    <TableHead className="py-1 text-center">Criança</TableHead>
                                    <TableHead className="py-1 text-center border-r">Jovem</TableHead>
                                    <TableHead className="py-1 text-center">Adulto</TableHead>
                                    <TableHead className="py-1 text-center">Idoso</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {rows.map(r => (
                                    <TableRow key={r.dia}>
                                        <TableCell className="py-1 text-left border-r">{r.dia}</TableCell>
                                        <TableCell className="py-1 text-center">{r.masculino}</TableCell>
                                        <TableCell className="py-1 text-center border-r">{r.feminino}</TableCell>
                                        <TableCell className="py-1 text-center">{r.crianca}</TableCell>
                                        <TableCell className="py-1 text-center">{r.jovem}</TableCell>
                                        <TableCell className="py-1 text-center">{r.adulto}</TableCell>
                                        <TableCell className="py-1 text-center border-r">{r.idoso}</TableCell>
                                        <TableCell className="py-1 text-center font-medium">{r.total}</TableCell>
                                    </TableRow>
                                ))}

                                <TableRow className="bg-muted/20 font-semibold">
                                    <TableCell className="py-1 border-r">Total</TableCell>
                                    <TableCell className="py-1 text-center">{totals.masculino}</TableCell>
                                    <TableCell className="py-1 text-center border-r">{totals.feminino}</TableCell>
                                    <TableCell className="py-1 text-center">{totals.crianca}</TableCell>
                                    <TableCell className="py-1 text-center">{totals.jovem}</TableCell>
                                    <TableCell className="py-1 text-center">{totals.adulto}</TableCell>
                                    <TableCell className="py-1 text-center border-r">{totals.idoso}</TableCell>
                                    <TableCell className="py-1 text-center">{totals.total}</TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell className="py-1 text-muted-foreground border-r">Participação %</TableCell>
                                    <TableCell className="py-1 text-center">{pct.masculino}%</TableCell>
                                    <TableCell className="py-1 text-center border-r">{pct.feminino}%</TableCell>
                                    <TableCell className="py-1 text-center">{pct.crianca}%</TableCell>
                                    <TableCell className="py-1 text-center">{pct.jovem}%</TableCell>
                                    <TableCell className="py-1 text-center">{pct.adulto}%</TableCell>
                                    <TableCell className="py-1 text-center border-r">{pct.idoso}%</TableCell>
                                    <TableCell className="py-1 text-center">100%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Gráficos */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3 print-flex-col">
                        <div ref={generoRef} className="avoid-break h-64 w-full avoid-break rounded-md border px-3 pt-1 pb-3 overflow-hidden print:overflow-visible print:chart">
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">Perfil de Clientes (compradores) por Gênero</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data?.chartGenero ?? []}
                                    margin={{ top: 16, right: 24, left: 8, bottom: 18 }}
                                    barCategoryGap={8}
                                    maxBarSize={18}
                                >
                                    <CartesianGrid className="opacity-50" strokeDasharray="0.3 3" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: "#374151", fontSize: 10 }}     // texto dos ticks
                                        axisLine={{ stroke: "#9CA3AF" }}            // linha do eixo
                                        tickLine={{ stroke: "#9CA3AF" }}            // risquinhos 
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: "#374151", fontSize: 10 }}
                                        axisLine={{ stroke: "#9CA3AF" }}
                                        tickLine={{ stroke: "#9CA3AF" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0.75rem',
                                            fontSize: 12
                                        }}
                                        cursor={< CursorClientGender />}
                                    />
                                    <Legend
                                        wrapperStyle={{ color: "#374151", fontSize: 10 }}
                                        verticalAlign="bottom"
                                        height={20}

                                    />
                                    <Bar dataKey="Feminino" fill={COLORS.feminino} barSize={14} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: '10' }} >
                                        {(data?.chartGenero ?? []).map((_e, i) => <Cell key={i} fill={COLORS.feminino} />)}
                                    </Bar>
                                    <Bar dataKey="Masculino" fill={COLORS.masculino} barSize={14} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: '10' }} >
                                        {(data?.chartGenero ?? []).map((_e, i) => <Cell key={i} fill={COLORS.masculino} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div ref={idadeRef} className="avoid-break h-64 w-full rounded-md border px-3 pt-3 pb-3 overflow-hidden print:overflow-visible print:chart">
                            <h3 className="mb-1 text-sm font-medium text-muted-foreground">Perfil de Clientes (compradores) por Idade</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data?.chartIdade ?? []}
                                    margin={{ top: 10, right: 24, left: 8, bottom: 18 }}
                                    barCategoryGap={8}
                                    maxBarSize={18}
                                >
                                    <CartesianGrid scale="point" className="opacity-50" strokeDasharray="0.3 3" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: "#374151", fontSize: 10 }}
                                        axisLine={{ stroke: "#9CA3AF" }}
                                        tickLine={{ stroke: "#9CA3AF" }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: "#374151", fontSize: 10 }}
                                        axisLine={{ stroke: "#9CA3AF" }}
                                        tickLine={{ stroke: "#9CA3AF" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0.75rem',
                                            fontSize: 12
                                        }}
                                        cursor={<CursorClientAge />}
                                    />
                                    <Legend
                                        wrapperStyle={{ color: "#374151", fontSize: 10 }}
                                        verticalAlign="bottom"
                                        height={20}
                                    />
                                    <Bar dataKey="Adulto" fill={COLORS.adulto} barSize={14} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: '10' }} >
                                        {(data?.chartIdade ?? []).map((_e, i) => <Cell key={i} fill={COLORS.adulto} />)}
                                    </Bar>
                                    <Bar dataKey="Criança" fill={COLORS.crianca} barSize={14} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: '10' }} >
                                        {(data?.chartIdade ?? []).map((_e, i) => <Cell key={i} fill={COLORS.crianca} />)}
                                    </Bar>
                                    <Bar dataKey="Idoso" fill={COLORS.idoso} barSize={14} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: '10' }} >
                                        {(data?.chartIdade ?? []).map((_e, i) => <Cell key={i} fill={COLORS.idoso} />)}
                                    </Bar>
                                    <Bar dataKey="Jovem" fill={COLORS.jovem} barSize={14} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: '10' }} >
                                        {(data?.chartIdade ?? []).map((_e, i) => <Cell key={i} fill={COLORS.jovem} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* ===== Rodapé somente na impressão ===== */}
                        <footer className="print-footer footer-only-print">
                            <div className="footer-left">Relatórios de Fluxo — Perfil de Clientes</div>
                            <div className="footer-center">Loja: {metaLoja} • {metaMes}/{metaAno}</div>
                            <div className="footer-right">Gerado em: <span className="print-datetime"></span></div>
                            <div className="footer-right">Página <span className="pageNumber"></span>/<span className="totalPages"></span></div>
                        </footer>
                    </div>
                    {/* ================== /ÁREA IMPRIMÍVEL ================== */}
                </div>
            </CardContent>
        </Card>
    );
}
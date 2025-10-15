// FILE: src/app/(private)/relatorios/fluxos/components/PerfilClientes.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download } from "lucide-react";
import { useVendasPerfil } from "../hooks/useVendasPerfil";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";

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

/** Copia estilos essenciais para cada nó do SVG clonado. */
function inlineBasicStyles(root: SVGElement) {
    const PROPS = [
        "font", "fontFamily", "fontSize", "fontWeight", "fill", "stroke",
        "strokeWidth", "opacity", "textAnchor", "dominantBaseline"
    ];
    const all = root.querySelectorAll<SVGElement>("*");
    all.forEach((el) => {
        const cs = window.getComputedStyle(el as Element);
        for (const p of PROPS) {
            const v = (cs as any)[p];
            if (v) (el as any).style[p] = v;
        }
    });
}

/** Aguarda o Recharts terminar layout (svg com largura/altura > 0). */
async function waitForChartReady(container: HTMLElement | null, timeoutMs = 1500) {
    const start = performance.now();
    while (container) {
        const svg = container.querySelector("svg.recharts-surface") as SVGSVGElement | null;
        const box = svg?.getBoundingClientRect();
        if (svg && box && box.width > 2 && box.height > 2) return svg;
        if (performance.now() - start > timeoutMs) return svg ?? null;
        await new Promise(r => requestAnimationFrame(() => r(null)));
    }
    return null;
}

async function svgNodeToPngDataUrl(svg: SVGSVGElement, targetWidth: number): Promise<string> {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox?.baseVal;
    const w = vb?.width || rect.width || Number(svg.getAttribute("width")) || 800;
    const h = vb?.height || rect.height || Number(svg.getAttribute("height")) || 400;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
    inlineBasicStyles(clone);

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
    bg.setAttribute("width", String(w)); bg.setAttribute("height", String(h));
    bg.setAttribute("fill", "#ffffff");
    clone.insertBefore(bg, clone.firstChild);

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);

    const ratio = w / h || 2;
    const width = Math.max(1, Math.round(targetWidth));
    const height = Math.max(1, Math.round(width / ratio));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // IMPORT DINÂMICO (funciona em qualquer build do canvg 3.x)
    const mod = await import("canvg");
    const CanvgCtor = (mod as any).Canvg ?? (mod as any).default?.Canvg ?? (mod as any).default;
    const v = await CanvgCtor.fromString(ctx, svgStr, { ignoreMouse: true, ignoreAnimation: true });

    v.resize(width, height, "xMidYMid meet");
    await v.render();

    return canvas.toDataURL("image/png");
}


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

    /** XLSX com título/Metadados + agrupamentos centralizados */
    const exportXLSX = () => {
        const metaLoja = lojaAtual?.descricao ?? lojaAtual?.name ?? (applied.lojaId ? `Loja ${applied.lojaId}` : "Todas");
        const metaMes = applied.mes ? meses[applied.mes - 1] : "Todos";
        const metaAno = applied.ano ?? "Todos";

        const body = rows.map(r => [r.dia, r.masculino, r.feminino, r.crianca, r.jovem, r.adulto, r.idoso, r.total]);
        const totalsRow = ["Total", totals.masculino, totals.feminino, totals.crianca, totals.jovem, totals.adulto, totals.idoso, totals.total];
        const percentRow = ["Participação %", `${pct.masculino}%`, `${pct.feminino}%`, `${pct.crianca}%`, `${pct.jovem}%`, `${pct.adulto}%`, `${pct.idoso}%`, "100%"];

        const ws = XLSX.utils.aoa_to_sheet([
            ["Perfil de Clientes (Compradores)"],
            [`Loja: ${metaLoja}    Mês: ${metaMes}    Ano: ${metaAno}`],
            [""],
            ["", "Gênero", "", "", "Idade", "", "", ""],
            ["Dia da Semana", "Masculino", "Feminino", "Criança", "Jovem", "Adulto", "Idoso", "Total"],
            ...body,
            totalsRow,
            percentRow,
        ]);

        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
            { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
            { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } },
        ];

        ws["!cols"] = [
            { wch: 16 }, { wch: 11 }, { wch: 11 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
            { wch: 10 },
        ];
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

    /** PDF com tabela + gráficos (snapshot do container com html2canvas) */
    const exportPDF = async () => {
        try {
            setIsExporting(true);

            await new Promise(r => setTimeout(r, 200));

            const metaLoja = lojaAtual?.descricao ?? lojaAtual?.name ?? (applied.lojaId ? `Loja ${applied.lojaId}` : "Todas");
            const metaMes = applied.mes ? meses[applied.mes - 1] : "Todos";
            const metaAno = applied.ano ?? "Todos";

            const doc = new jsPDF({ orientation: "landscape" });
            doc.setFontSize(14);
            doc.text("Perfil de Clientes (Compradores)", 14, 14);
            doc.setFontSize(10);
            doc.text(`Loja: ${metaLoja}    Mês: ${metaMes}    Ano: ${metaAno}`, 14, 22);

            // Tabela
            autoTable(doc, {
                startY: 28,
                head: [
                    [
                        { content: "Dia da Semana", rowSpan: 2 },
                        { content: "Gênero", colSpan: 2, styles: { halign: "center" } },
                        { content: "Idade", colSpan: 4, styles: { halign: "center" } },
                        { content: "Total", rowSpan: 2 },
                    ],
                    ["Masculino", "Feminino", "Criança", "Jovem", "Adulto", "Idoso"],
                ],
                body: [
                    ...rows.map(r => [r.dia, r.masculino, r.feminino, r.crianca, r.jovem, r.adulto, r.idoso, r.total]),
                    ["Total", totals.masculino, totals.feminino, totals.crianca, totals.jovem, totals.adulto, totals.idoso, totals.total],
                    ["Participação %", `${pct.masculino}%`, `${pct.feminino}%`, `${pct.crianca}%`, `${pct.jovem}%`, `${pct.adulto}%`, `${pct.idoso}%`, "100%"],
                ],
                theme: "grid",
                styles: { fontSize: 9 },
                headStyles: { fillColor: [40, 40, 40] },
                columnStyles: { 0: { cellWidth: 36 }, 7: { cellWidth: 18, halign: "right" } },
            });

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 14;
            const gap = 10;
            const colW = Math.floor((pageW - margin * 2 - gap) / 2);

            const tableBottomY = (doc as any).lastAutoTable?.finalY ?? 36;
            let y = tableBottomY + 12;

            // Aguarda os SVGs estarem prontos
            console.log("Aguardando gráficos renderizarem...");
            const [svgGenero, svgIdade] = await Promise.all([
                waitForChartReady(generoRef.current),
                waitForChartReady(idadeRef.current),
            ]);



            if (!svgGenero || !svgIdade) {
                console.warn("Gráficos não encontrados ou não renderizados completamente");
                doc.setFontSize(10);
                doc.text("Nota: Gráficos não puderam ser exportados", margin, y);
                doc.save("perfil_clientes.pdf");
                return;
            }

            console.log("Convertendo SVGs para PNG...");
            const [pngGenero, pngIdade] = await Promise.all([
                svgNodeToPngDataUrl(svgGenero, colW * 2),
                svgNodeToPngDataUrl(svgIdade, colW * 2),
            ]);

            // Calcula proporções
            const genProps = (doc as any).getImageProperties(pngGenero);
            const idaProps = (doc as any).getImageProperties(pngIdade);

            const h1 = Math.round((colW * genProps.height) / genProps.width);
            const h2 = Math.round((colW * idaProps.height) / idaProps.width);
            const maxH = Math.max(h1, h2);

            // Verifica se precisa de nova página
            if (y + maxH > pageH - margin) {
                doc.addPage();
                y = margin;
            }

            // Adiciona títulos dos gráficos
            doc.setFontSize(9);
            doc.text("Perfil por Gênero", margin, y);
            doc.text("Perfil por Idade", margin + colW + gap, y);

            y += 5;

            // Adiciona imagens lado a lado
            doc.addImage(pngGenero, "PNG", margin, y, colW, h1);
            doc.addImage(pngIdade, "PNG", margin + colW + gap, y, colW, h2);

            console.log("PDF gerado com sucesso!");
            doc.save("perfil_clientes.pdf");

        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            alert("Erro ao exportar PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <Card className="bg-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="text-center">1. Perfil de Clientes (Compradores)</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-end justify-between gap-3">
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
                            <Download /> XLSX
                        </Button>
                        <Button variant="link" size="sm" onClick={() => { void exportPDF(); }} className="cursor-pointer">
                            <Download /> PDF
                        </Button>
                    </div>
                </div>

                {/* Tabela com cabeçalho agrupado */}
                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-card shadow-card text-muted-foreground">
                                <TableHead className="text-center align-middle border-r" rowSpan={2}>Dia da Semana</TableHead>
                                <TableHead className="text-center border-r" colSpan={2}>Gênero</TableHead>
                                <TableHead className="text-center" colSpan={4}>Idade</TableHead>
                                <TableHead className="text-center align-middle border-l" rowSpan={2}>Total</TableHead>
                            </TableRow>
                            <TableRow className="bg-gradient-card shadow-card text-muted-foreground">
                                <TableHead className="py-1.5 text-center">Masculino</TableHead>
                                <TableHead className="py-1.5 text-center border-r">Feminino</TableHead>
                                <TableHead className="py-1.5 text-center">Criança</TableHead>
                                <TableHead className="py-1.5 text-center">Jovem</TableHead>
                                <TableHead className="py-1.5 text-center">Adulto</TableHead>
                                <TableHead className="py-1.5 text-center">Idoso</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {rows.map(r => (
                                <TableRow key={r.dia}>
                                    <TableCell className="py-1.5 text-left border-r">{r.dia}</TableCell>
                                    <TableCell className="py-1.5 text-center">{r.masculino}</TableCell>
                                    <TableCell className="py-1.5 text-center border-r">{r.feminino}</TableCell>
                                    <TableCell className="py-1.5 text-center">{r.crianca}</TableCell>
                                    <TableCell className="py-1.5 text-center">{r.jovem}</TableCell>
                                    <TableCell className="py-1.5 text-center">{r.adulto}</TableCell>
                                    <TableCell className="py-1.5 text-center border-r">{r.idoso}</TableCell>
                                    <TableCell className="py-1.5 text-center font-medium">{r.total}</TableCell>
                                </TableRow>
                            ))}

                            <TableRow className="bg-muted/60 font-semibold">
                                <TableCell className="py-1.5 border-r">Total</TableCell>
                                <TableCell className="py-1.5 text-center">{totals.masculino}</TableCell>
                                <TableCell className="py-1.5 text-center border-r">{totals.feminino}</TableCell>
                                <TableCell className="py-1.5 text-center">{totals.crianca}</TableCell>
                                <TableCell className="py-1.5 text-center">{totals.jovem}</TableCell>
                                <TableCell className="py-1.5 text-center">{totals.adulto}</TableCell>
                                <TableCell className="py-1.5 text-center border-r">{totals.idoso}</TableCell>
                                <TableCell className="py-1.5 text-center">{totals.total}</TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell className="py-1.5 text-muted-foreground border-r">Participação %</TableCell>
                                <TableCell className="py-1.5 text-center">{pct.masculino}%</TableCell>
                                <TableCell className="py-1.5 text-center border-r">{pct.feminino}%</TableCell>
                                <TableCell className="py-1.5 text-center">{pct.crianca}%</TableCell>
                                <TableCell className="py-1.5 text-center">{pct.jovem}%</TableCell>
                                <TableCell className="py-1.5 text-center">{pct.adulto}%</TableCell>
                                <TableCell className="py-1.5 text-center border-r">{pct.idoso}%</TableCell>
                                <TableCell className="py-1.5 text-center">100%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div ref={generoRef} className="h-64 w-full rounded-md border px-3 pt-3 pb-6">
                        <div className="mb-1 text-sm font-medium text-muted-foreground">Perfil de Clientes (compradores) por Gênero</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.chartGenero ?? []}>
                                <CartesianGrid stroke="#E5E7EB" strokeDasharray="0.3 3" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: "#374151", fontSize: 12 }}     // texto dos ticks
                                    axisLine={{ stroke: "#9CA3AF" }}            // linha do eixo
                                    tickLine={{ stroke: "#9CA3AF" }}            // risquinhos 
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: "#374151", fontSize: 10 }}
                                    axisLine={{ stroke: "#9CA3AF" }}
                                    tickLine={{ stroke: "#9CA3AF" }}
                                />
                                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12 }} />
                                <Legend wrapperStyle={{ color: "#374151", fontSize: 10 }} />
                                <Bar dataKey="Feminino" fill={COLORS.feminino} barSize={20} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Masculino" fill={COLORS.masculino} barSize={20} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div ref={idadeRef} className="h-64 w-full rounded-md border px-3 pt-3 pb-6">
                        <div className="mb-1 text-sm font-medium text-muted-foreground">Perfil de Clientes (compradores) por Idade</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.chartIdade ?? []}>
                                <CartesianGrid stroke="#E5E7EB" strokeDasharray="0.3 3" />
                                <XAxis dataKey="name" fontSize={13} />
                                <YAxis allowDecimals={false} fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12 }} />
                                <Legend wrapperStyle={{ color: "#374151", fontSize: 10 }} />
                                <Bar dataKey="Adulto" fill={COLORS.adulto} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Criança" fill={COLORS.crianca} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Idoso" fill={COLORS.idoso} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Jovem" fill={COLORS.jovem} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
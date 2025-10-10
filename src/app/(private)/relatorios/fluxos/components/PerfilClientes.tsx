// src/app/(private)/relatorios/fluxos/components/PerfilClientes.tsx
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

/** Copia alguns estilos computados para o elemento clonado (suficiente para Recharts). */
function inlineBasicStyles(root: SVGElement) {
    const PROPS = ["font", "fontFamily", "fontSize", "fontWeight", "fill", "stroke", "strokeWidth", "opacity", "textAnchor"];
    const all = root.querySelectorAll<SVGElement>("*");
    all.forEach((el) => {
        const cs = window.getComputedStyle(el as Element);
        for (const p of PROPS) {
            const v = (cs as any)[p];
            if (v) (el as any).style[p] = v;
        }
    });
}

/** Converte o SVG (Recharts) para PNG (dataURL), preservando proporções e estilos. */
async function svgNodeToPngDataUrl(svg: SVGSVGElement, targetWidth: number): Promise<string> {
    // clona e garante width/height/viewBox
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const w = Math.max(1, rect.width || Number(svg.getAttribute("width")) || 800);
    const h = Math.max(1, rect.height || Number(svg.getAttribute("height")) || 400);

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);

    // aplica estilos computados (texto/eixos)
    inlineBasicStyles(clone);

    // fundo branco (para tema escuro)
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", String(w));
    bg.setAttribute("height", String(h));
    bg.setAttribute("fill", "#ffffff");
    clone.insertBefore(bg, clone.firstChild);

    // serializa
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
        const img = await new Promise<HTMLImageElement>((resolve) => {
            const i = new Image();
            // segurança: permite desenhar no canvas
            (i as any).crossOrigin = "anonymous";
            i.onload = () => resolve(i);
            i.onerror = () => resolve(i);
            i.src = url;
        });

        const ratio = w / h;
        const width = targetWidth;
        const height = Math.max(1, Math.round(width / (ratio || 2)));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL("image/png");
    } finally {
        URL.revokeObjectURL(url);
    }
}

function findChartSvg(container: HTMLElement | null): SVGSVGElement | null {
    return container ? (container.querySelector("svg") as SVGSVGElement | null) : null;
}

/* =============================================================================== */

export default function PerfilClientes() {
    const now = new Date();
    const DEFAULT: EditFilters = { lojaId: undefined, mes: now.getMonth() + 1, ano: now.getFullYear() };

    const [edit, setEdit] = React.useState<EditFilters>(DEFAULT);
    const [applied, setApplied] = React.useState<EditFilters>(DEFAULT);

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
            ["Perfil de Clientes (Compradores)"],                                // A1
            [`Loja: ${metaLoja}    Mês: ${metaMes}    Ano: ${metaAno}`],         // A2
            [""],                                                                // A3
            ["", "Gênero", "", "", "Idade", "", "", ""],                         // A4 (agrupadores)
            ["Dia da Semana", "Masculino", "Feminino", "Criança", "Jovem", "Adulto", "Idoso", "Total"], // A5
            ...body,
            totalsRow,
            percentRow,
        ]);

        // merges (título, metadados, “Gênero” e “Idade”)
        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // A1:H1
            { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // A2:H2
            { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } }, // B4:C4  (Gênero)
            { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } }, // D4:G4  (Idade)
        ];

        // larguras e freeze panes
        ws["!cols"] = [
            { wch: 16 }, { wch: 11 }, { wch: 11 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
            { wch: 10 },
        ];
        (ws as any)["!freeze"] = { xSplit: 1, ySplit: 5 };

        // estilos básicos (se suportado pela sua build do SheetJS)
        const center = { alignment: { horizontal: "center", vertical: "center" } };
        const boldCenter = { font: { bold: true }, ...center };

        // título centralizado
        const addrTitle = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (ws[addrTitle]) (ws[addrTitle] as any).s = boldCenter;

        // metadados alinhados à esquerda
        const addrMeta = XLSX.utils.encode_cell({ r: 1, c: 0 });
        if (ws[addrMeta]) (ws[addrMeta] as any).s = { alignment: { horizontal: "left" } };

        // linha de agrupadores (A4:H4) – garante “Gênero” centralizado e “Idade” visível
        for (let c = 0; c <= 7; c++) {
            const a = XLSX.utils.encode_cell({ r: 3, c });
            if (ws[a]) (ws[a] as any).s = boldCenter;
        }
        // cabeçalho detalhado (A5:H5)
        for (let c = 0; c <= 7; c++) {
            const a = XLSX.utils.encode_cell({ r: 4, c });
            if (ws[a]) (ws[a] as any).s = boldCenter;
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PerfilClientes");
        XLSX.writeFile(wb, "perfil_clientes.xlsx");
    };

    /** PDF com tabela + gráficos lado a lado (na mesma página) */
    const exportPDF = async () => {
        const metaLoja = lojaAtual?.descricao ?? lojaAtual?.name ?? (applied.lojaId ? `Loja ${applied.lojaId}` : "Todas");
        const metaMes = applied.mes ? meses[applied.mes - 1] : "Todos";
        const metaAno = applied.ano ?? "Todos";

        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(14);
        doc.text("Perfil de Clientes (Compradores)", 14, 14);
        doc.setFontSize(10);
        doc.text(`Loja: ${metaLoja}    Mês: ${metaMes}    Ano: ${metaAno}`, 14, 22);

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

        // ===== Exporta os gráficos, lado a lado =====
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 14;
        const gap = 10;
        const colW = Math.floor((pageW - margin * 2 - gap) / 2);

        const tableBottomY = (doc as any).lastAutoTable?.finalY ?? 36;
        let y = tableBottomY + 8;

        const svgGenero = findChartSvg(generoRef.current);
        const svgIdade = findChartSvg(idadeRef.current);

        // Se faltar qualquer um, apenas salva o PDF com a tabela
        if (!svgGenero || !svgIdade) {
            doc.save("perfil_clientes.pdf");
            return;
        }

        // Converte os dois em PNG (mantendo proporção)
        const [pngGenero, pngIdade] = await Promise.all([
            svgNodeToPngDataUrl(svgGenero, colW),
            svgNodeToPngDataUrl(svgIdade, colW),
        ]);

        // calcula alturas proporcionais
        const Gen = (doc as any).getImageProperties(pngGenero);
        const Ida = (doc as any).getImageProperties(pngIdade);
        const h1 = Math.round((colW * (Gen?.height || 1)) / (Gen?.width || 1));
        const h2 = Math.round((colW * (Ida?.height || 1)) / (Ida?.width || 1));
        const rowH = Math.max(h1, h2);

        // se não couber na mesma página, cria nova
        if (y + rowH > pageH - margin) {
            doc.addPage();
            y = margin;
        }

        // desenha lado a lado
        doc.addImage(pngGenero, "PNG", margin, y, colW, h1);
        doc.addImage(pngIdade, "PNG", margin + colW + gap, y, colW, h2);

        doc.save("perfil_clientes.pdf");
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
                                <CartesianGrid strokeDasharray="0.5 3" className="opacity-30" />
                                <XAxis dataKey="name" scale="auto" fontSize={13} />
                                <YAxis allowDecimals={false} fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "12px" }} />
                                <Legend fontSize={10} />
                                <Bar dataKey="Feminino" fill={COLORS.feminino} barSize={20} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Masculino" fill={COLORS.masculino} barSize={20} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div ref={idadeRef} className="h-64 w-full rounded-md border px-3 pt-3 pb-6">
                        <div className="mb-1 text-sm font-medium text-muted-foreground">Perfil de Clientes (compradores) por Idade</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.chartIdade ?? []}>
                                <CartesianGrid strokeDasharray="0.5 3" className="opacity-30" />
                                <XAxis dataKey="name" fontSize={13} />
                                <YAxis allowDecimals={false} fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "12px" }} />
                                <Legend />
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
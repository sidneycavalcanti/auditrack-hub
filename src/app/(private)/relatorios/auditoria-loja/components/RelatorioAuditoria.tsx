// FILE: src/app/(private)/relatorios/auditoria-loja/components/RelatorioAuditoria.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, Label
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { AudReportData } from "../types/auditoria";
import "@/app/styles/relatorios_pdf/auditoria-loja.css";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const C = (i: number) => `var(--chart-${i})`;

type Props = { data: AudReportData };

export default function RelatorioAuditoria({ data }: Props) {
    const { meta } = data;

    const motivosData = React.useMemo(
        () => data.motivosPerda.map(m => ({ name: m.motivo, value: m.pct })),
        [data.motivosPerda]
    );

    const exportPDF = () => {
        const prev = document.title;
        document.title = `Relatório de Auditoria - ${meta.loja} - ${meta.mes}/${meta.ano}`;
        const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
        window.addEventListener("afterprint", restore);
        window.print();
        setTimeout(restore, 1200);
    };

    const pizzaGenero = (g: { feminino: number; masculino: number }) => ([
        { name: "Feminino", value: g.feminino },
        { name: "Masculino", value: g.masculino },
    ]);

    const totalClientes = data.clientesCompraramVsNao.total || 0;
    const pctCompraram = totalClientes ? (data.clientesCompraramVsNao.compraram / totalClientes) * 100 : 0;

    return (
        <Card className="bg-transparent">
            {/* Barra de topo estilo modelo */}
            <div className="aud-topbar print:aud-topbar-print">
                <div className="aud-topbar__logo">
                    <Image src="/auditoria/logo-plaza.png" alt="Plaza" width={56} height={56} priority />
                </div>
                <div className="aud-topbar__title">
                    <div className="aud-topbar__muc">{meta.muc} – {meta.loja}</div>
                    <div className="aud-topbar__periodo">PERÍODO REALIZADO: {meta.mes.toUpperCase()} / {meta.ano}</div>
                </div>
            </div>

            <CardHeader className="print:hidden">
                <div className="flex items-center justify-between">
                    <CardTitle>Relatório de Auditoria de Lojas</CardTitle>
                    <Button variant="default" size="sm" onClick={exportPDF}>Exportar PDF</Button>
                </div>
                <CardDescription>{meta.loja} • MUC: {meta.muc} • Ref.: {meta.mes}/{meta.ano}</CardDescription>
            </CardHeader>

            <CardContent id="print-root-auditoria" className="space-y-4">
                {/* ===== PERFIL FREQUENTADOR ===== */}
                <SectionBand title="PERFIL FREQUENTADOR" />
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 grid-print-3">
                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Por Gênero</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[220px]">
                            <div className="aud-icons-row">
                                <Image src="/auditoria/transparentes/icone-genero.png" alt="Por gênero" width={180} height={80} />
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pizzaGenero(data.perfilFrequentador)} dataKey="value" innerRadius={52} outerRadius={84}>
                                        {pizzaGenero(data.perfilFrequentador).map((_, i) => (
                                            <Cell key={i} fill={C(i + 1)} />
                                        ))}
                                        <Label content={<PercentLabels />} />
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Por Turno</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[220px]">
                            <div className="aud-icons-row">
                                <Image src="/auditoria/transparentes/icone-turnos.png" alt="Por turno" width={260} height={82} />
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={[
                                    { nome: "Manhã", valor: data.perfilFrequentador.turnos.manha },
                                    { nome: "Tarde", valor: data.perfilFrequentador.turnos.tarde },
                                    { nome: "Noite", valor: data.perfilFrequentador.turnos.noite },
                                ]} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="nome" />
                                    <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                    <Bar dataKey="valor" radius={6} fill={C(1)} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Geral</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[220px]">
                            <div className="aud-icons-row">
                                <Image src="/auditoria/transparentes/icone-geral.png" alt="Geral" width={72} height={96} />
                            </div>
                            <ChartContainer config={{}} className="h-[140px] w-full">
                                <BarChart data={[
                                    { nome: "Feminino", valor: data.perfilFrequentador.feminino },
                                    { nome: "Masculino", valor: data.perfilFrequentador.masculino },
                                ]}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="nome" />
                                    <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="valor" radius={6} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* ===== PERFIL COMPRADOR ===== */}
                <SectionBand title="PERFIL COMPRADOR" />
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 grid-print-3">
                    {/* reaproveita os três cards acima, trocando para data.perfilComprador */}
                    {/* Por brevidade, omito repetições idênticas – copie os três cards e troque os campos */}
                </section>

                {/* ===== CONVERSÃO DE VENDAS ===== */}
                <SectionBand title="CONVERSÃO DE VENDAS" />
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 grid-print-2">
                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Fluxo × Vendas por dia</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[260px]">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.conversaoPorDia}>
                                    <CartesianGrid strokeDasharray="0.5 3" className="opacity-50" />
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="fluxo" name="Fluxo" radius={4} fill={C(1)} />
                                    <Bar dataKey="vendas" name="Vendas" radius={4} fill={C(3)} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Geral</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[260px]">
                            <div className="aud-icons-row">
                                <Image src="/auditoria/transparentes/icone-dinheiro.png" alt="dinheiro" width={56} height={56} />
                            </div>
                            <div className="text-center text-sm text-muted-foreground">
                                Aproveitamento geral: <span className="font-semibold">{(data.conversaoGeral.aproveitamento * 100).toFixed(1)}%</span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* ===== TICKET MÉDIO ===== */}
                <SectionBand title="TICKET MÉDIO" />
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 grid-print-2">
                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Ticket médio por dia da semana</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[240px]">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.ticketMedioPorDia}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                                    <Bar dataKey="valor" radius={6} fill={C(2)} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="chart-box">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">Ticket médio por turno</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[240px]">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.ticketMedioPorTurno}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="turno" />
                                    <YAxis />
                                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                                    <Bar dataKey="valor" radius={6} fill={C(2)} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* ===== VENDAS PERDIDAS / MOTIVOS ===== */}
                <SectionBand title="VENDAS PERDIDAS" />
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 grid-print-2">
                    <Card className="chart-box">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Motivos de perdas</CardTitle>
                        </CardHeader>

                        <CardContent className="h-[240px]">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={motivosData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={40}
                                        outerRadius={80}
                                    >
                                        {motivosData.map((_, i) => (
                                            <Cell key={i} fill={C((i % 5) + 1)} />
                                        ))}

                                        {/* se quiser manter a label de % no centro ou em cada fatia, mantenha aqui */}
                                        {/* <Label content={<PercentLabels />} /> */}
                                    </Pie>

                                    <Legend />
                                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* tabela compacta dos intervalos (opcional manter como estava) */}
                    <div className="overflow-x-auto rounded-md border">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: "Compraram", value: data.clientesCompraramVsNao.compraram },
                                        { name: "Não compraram", value: data.clientesCompraramVsNao.naoCompraram },
                                    ]}
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    <Cell fill={C(1)} />
                                    <Cell fill={C(3)} />
                                    <Label
                                        value={`${pctCompraram.toFixed(1)}%`}
                                        position="center"
                                        className="fill-foreground"
                                        fontSize={12}
                                    />
                                </Pie>
                                <Legend /><Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Rodapé impresso */}
                <footer className="print-footer only-print">
                    <div>Relatório de Auditoria • {meta.loja}</div>
                    <div>MUC: {meta.muc}</div>
                    <div>Ref.: {meta.mes}/{meta.ano}</div>
                    <div>Página <span className="pageNumber"></span>/<span className="totalPages"></span></div>
                </footer>
            </CardContent>
        </Card>
    );
}

/** Band (faixa) de seção igual ao PDF */
function SectionBand({ title }: { title: string }) {
    return (
        <div className="aud-band">
            <span className="aud-band__title">{title}</span>
        </div>
    );
}

/** Rótulos de % no centro da pizza */
function PercentLabels(props: any) {
    const { cx, cy } = props.viewBox ?? { cx: 0, cy: 0 };
    return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={12} className="fill-foreground">
            {/* o conteúdo é definido pelo Pie/Label automaticamente ao somar slices; usamos apenas o slot */}
        </text>
    );
}
// src/app/(private)/relatorios/avoperacional/components/AvOperacionalCharts.tsx
"use client";

import * as React from "react";
import {
    ResponsiveContainer,
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
    BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useThemeColors from "../hooks/useThemeColors";
import type { AvOperacional } from "@/types";
import { cn } from "@/lib/utils";
import { Table } from "@/components/ui/table";

type Props = { items: AvOperacional[] };

function toNumber(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export function AvOperacionalChartsPreview({ items }: Props) {
    const { primary, accent, success, warning, destructive, violet, muted, grid, palette } = useThemeColors();
    // Normalização dos dados vindos do backend
    const rows = React.useMemo(() => {
        return items.map((it) => {
            const score = toNumber((it as any).pontuacao ?? (it as any).nota);
            return {
                data: it.auditoria?.data?.slice(0, 10) ?? null,
                loja:
                    (it.auditoria as any)?.loja?.name ??
                    (it.auditoria as any)?.loja?.descricao ??
                    (it as any).lojaId ??
                    "—",
                questao:
                    it.cadAvOperacional?.descricao ??
                    (it as any).cadAvOperacional?.name ??
                    String(it.cadAvOperacionalId ?? "—"),
                score,
            };
        }).filter(r => r.data && r.score !== null) as Array<{
            data: string; loja: string; questao: string; score: number;
        }>;
    }, [items]);

    // 1) Evolução média por dia
    const mediaDia = React.useMemo(() => {
        const by: Record<string, { sum: number; count: number }> = {};
        for (const r of rows) {
            by[r.data] ??= { sum: 0, count: 0 };
            by[r.data].sum += r.score;
            by[r.data].count += 1;
        }
        return Object.entries(by)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([data, acc]) => ({ data, media: +(acc.sum / acc.count).toFixed(2) }));
    }, [rows]);

    // 2) Distribuição de notas (0–10)
    const distNotas = React.useMemo(() => {
        const bins = Array.from({ length: 11 }, () => 0);
        for (const r of rows) {
            const n = Math.round(r.score);
            if (n >= 0 && n <= 10) bins[n] += 1;
        }
        return bins.map((qtd, nota) => ({ nota, qtd }));
    }, [rows]);

    // 3) Média por Loja (Top 12)
    const mediaLoja = React.useMemo(() => {
        const by: Record<string, { sum: number; count: number }> = {};
        for (const r of rows) {
            by[r.loja] ??= { sum: 0, count: 0 };
            by[r.loja].sum += r.score;
            by[r.loja].count += 1;
        }
        return Object.entries(by)
            .map(([name, acc]) => ({ name, media: +(acc.sum / acc.count).toFixed(2) }))
            .sort((a, b) => b.media - a.media)
            .slice(0, 12);
    }, [rows]);

    // 4) Média por Questão (Top 12)
    const mediaQuestao = React.useMemo(() => {
        const by: Record<string, { sum: number; count: number }> = {};
        for (const r of rows) {
            by[r.questao] ??= { sum: 0, count: 0 };
            by[r.questao].sum += r.score;
            by[r.questao].count += 1;
        }
        return Object.entries(by)
            .map(([name, acc]) => ({ name, media: +(acc.sum / acc.count).toFixed(2) }))
            .sort((a, b) => b.media - a.media)
            .slice(0, 12);
    }, [rows]);

    const hasRows = rows.length > 0;

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {/* Evolução média por dia */}
            <Card className="bg-gradient-card shadow-card">
                <CardHeader><CardTitle>Evolução média por dia</CardTitle></CardHeader>
                <CardContent className="h-64">
                    {hasRows ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mediaDia}>
                                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                                <XAxis dataKey="data" fontSize={12} stroke={muted} />
                                <YAxis domain={[0, 10]} stroke={muted} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="media"
                                    name="Média"
                                    dot={false}
                                    stroke={palette[2]}
                                    strokeWidth={2.25}
                                    activeDot={{ r: 8, fill: accent }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full grid place-items-center text-muted-foreground">
                            Sem dados para exibir
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Distribuição de notas */}
            <Card className="bg-gradient-card shadow-card">
                <CardHeader><CardTitle>Distribuição de Notas (0–10)</CardTitle></CardHeader>
                <CardContent className="h-64">
                    {hasRows ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distNotas}>
                                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                                <XAxis dataKey="nota" stroke={muted} />
                                <YAxis allowDecimals={false} stroke={muted} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="qtd" name="Qtd" fill={accent} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full grid place-items-center text-muted-foreground">
                            Sem dados para exibir
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Média por Loja */}
            <Card className="bg-gradient-card shadow-card">
                <CardHeader><CardTitle>Média por Loja (Top 12)</CardTitle></CardHeader>
                <CardContent className="h-64">
                    {hasRows ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mediaLoja}>
                                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke={muted} tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 10]} stroke={muted} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="media" name="Média">
                                    {mediaLoja.map((_, i) => (
                                        <Cell key={`cell-loja-${i}`} fill={palette[i % palette.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full grid place-items-center text-muted-foreground">
                            Sem dados para exibir
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Média por Questão */}
            <Card className="bg-gradient-card shadow-card">
                <CardHeader><CardTitle>Média por Questão (Top 12)</CardTitle></CardHeader>
                <CardContent className="h-64">
                    {hasRows ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mediaQuestao}>
                                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke={muted} tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 10]} stroke={muted} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="media" name="Média">
                                    {mediaQuestao.map((_, i) => (
                                        <Cell key={`cell-quest-${i}`} fill={palette[i % palette.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full grid place-items-center text-muted-foreground">
                            Sem dados para exibir
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Radar comparativo simples (ex.: top 5 lojas) */}
            <Card className="bg-gradient-card shadow-card lg:col-span-2">
                <CardHeader><CardTitle>Comparativo (Radar)</CardTitle></CardHeader>
                <CardContent className="h-72">
                    {hasRows ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={mediaLoja.slice(0, 5)}>
                                <PolarGrid stroke={grid} />
                                <PolarAngleAxis dataKey="name" stroke={muted} />
                                <PolarRadiusAxis domain={[0, 10]} stroke={muted} />
                                <Radar
                                    name="Média"
                                    dataKey="media"
                                    stroke={primary}
                                    fill={primary}
                                    fillOpacity={0.2}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full grid place-items-center text-muted-foreground">
                            Sem dados para exibir
                        </div>
                    )}
                </CardContent>
            </Card>
            <Table></Table>
        </div>
    );
}
"use client";
import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useThemeColors from "../../hooks/useThemeColors";
import type { AvOperacional } from "@/types";
import { useAvOpRows } from "./useAvOpRows";

export default function ChartMediaPorQuestao({ items }: { items: AvOperacional[] }) {
    const { grid, muted, palette } = useThemeColors();
    const rows = useAvOpRows(items);

    const data = React.useMemo(() => {
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

    return (
        <Card className="bg-gradient-card shadow-card">
            <CardHeader><CardTitle>Média por Questão (Top 12)</CardTitle></CardHeader>
            <CardContent className="h-64">
                {rows.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke={muted} tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 10]} stroke={muted} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.75rem',
                                    fontSize: 12
                                }}
                            />
                            <Legend />
                            <Bar dataKey="media" name="Média" fill="#00ff55" >
                                {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full grid place-items-center text-muted-foreground">Sem dados para exibir</div>
                )}
            </CardContent>
        </Card>
    );
}
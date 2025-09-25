"use client";
import * as React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useThemeColors from "../../hooks/useThemeColors";
import type { AvOperacional } from "@/types";
import { useAvOpRows } from "./useAvOpRows";

export default function ChartEvolucaoDia({ items }: { items: AvOperacional[] }) {
    const { accent, muted, grid, palette } = useThemeColors();
    const rows = useAvOpRows(items);

    const data = React.useMemo(() => {
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

    return (
        <Card className="bg-gradient-card shadow-card">
            <CardHeader><CardTitle>Evolução média por dia</CardTitle></CardHeader>
            <CardContent className="h-64">
                {rows.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                            <XAxis dataKey="data" fontSize={12} stroke={muted} />
                            <YAxis domain={[0, 10]} stroke={muted} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="media" name="Média" dot={false} stroke={palette[2]} strokeWidth={2.25}
                                activeDot={{ r: 8, fill: accent }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full grid place-items-center text-muted-foreground">Sem dados para exibir</div>
                )}
            </CardContent>
        </Card>
    );
}
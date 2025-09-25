"use client";
import * as React from "react";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useThemeColors from "../../hooks/useThemeColors";
import type { AvOperacional } from "@/types";
import { useAvOpRows } from "./useAvOpRows";

export default function ChartRadarComparativo({ items }: { items: AvOperacional[] }) {
    const { primary, grid, muted } = useThemeColors();
    const rows = useAvOpRows(items);

    const data = React.useMemo(() => {
        const by: Record<string, { sum: number; count: number }> = {};
        for (const r of rows) {
            by[r.loja] ??= { sum: 0, count: 0 };
            by[r.loja].sum += r.score;
            by[r.loja].count += 1;
        }
        return Object.entries(by)
            .map(([name, acc]) => ({ name, media: +(acc.sum / acc.count).toFixed(2) }))
            .sort((a, b) => b.media - a.media)
            .slice(0, 5);
    }, [rows]);

    return (
        <Card className="bg-gradient-card shadow-card ">
            <CardHeader>
                <CardTitle>Comparativo (Radar)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
                {rows.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={data}>
                            <PolarGrid stroke={grid} />
                            <PolarAngleAxis dataKey="name" stroke={muted} fontSize={12} />
                            <PolarRadiusAxis domain={[0, 10]} stroke={muted} fontSize={10} />
                            <Radar name="Média" dataKey="media" stroke={primary} fill={primary} fillOpacity={0.2} />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full grid place-items-center text-muted-foreground">Sem dados para exibir</div>
                )}
            </CardContent>
        </Card>
    );
}
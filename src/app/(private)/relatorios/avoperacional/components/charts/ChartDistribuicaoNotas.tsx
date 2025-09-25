"use client";
import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useThemeColors from "../../hooks/useThemeColors";
import type { AvOperacional } from "@/types";
import { useAvOpRows } from "./useAvOpRows";

export default function ChartDistribuicaoNotas({ items }: { items: AvOperacional[] }) {
    const { violet_500, violet_600, muted } = useThemeColors();
    const rows = useAvOpRows(items);

    const data = React.useMemo(() => {
        const bins = Array.from({ length: 11 }, () => 0);
        for (const r of rows) {
            const n = Math.round(r.score);
            if (n >= 0 && n <= 10) bins[n] += 1;
        }
        return bins.map((qtd, nota) => ({ nota, qtd }));
    }, [rows]);

    return (
        <Card className="bg-gradient-card shadow-card lg:col-span-2">
            <CardHeader><CardTitle>Distribuição de Notas (0–10)</CardTitle></CardHeader>
            <CardContent className="h-64">
                {rows.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                            <CartesianGrid stroke={muted} strokeDasharray="3 3" />
                            <XAxis dataKey="nota" fill={violet_600} stroke={muted} fontSize={12} />
                            <YAxis allowDecimals={false} stroke={muted} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="qtd" name="Qtd" fill={violet_500} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full grid place-items-center text-muted-foreground">Sem dados para exibir</div>
                )}
            </CardContent>
        </Card>
    );
}
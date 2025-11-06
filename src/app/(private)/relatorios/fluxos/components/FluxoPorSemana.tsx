"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"
import { useFluxoPorSemana } from "../hooks/useFluxoPorSemana";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";

const DOW = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#ff00ff"];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export default function FluxoPorSemana() {
    const ALL = "ALL";

    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [mes, setMes] = React.useState<number | undefined>();
    const [ano, setAno] = React.useState<number | undefined>(new Date().getFullYear());

    const { data: lojasResp } = useLojas({ limit: 1000 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    const { linhas, porDia, totalPorSemana } =
        useFluxoPorSemana({ lojaId, mes, ano }, { enabled: true });

    return (
        <Card className="bg-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="text-center">3. Fluxo de Pessoas por Semana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-end gap-3 justify-end">
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

                {/* Tabela */}
                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/60">
                                <TableHead>Semana</TableHead>
                                {DOW.map((d) => <TableHead key={d} className="text-right">{d}</TableHead>)}
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {linhas.map((l) => (
                                <TableRow key={l.semana}>
                                    <TableCell>{l.semana}</TableCell>
                                    {DOW.map((d) => (
                                        <TableCell key={d} className="text-right">{Number(l[d] ?? 0)}</TableCell>
                                    ))}
                                    <TableCell className="text-right">{l.total}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                                <TableCell>Total</TableCell>
                                {DOW.map((d) => (
                                    <TableCell key={d} className="text-right">
                                        {linhas.reduce((a, l) => a + Number(l[d] ?? 0), 0)}
                                    </TableCell>
                                ))}
                                <TableCell className="text-right">
                                    {linhas.reduce((a, l) => a + l.total, 0)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Barras: Fluxo por Dia (empilhando semanas) */}
                <div className="h-80 w-full rounded-md border px-3 pt-3 pb-3">
                    <ResponsiveContainer>
                        <BarChart data={porDia}>
                            <CartesianGrid strokeDasharray="0.5 3" className="opacity-50" />
                            <XAxis dataKey="dia" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.75rem',
                                    fontSize: 12
                                }}
                                cursor={{ opacity: '10%' }}
                            />
                            <Legend />
                            {totalPorSemana.map((s, i) => (
                                <Bar key={s.semana} dataKey={s.semana} name={s.semana} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Barras: Total por Semana */}
                <div className="grid grid-cols-3 gap-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fluxo por semana</CardTitle>
                            <CardDescription>Período Out de 2025</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig}>
                                <BarChart
                                    accessibilityLayer data={totalPorSemana}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="semana"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    // tickFormatter={(value) => value.slice(0, 3)}
                                    />

                                    <ChartTooltip
                                        // cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="total" fill="var(--primary)" radius={8} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2 text-sm">
                            <div className="flex gap-2 leading-none font-medium">
                                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="text-muted-foreground leading-none">
                                Showing total visitors for the last 6 months
                            </div>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle></CardTitle>
                            <CardDescription></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig}>
                                <BarChart
                                    accessibilityLayer
                                    data={totalPorSemana}
                                    layout="vertical"
                                    margin={{
                                        right: 16,
                                    }}
                                >
                                    <CartesianGrid horizontal={false} />
                                    <YAxis
                                        dataKey="semana"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <XAxis
                                        dataKey="semana"
                                        type="number"
                                        hide
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="line" />}
                                    />
                                    <Bar
                                        dataKey="semana"
                                        fill="var(--color-card)"
                                        radius={4}
                                    >
                                        <LabelList
                                            position="insideLeft"
                                            offset={8}
                                            className="fill-amber-300"
                                            fontSize={12}
                                        />
                                        <LabelList
                                            dataKey="semana"
                                            position="right"
                                            offset={8}
                                            className="fill-foreground"
                                            fontSize={12}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter></CardFooter>
                    </Card>

                    <div className="h-full w-full">
                        <ResponsiveContainer>
                            <BarChart data={totalPorSemana}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="semana" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total" name="Total" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
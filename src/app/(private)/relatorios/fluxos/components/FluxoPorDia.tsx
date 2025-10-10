"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useFluxoPorDia } from "../hooks/useFluxoPorDia";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import type { Loja } from "@/types";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1", "#a4de6c", "#d0ed57"];

export default function FluxoPorDia() {
    const ALL = "ALL";
    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [mes, setMes] = React.useState<number | undefined>();
    const [ano, setAno] = React.useState<number | undefined>(new Date().getFullYear());

    const { data: lojasResp } = useLojas({ limit: 1000 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    const { categorias, linhas, totalPorCategoria, totalGeral } =
        useFluxoPorDia({ lojaId, mes, ano }, { enabled: true });

    const pieData = Object.entries(totalPorCategoria).map(([name, value]) => ({ name, value }));

    return (
        <Card className="bg-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="text-center">2. Fluxo de Pessoas por Dia da Semana</CardTitle>
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

                <div className="grid grid-cols-3 gap-2">
                    {/* Tabela */}
                    <div className="col-span-2 overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/60">
                                    <TableHead>Dia da semana</TableHead>
                                    {categorias.map((c) => <TableHead key={c} className="text-right">{c}</TableHead>)}
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {linhas.map((l) => (
                                    <TableRow key={l.dia}>
                                        <TableCell>{l.dia}</TableCell>
                                        {categorias.map((c) => (
                                            <TableCell key={c} className="text-right">{Number(l[c] ?? 0)}</TableCell>
                                        ))}
                                        <TableCell className="text-right">{l.total}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-semibold">
                                    <TableCell>Total</TableCell>
                                    {categorias.map((c) => (
                                        <TableCell key={c} className="text-right">{totalPorCategoria[c] ?? 0}</TableCell>
                                    ))}
                                    <TableCell className="text-right">{totalGeral}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pizza categorias (distribuição) */}
                    <div className="col-span-1 rounded-md border h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>


                {/* Barras por dia x categorias */}
                <Card>
                    <CardHeader>
                        <CardTitle>Por dia x categorias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={linhas}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                        }}
                                    />
                                    <Legend />
                                    {categorias.map((c, i) => (
                                        <Bar key={c} dataKey={c} name={c} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </CardContent>
        </Card>
    );
}
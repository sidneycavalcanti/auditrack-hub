// src/app/(private)/relatorios/vendas/components/TabelaComparativoVendasHora.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FunnelX } from "lucide-react";

import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import { useVendasPorHora, type SemanaIndex } from "../hooks/useVendasPorHora";
import type { Loja } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const MONTHS = [
    { v: 1, n: "01" }, { v: 2, n: "02" }, { v: 3, n: "03" }, { v: 4, n: "04" },
    { v: 5, n: "05" }, { v: 6, n: "06" }, { v: 7, n: "07" }, { v: 8, n: "08" },
    { v: 9, n: "09" }, { v: 10, n: "10" }, { v: 11, n: "11" }, { v: 12, n: "12" },
];
const WEEKS: { v: SemanaIndex, n: string }[] = [
    { v: 1, n: "1ª semana (1–7)" },
    { v: 2, n: "2ª semana (8–14)" },
    { v: 3, n: "3ª semana (15–21)" },
    { v: 4, n: "4ª semana (22–28)" },
    { v: 5, n: "5ª semana (29–fim)" },
];

const DAYS_PT = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function TabelaComparativoVendasHora() {
    const { data: lojasResp } = useLojas({ limit: 500 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    // form state (não busca automaticamente)
    const [lojaId, setLojaId] = React.useState<number | undefined>();
    const [mes, setMes] = React.useState<number | undefined>();
    const [ano, setAno] = React.useState<number | undefined>();
    const [semana, setSemana] = React.useState<SemanaIndex | undefined>();

    // efetiva a busca só no clique
    const [params, setParams] = React.useState<{
        lojaId?: number; mes?: number; ano?: number; semana?: SemanaIndex;
    } | null>(null);
    const enabled = !!params;

    const { data, isFetching } = useVendasPorHora(params ?? {}, { enabled });

    const canSearch = !!(lojaId && mes && ano && semana);
    const lojaNome =
        (lojas.find(l => l.id === params?.lojaId)?.descricao ??
            lojas.find(l => l.id === params?.lojaId)?.name) ?? "-";

    function onBuscar() {
        if (!canSearch) return;
        setParams({
            lojaId: Number(lojaId),
            mes: Number(mes),
            ano: Number(ano),
            semana: semana as SemanaIndex,
        });
    }
    function onLimpar() {
        setLojaId(undefined); setMes(undefined); setAno(undefined); setSemana(undefined);
        setParams(null);
    }

    const rows = data?.rows ?? [];
    const totaisColuna = data?.totaisColuna ?? Array(7).fill(0);
    const totalGeral = data?.totalGeral ?? 0;

    return (
        <>
            <Card className="bg-transparent mb-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-center">
                        QUADRO COMPARATIVO DE VENDAS POR HORA DAS LOJAS AUDITADAS
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* identificação à esquerda */}
                        {enabled ? (
                            <div className="flex-1 text-xs text-muted-foreground">
                                <div>LOJA: <span className="text-foreground">{lojaNome}</span></div>
                                <div>{data?.periodoTexto ?? "-"}</div>
                            </div>
                        ) : <div className="flex-1" />}

                        {/* filtros */}
                        <div className="flex-1 flex flex-col lg:flex-row items-end justify-end gap-2">
                            <div className="space-y-1">
                                <Label className="ml-1.5">Loja</Label>
                                <Select value={lojaId ? String(lojaId) : ""} onValueChange={v => setLojaId(v ? Number(v) : undefined)}>
                                    <SelectTrigger className="cursor-pointer">
                                        <SelectValue placeholder="Selecione a loja" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lojas.map(l =>
                                            <SelectItem key={l.id} value={String(l.id)}>
                                                {l.descricao ?? l.name ?? `Loja ${l.id}`}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="ml-1.5">Mês</Label>
                                <Select value={mes ? String(mes) : ""} onValueChange={(v) => setMes(v ? Number(v) : undefined)}>
                                    <SelectTrigger className="cursor-pointer">
                                        <SelectValue placeholder="Mês" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="ml-1.5">Ano</Label>
                                <Select value={ano ? String(ano) : ""} onValueChange={(v) => setAno(v ? Number(v) : undefined)}>
                                    <SelectTrigger className="cursor-pointer">
                                        <SelectValue placeholder="Ano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y =>
                                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="ml-1.5">Semana</Label>
                                <Select value={semana ? String(semana) : ""} onValueChange={(v) =>
                                    setSemana(v ? (Number(v) as SemanaIndex) : undefined)
                                }>
                                    <SelectTrigger className="cursor-pointer">
                                        <SelectValue placeholder="Sem." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WEEKS.map(w => <SelectItem key={w.v} value={String(w.v)}>{w.n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <Button onClick={onBuscar} disabled={!canSearch} size="sm" className="cursor-pointer">
                                    <Search className="mr-2 h-4 w-4" /> Buscar
                                </Button>
                                <Button onClick={onLimpar} variant="outline" size="sm" className="cursor-pointer">
                                    <FunnelX />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* tabela */}
            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-card shadow-card">
                            <TableHead className="min-w-[140px]">HORÁRIO / INT.</TableHead>
                            {DAYS_PT.map((d, i) => (
                                <TableHead key={d} className="text-center">
                                    <div className="font-semibold">{d}</div>
                                    <div className="text-xs text-red-500">
                                        {data?.diasCabecalho?.[i] ?? "-"}
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead className="text-center bg-muted">TOTAIS</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {!enabled && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground">
                                    Selecione Loja, Mês/Ano e Semana, depois clique em Buscar.
                                </TableCell>
                            </TableRow>
                        )}

                        {enabled && isFetching && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground">
                                    <LoadingSpinner size="lg" text="Carregando…" />
                                </TableCell>
                            </TableRow>
                        )}

                        {enabled && !isFetching && rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground">
                                    Nenhum registro encontrado no período selecionado.
                                </TableCell>
                            </TableRow>
                        )}

                        {enabled && !isFetching && rows.map(r => (
                            <TableRow key={r.intervalo}>
                                <TableCell className="whitespace-nowrap">{r.intervalo}</TableCell>
                                {r.valores.map((v, idx) => (
                                    <TableCell key={idx} className="text-right">{v ? BRL.format(v) : "-"}</TableCell>
                                ))}
                                <TableCell className="text-right bg-muted">
                                    {r.totalLinha ? BRL.format(r.totalLinha) : "-"}
                                </TableCell>
                            </TableRow>
                        ))}

                        {enabled && !isFetching && rows.length > 0 && (
                            <TableRow className="bg-muted/60 font-semibold">
                                <TableCell>TOTAIS</TableCell>
                                {totaisColuna.map((v, idx) => (
                                    <TableCell key={idx} className="text-right">
                                        {v ? BRL.format(v) : "-"}
                                    </TableCell>
                                ))}
                                <TableCell className="text-right">
                                    {totalGeral ? BRL.format(totalGeral) : "-"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
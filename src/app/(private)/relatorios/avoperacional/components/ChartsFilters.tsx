"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvOperacional } from "@/types";
import type { AvOperacionalFilters } from "../hooks/useAvOperacional";
import { cn } from "@/lib/utils";

const ALL = "all";

const MONTHS = [
    { v: 1, n: "Jan" }, { v: 2, n: "Fev" }, { v: 3, n: "Mar" }, { v: 4, n: "Abr" },
    { v: 5, n: "Mai" }, { v: 6, n: "Jun" }, { v: 7, n: "Jul" }, { v: 8, n: "Ago" },
    { v: 9, n: "Set" }, { v: 10, n: "Out" }, { v: 11, n: "Nov" }, { v: 12, n: "Dez" },
];

type Props = {
    items: AvOperacional[];                // para popular selects (auditores/itens/questões/lojas)
    value: AvOperacionalFilters;           // estado atual
    onChange: (next: Partial<AvOperacionalFilters>) => void;
    onClear?: () => void;
    className?: string;
};

export default function AvOpChartsFilters({ items, value, onChange, onClear, className }: Props) {
    // listas únicas
    const anos = React.useMemo(() => {
        const s = new Set<number>();
        for (const it of items) {
            const y = Number(it.auditoria?.data?.slice(0, 4));
            if (y) s.add(y);
        }
        return [...s].sort((a, b) => b - a);
    }, [items]);

    const lojas = React.useMemo(() => {
        const map = new Map<number, string>();
        for (const it of items) {
            const id = it.auditoria?.loja?.id;
            const name = it.auditoria?.loja?.name ?? (it.auditoria?.loja as any)?.descricao;
            if (id) map.set(id, name ?? `Loja ${id}`);
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [items]);

    const auditores = React.useMemo(() => {
        const map = new Map<number, string>();
        for (const it of items) {
            const id = it.auditoria?.usuario?.id;
            const name = it.auditoria?.usuario?.name;
            if (id) map.set(id, name ?? `Usuário ${id}`);
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [items]);

    const itensOp = React.useMemo(() => {
        const map = new Map<number, string>();
        for (const it of items) {
            const id = it.cadAvOperacionalId ?? it.cadAvOperacional?.id;
            const name = it.cadAvOperacional?.descricao;
            if (id) map.set(id, name ?? `Item ${id}`);
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [items]);

    const questoes = React.useMemo(() => {
        const map = new Map<number, string>();
        for (const it of items) {
            const id = it.questao?.id;
            const name = it.questao?.name;
            if (id) map.set(id, name ?? `Questão ${id}`);
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [items]);

    return (
        <Card className={cn("bg-gradient-card shadow-card", className)}>
            <CardContent className="space-y-3 py-4">
                <div className="grid gap-2 lg:grid-cols-6">
                    {/* Mês */}
                    <div>
                        <Label>Mês</Label>
                        <Select
                            value={value.mes ? String(value.mes) : ALL}
                            onValueChange={(v) => onChange({ mes: v === ALL ? undefined : Number(v) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {MONTHS.map((m) => <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ano */}
                    <div>
                        <Label>Ano</Label>
                        <Select
                            value={value.ano ? String(value.ano) : ALL}
                            onValueChange={(v) => onChange({ ano: v === ALL ? undefined : Number(v) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {anos.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Loja */}
                    <div>
                        <Label>Loja</Label>
                        <Select
                            value={value.lojaId ? String(value.lojaId) : ALL}
                            onValueChange={(v) => onChange({ lojaId: v === ALL ? undefined : Number(v) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todas</SelectItem>
                                {lojas.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Auditor */}
                    <div>
                        <Label>Auditor</Label>
                        <Select
                            value={value.auditorId ? String(value.auditorId) : ALL}
                            onValueChange={(v) => onChange({ auditorId: v === ALL ? undefined : Number(v) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {auditores.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Item Operacional */}
                    <div>
                        <Label>Item Operacional</Label>
                        <Select
                            value={value.cadAvOperacionalId ? String(value.cadAvOperacionalId) : ALL}
                            onValueChange={(v) => onChange({ cadAvOperacionalId: v === ALL ? undefined : Number(v) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todos</SelectItem>
                                {itensOp.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Questão */}
                    <div>
                        <Label>Questão</Label>
                        <Select
                            value={value.questaoId ? String(value.questaoId) : ALL}
                            onValueChange={(v) => onChange({ questaoId: v === ALL ? undefined : Number(v) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>Todas</SelectItem>
                                {questoes.map((q) => <SelectItem key={q.id} value={String(q.id)}>{q.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-6">
                    {/* Período livre */}
                    <div className="lg:col-span-2">
                        <Label>De</Label>
                        <Input type="date" value={value.from ?? ""} onChange={(e) => onChange({ from: e.target.value || undefined })} />
                    </div>
                    <div className="lg:col-span-2">
                        <Label>Até</Label>
                        <Input type="date" value={value.to ?? ""} onChange={(e) => onChange({ to: e.target.value || undefined })} />
                    </div>

                    {/* Faixa de nota */}
                    <div>
                        <Label>Nota Min</Label>
                        <Input
                            type="number" min={0} max={10} step={1}
                            value={value.notaMin ?? ""}
                            onChange={(e) => onChange({ notaMin: e.target.value === "" ? undefined : Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label>Nota Max</Label>
                        <Input
                            type="number" min={0} max={10} step={1}
                            value={value.notaMax ?? ""}
                            onChange={(e) => onChange({ notaMax: e.target.value === "" ? undefined : Number(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Busca livre + Ações */}
                <div className="grid gap-2 lg:grid-cols-6">
                    <div className="lg:col-span-4">
                        <Label>Busca</Label>
                        <Input
                            placeholder="Auditor, loja, item, questão, observação…"
                            value={value.search ?? ""}
                            onChange={(e) => onChange({ search: e.target.value || undefined })}
                        />
                    </div>
                    <div className="flex items-end gap-2 lg:col-span-2">
                        <Button type="button" variant="outline" className="cursor-pointer w-full" onClick={onClear}>
                            Limpar filtros
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
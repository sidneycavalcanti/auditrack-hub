// src/app/(private)/relatorios/avoperacional/components/AvOperacionalTable.tsx
"use client";

import * as React from "react";
import { Save, Download, FileSpreadsheet, FileText, Search, X, Loader2, FunnelX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { AvOperacional, Loja } from "@/types";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import { useAvaliacoesOperacional, useUpdateAvOperacional } from "../hooks/useAvOperacional";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AvOperacionalTableProps = {
    items: AvOperacional[];
};

type DiaFmt = { dia: string; mes: string; ano: string; display: string };

const INVALID_DAY: DiaFmt = { dia: "-", mes: "-", ano: "-", display: "-" };

function fmtDia(iso?: string | null): DiaFmt {
    if (!iso) return INVALID_DAY;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return INVALID_DAY;

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return { dia: dd, mes: mm, ano: yyyy, display: `${dd}/${mm}/${yyyy}` };
}

const ALL = "all"; // sentinela para "Todos"

const MONTHS = [
    { v: 1, n: "Jan" }, { v: 2, n: "Fev" }, { v: 3, n: "Mar" }, { v: 4, n: "Abr" },
    { v: 5, n: "Mai" }, { v: 6, n: "Jun" }, { v: 7, n: "Jul" }, { v: 8, n: "Ago" },
    { v: 9, n: "Set" }, { v: 10, n: "Out" }, { v: 11, n: "Nov" }, { v: 12, n: "Dez" },
];

export default function AvOperacionalTable({ items }: AvOperacionalTableProps) {
    const { data: lojasResp } = useLojas({ limit: 500 });
    const lojas = (lojasResp?.data as Loja[]) ?? [];

    // filtros
    const anos = React.useMemo(() => {
        const set = new Set<number>();
        items.forEach((i) => {
            const y = Number(i.auditoria?.data?.slice(0, 4));
            if (y) set.add(y);
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [items]);

    const [ano, setAno] = React.useState<number | undefined>(anos[0]);
    const [mes, setMes] = React.useState<number | undefined>(undefined);
    const [lojaId, setLojaId] = React.useState<number | undefined>(undefined);
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(10);
    const [statusFilter, setStatusFilter] = React.useState<string>(ALL);

    const { data: avOperacionalResp, isLoading, error } = useAvaliacoesOperacional({
        name: search || undefined,
        page: page,
        limit: limit,
    });

    const motivosperda = avOperacionalResp?.data ?? [];
    const pagination = {
        total: avOperacionalResp?.total ?? 0,
        totalPages: avOperacionalResp?.totalPages ?? 1,
        currentPage: avOperacionalResp?.page ?? 1,
        limit: avOperacionalResp?.limit ?? 10,
    };

    const filtered = React.useMemo(() => {
        return items.filter((i) => {
            const d = i.auditoria?.data?.slice(0, 10);
            const y = d ? Number(d.slice(0, 4)) : undefined;
            const m = d ? Number(d.slice(5, 7)) : undefined;

            if (ano && y !== ano) return false;
            if (mes && m !== mes) return false;
            if (lojaId && i.auditoria?.loja?.id !== lojaId) return false;
            if (search) {
                const s = search.toLowerCase();
                const auditor = i.auditoria?.usuario?.name?.toLowerCase() ?? "";
                const loja = (i.auditoria?.loja?.name ?? (i.auditoria?.loja as any)?.descricao ?? "").toLowerCase();
                const itemOp = i.cadAvOperacional?.descricao?.toLowerCase() ?? "";
                const questao = i.questao?.name?.toLowerCase() ?? "";
                const obs = (i.resposta ?? i.observacoes ?? "").toLowerCase();
                if (![auditor, loja, itemOp, questao, obs].some((t) => t.includes(s))) return false;
            }
            return true;
        });
    }, [items, ano, mes, lojaId, search]);

    const clearFilters = () => {
        setMes(undefined)
        setAno(anos[0]);
        setLojaId(undefined)
    };

    const clearSearch = () => {
        setSearch("");
        setPage(1);
    };



    return (
        <>
            <div className="space-y-3">
                {/* <Card className="bg-gradient-card shadow-card">
                    <CardHeader>
                        
                    </CardHeader>
                    <CardContent className="space-y-3">
                        
                    </CardContent>
                </Card> */}
                <Card className="bg-gradient-card shadow-card">
                    <CardHeader className="">
                        <CardTitle className="space-y-3">
                            {/* <h3>Observações da Avaliação Operacional</h3> */}
                            {lojaId === undefined || mes === undefined || ano === undefined ? (
                                <h3>Filtrar apenas tabela</h3>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <h3>Filtrar apenas tabela</h3>
                                    <div>{` Loja: ${lojaId} - Mês: ${mes} / Ano: ${ano}`}</div>
                                </div>
                            )}

                            {/* filtros */}
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col md:flex-row flex-5 gap-2 w-full">
                                    {/* Mês */}
                                    < div className="flex-2 gap-0.5">
                                        <Select
                                            value={mes ? String(mes) : ALL}
                                            onValueChange={(v) => setMes(v === ALL ? undefined : Number(v))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecionar Mês" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ALL}>Selecionar Mês</SelectItem>
                                                {MONTHS.map((m) => (
                                                    <SelectItem key={m.v} value={String(m.v)}>{m.n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Ano */}
                                    <div className="flex-2 gap-0.5">
                                        <Select
                                            value={ano ? String(ano) : ALL}
                                            onValueChange={(v) => setAno(v === ALL ? undefined : Number(v))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecionar Ano" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ALL}>Selecionar Ano</SelectItem>
                                                {anos.map((y) => (
                                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Loja */}
                                    <div className="flex-2 gap-0.5">
                                        <Select
                                            value={lojaId ? String(lojaId) : ALL}
                                            onValueChange={(v) => setLojaId(v === ALL ? undefined : Number(v))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecionar Loja" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ALL}>Selecionar Loja</SelectItem>
                                                {lojas.map((l) => (
                                                    <SelectItem key={l.id} value={String(l.id)}>
                                                        {l.descricao ?? l.name ?? `Loja ${l.id}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>



                                    {/* ações de export */}
                                    <div className="flex flex-col flex-1 w-full md:flex-row gap-2">
                                        <div className="md:flex-1">
                                            <ExportSelect rows={filtered} />
                                        </div>
                                    </div>

                                </div>
                                <div className="flex gap-2">

                                    <div className="relative flex-6">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                        <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Auditor, loja, item, questão..." />
                                    </div>

                                    {/* btn limpar filtros */}
                                    {(setMes !== undefined || setLojaId !== undefined || setAno !== undefined) && (
                                        <div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Limpar filtro"
                                                onClick={clearFilters}
                                                className="bg-background border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                                            >
                                                <FunnelX />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row">


                            {(search) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSearch}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                    Limpar buscas
                                </Button>
                            )}
                        </div>
                        {/* tabela */}
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Nº</TableHead>
                                        <TableHead>Dia</TableHead>
                                        <TableHead>Auditor</TableHead>
                                        <TableHead>Item Operacional</TableHead>
                                        <TableHead>Questão</TableHead>
                                        <TableHead>Observação</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((it, idx) => {
                                        const d = fmtDia(it.auditoria?.data);
                                        return (
                                            <Row key={it.id} index={idx + 1} item={it} dia={d.display} />
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                Nenhum registro encontrado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginação */}
                        {pagination.totalPages >= 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
                                {/* Contagem */}
                                <div className="flex items-center justify-between">
                                    <p className="flex-wrap md:max-w-48 text-xs text-muted-foreground">
                                        {pagination.total > 0
                                            ? `Mostrando ${(pagination.currentPage - 1) * pagination.limit + 1
                                            } a ${Math.min(
                                                pagination.currentPage * pagination.limit,
                                                pagination.total
                                            )} de ${pagination.total} Observações Avaliações Operacional`
                                            : "Nenhuma questão encontrada"}
                                    </p>
                                </div>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setPage(Math.max(1, pagination.currentPage - 1))}
                                                className={
                                                    pagination.currentPage === 1
                                                        ? "pointer-events-none opacity-50"
                                                        : "cursor-pointer"
                                                }
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (pagination.totalPages <= 5) pageNum = i + 1;
                                            else if (pagination.currentPage <= 3) pageNum = i + 1;
                                            else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                                            else pageNum = pagination.currentPage - 2 + i;

                                            return (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationLink
                                                        onClick={() => setPage(pageNum)}
                                                        isActive={pagination.currentPage === pageNum}
                                                        className="cursor-pointer"
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        })}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setPage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                                                className={
                                                    pagination.currentPage === pagination.totalPages
                                                        ? "pointer-events-none opacity-50"
                                                        : "cursor-pointer"
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );

}

// helpers já existentes no arquivo:
/// exportXLSX(rows, filename), exportXLS(rows, filename), exportPDF(rows, filename)

function defaultName(kind: "xlsx" | "xls" | "pdf" | "none") {
    switch (kind) {
        case "xlsx": return "rel-av-operacional.xlsx";
        case "xls": return "rel-av-operacional.xls";
        case "pdf": return "rel-av-operacional.pdf";
        default: return "";
    }
}

function ExportSelect({ rows }: { rows: AvOperacional[] }) {
    // não use string vazia como value (evita erro do shadcn Select)
    const [kind, setKind] = React.useState<"none" | "xlsx" | "xls" | "pdf">("none");
    const [pending, setPending] = React.useState(false);

    const filename = defaultName(kind);
    const canExport = kind !== "none" && rows.length > 0 && !pending;

    const handleExport = async () => {
        if (!canExport) return;
        setPending(true);
        try {
            if (kind === "xlsx") await exportXLSX(rows, filename);
            else if (kind === "xls") await exportXLS(rows, filename);
            else if (kind === "pdf") await exportPDF(rows, filename);
        } finally {
            setPending(false);
            // volta para placeholder após exportar
            setKind("none");
        }
    };

    return (
        <div className="flex gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Exportar…" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none" disabled>Exportar…</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="xls">Excel 97–2003 (.xls)</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant="outline"
                size="sm"
                title="Exportar"
                onClick={handleExport}
                disabled={!canExport}
                className="cursor-pointer"
            >
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download />
            </Button>
        </div>
    );
}



function Row({ item, index, dia }: { item: AvOperacional; index: number; dia: string }) {
    const [open, setOpen] = React.useState(false);
    const auditor = item.auditoria?.usuario?.name ?? `Usuário ${item.auditoria?.usuario?.id ?? "-"}`;
    const loja =
        item.auditoria?.loja?.name ??
        (item.auditoria?.loja as any)?.descricao ??
        `Loja ${item.auditoria?.loja?.id ?? "-"}`;
    const itemOp = item.cadAvOperacional?.descricao ?? `Item ${item.cadAvOperacionalId}`;
    const questao = item.questao?.name ?? "-";
    const obs = item.resposta ?? item.observacoes ?? "-";

    return (
        <TableRow>
            <TableCell className="py-1.5">{index}</TableCell>
            <TableCell className="py-1.5">{dia}</TableCell>
            <TableCell className="py-1.5">{auditor}</TableCell>
            <TableCell className="py-1.5">{itemOp}</TableCell>
            <TableCell className="py-1.5">{questao}</TableCell>
            <TableCell className="py-1.5">{obs}</TableCell>
            <TableCell className="py-1.5 text-right">
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setOpen(true)}>
                    <Save className="h-4 w-4 mr-2" /> Editar
                </Button>

                <EditDialog open={open} onOpenChange={setOpen} item={item} />
            </TableCell>
        </TableRow>
    );
}

/** Dialog de edição (resposta/nota) */
function EditDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (v: boolean) => void; item: AvOperacional }) {
    const [resposta, setResposta] = React.useState(item.resposta ?? item.observacoes ?? "");
    const [nota, setNota] = React.useState<number | "">((item.nota ?? item.pontuacao) as number);

    React.useEffect(() => {
        if (open) {
            setResposta(item.resposta ?? item.observacoes ?? "");
            setNota((item.nota ?? item.pontuacao) as number);
        }
    }, [open, item]);

    const update = useUpdateAvOperacional();

    const handleSave = async () => {
        await update.mutateAsync({
            id: item.id,
            data: {
                resposta: resposta?.trim(),
                nota: typeof nota === "number" ? nota : undefined,
            },
        });
        onOpenChange(false);
    };

    const canSave = (resposta ?? "").trim().length > 0 || typeof nota === "number";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar avaliação #{item.id}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div>
                        <Label>Nota (0–10)</Label>
                        <Input
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={nota}
                            onChange={(e) => {
                                const v = e.target.value;
                                setNota(v === "" ? "" : Math.max(0, Math.min(10, Number(v))));
                            }}
                        />
                    </div>

                    <div>
                        <Label>Observação</Label>
                        <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={6} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button className="cursor-pointer" onClick={handleSave} disabled={!canSave || update.isPending}>
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ========================= Exportações =========================
    Obs: precisa ter as libs instaladas no projeto:
    npm i xlsx jspdf jspdf-autotable
   (imports são dinâmicos para rodar apenas no client) */

function toFlatRows(src: AvOperacional[]) {
    return src.map((it, i) => {
        const d = fmtDia(it.auditoria?.data).display;
        const auditor = it.auditoria?.usuario?.name ?? `Usuário ${it.auditoria?.usuario?.id ?? "-"}`;
        const itemOp = it.cadAvOperacional?.descricao ?? `Item ${it.cadAvOperacionalId}`;
        const questao = it.questao?.name ?? "-";
        return {
            "Nº": i + 1,
            DIA: d,
            AUDITOR: auditor,
            "ITEM OPERACIONAL": itemOp,
            QUESTÃO: questao,
            OBSERVAÇÃO: it.resposta ?? it.observacoes ?? "",
        };
    });
}

async function exportXLSX(rows: AvOperacional[], filename: string) {
    // NÃO use .default – pegue o namespace
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(toFlatRows(rows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avaliações");
    XLSX.writeFile(wb, filename, { bookType: "xlsx" });
}

async function exportXLS(rows: AvOperacional[], filename: string) {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(toFlatRows(rows));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avaliações");
    // SheetJS suporta writeFile com bookType "xls"
    XLSX.writeFile(wb, filename, { bookType: "xls" });
}

async function exportPDF(rows: AvOperacional[], filename: string) {
    // no ESM use jsPDF via named export, e a função autoTable separada
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const data = toFlatRows(rows);

    autoTable(doc, {
        head: [Object.keys(data[0] ?? { "Nº": "", DIA: "", AUDITOR: "", "ITEM OPERACIONAL": "", QUESTÃO: "", OBSERVAÇÃO: "" })],
        body: data.map((r) => Object.values(r)),
        styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [33, 33, 33] },
        columnStyles: { 5: { cellWidth: 300 } }, // OBS larga
        margin: { top: 40, left: 20, right: 20, bottom: 20 },
    });

    doc.save(filename);
}
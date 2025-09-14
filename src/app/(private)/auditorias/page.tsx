// src/app/(private)/auditorias/page.tsx
"use client";

import React from "react";
import { ClipboardList, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AuditoriaFormDialog from "../auditorias/components/AuditoriaFormDialog";

import { format } from "date-fns";
import type { Auditoria } from "@/types";

// Se seus hooks estão sob /app/(private)/auditorias/hooks (como no seu exemplo de erro do toast)
import {
    useAuditorias,
    useDeleteAuditoria,
} from "@/app/(private)/auditorias/hooks/useAuditorias";

export default function AuditoriasPage() {
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(10);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<Auditoria | null>(null);

    const { data: resp, isLoading, isFetching } = useAuditorias({
        q: search,
        page,
        limit,
    });
    const { mutate: deleteAuditoria } = useDeleteAuditoria();

    const items = resp?.data || [];
    const total = resp?.total || 0;
    const totalPages = resp?.totalPages || 1;

    const handleEdit = (a: Auditoria) => {
        setSelected(a);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (typeof window !== "undefined" && window.confirm("Deseja excluir esta auditoria?")) {
            deleteAuditoria(id);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <ClipboardList className="h-8 w-8" />
                        Auditorias
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie e acompanhe as auditorias agendadas
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setSelected(null);
                        setOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Auditoria
                </Button>
            </div>

            {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por loja ou usuário..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading && !isFetching ? (
                <div className="flex items-center justify-center py-16">
                    <LoadingSpinner size="lg" text="Carregando auditorias..." />
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Tabela */}
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-2 text-left">Loja</th>
                                    <th className="px-4 py-2 text-left">Data</th>
                                    <th className="px-4 py-2 text-left">Hora Inicial</th>
                                    <th className="px-4 py-2 text-left">Hora Final</th>
                                    <th className="px-4 py-2 text-left">Auditor</th>
                                    <th className="px-4 py-2 text-left">Criador</th>
                                    <th className="px-4 py-2 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((a) => (
                                    <tr key={a.id} className="border-t">
                                        <td className="px-4 py-2">
                                            {a.loja?.name ? `${a.lojaId} - ${a.loja.name}` : a.lojaId}
                                        </td>
                                        <td className="px-4 py-2">
                                            {a.data ? format(new Date(a.data), "dd/MM/yyyy") : "-"}
                                        </td>
                                        <td className="px-4 py-2">{a.horaInicial || "-"}</td>
                                        <td className="px-4 py-2">{a.horaFinal || "-"}</td>
                                        <td className="px-4 py-2">{a.usuario?.name || a.usuarioId}</td>
                                        <td className="px-4 py-2">{a.criador?.name || a.criadorId || "-"}</td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mr-2"
                                                onClick={() => handleEdit(a)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" /> Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => handleDelete(a.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Nenhuma auditoria encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {(page - 1) * limit + 1} a{" "}
                                {Math.min(page * limit, total)} de {total} resultados
                            </div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            className={
                                                page === 1
                                                    ? "pointer-events-none opacity-50"
                                                    : "cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (page <= 3) pageNum = i + 1;
                                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = page - 2 + i;

                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    onClick={() => setPage(pageNum)}
                                                    isActive={page === pageNum}
                                                    className="cursor-pointer"
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            className={
                                                page === totalPages
                                                    ? "pointer-events-none opacity-50"
                                                    : "cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            )}

            <AuditoriaFormDialog
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (!o) setSelected(null);
                }}
                initialData={selected}
            />
        </div>
    );
}
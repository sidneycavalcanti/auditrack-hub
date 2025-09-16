// src/app/(private)/auditorias/page.tsx
"use client";

import React, { useState } from "react";
import { ClipboardList, Plus, Search, Edit, Trash2, X } from "lucide-react";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import AuditoriaFormDialog from "../auditorias/components/AuditoriaFormDialog";

import { format } from "date-fns";
import type { Auditoria, PaginatedResponse } from "@/types";

// Se seus hooks estão sob /app/(private)/auditorias/hooks (como no seu exemplo de erro do toast)
import {
    useAuditorias,
    useDeleteAuditoria,
} from "@/app/(private)/auditorias/hooks/useAuditorias";

export default function AuditoriasPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [open, setOpen] = useState(false);
    const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [auditoriaToDelete, setAuditoriaToDelete] = useState<Auditoria | null>(
        null
    );

    const { data: resp, isLoading, isFetching } = useAuditorias({
        q: search,
        page,
        limit,
    });

    const deleteMutation = useDeleteAuditoria();

    const paginatedData = resp as PaginatedResponse<Auditoria> | undefined;
    const auditorias = paginatedData?.data ?? [];
    const total = paginatedData?.total ?? 0;
    const totalPages = paginatedData?.totalPages ?? 0;

    const handleEdit = (auditoria: Auditoria) => {
        setSelectedAuditoria(auditoria);
        setOpen(true);
    };

    const handleCreate = () => {
        setSelectedAuditoria(null);
        setOpen(true);
    };

    const handleDeleteClick = (auditoria: Auditoria) => {
        setAuditoriaToDelete(auditoria);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (auditoriaToDelete) {
            await deleteMutation.mutateAsync(auditoriaToDelete.id);
            setDeleteDialogOpen(false);
            setAuditoriaToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando auditorias..." />
            </div>
        );
    }

    const clearFilters = () => {
        setSearch("");
        setPage(1);
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
                    onClick={handleCreate}
                    className="cursor-pointer"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Auditoria
                </Button>
            </div>

            {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex flex-col gap-4 sm:flex-row">
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

                        {search && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                                Limpar filtro
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {auditorias.length === 0 && !isLoading ? (
                <EmptyState
                    icon="clipboardlist"
                    title="Nenhum auditoria encontrado"
                    description={
                        search
                            ? "Nenhuma auditoria encontrado com os critérios informados."
                            : "Comece criando o primeiro usuário do sistema."
                    }
                    action={{
                        label: "Nova Auditoria",
                        onClick: handleCreate,
                    }}
                />
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
                                {auditorias.map((auditoria) => (
                                    <tr key={auditoria.id} className="border-t">
                                        <td className="px-4 py-2">
                                            {auditoria.loja?.name ? `${auditoria.lojaId} - ${auditoria.loja.name}` : auditoria.lojaId}
                                        </td>
                                        <td className="px-4 py-2">
                                            {auditoria.data ? format(new Date(auditoria.data), "dd/MM/yyyy") : "-"}
                                        </td>
                                        <td className="px-4 py-2">{auditoria.horaInicial || "-"}</td>
                                        <td className="px-4 py-2">{auditoria.horaFinal || "-"}</td>
                                        <td className="px-4 py-2">{auditoria.usuario?.name || auditoria.usuarioId}</td>
                                        <td className="px-4 py-2">{auditoria.criador?.name || auditoria.criadorId || "-"}</td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mr-2 cursor-pointer"
                                                onClick={() => handleEdit(auditoria)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" /> Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                                                onClick={() => handleDeleteClick(auditoria)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {auditorias.length === 0 && (
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
                                {Math.min(page * limit, total)} de {total} auditorias
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
                    if (!o) setSelectedAuditoria(null);
                }}
                initialData={selectedAuditoria}
            />

            {/* Confirmação de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza de que deseja excluir a auditoria da loja "
                            {auditoriaToDelete?.loja?.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="shadow-none" asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteConfirm}
                                className="bg-background border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                                title="Excluir"
                            >
                                Excluir
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
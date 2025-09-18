// FILE: src/app/(private)/motivo-perdas/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { MotivoPerda } from "@/types";

import { useDeleteMotivoPerda, useMotivoPerdas } from "./hooks/useMotivoPerdas";
import MotivoPerdasFormDialog from "./components/MotivoPerdasFormDialog";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MotivoPerdasPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMotivoPerda, setEditingMotivoPerda] = useState<MotivoPerda | undefined>();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [motivoPerdaToDelete, setMotivoPerdaToDelete] = useState<MotivoPerda | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const { data: motivoPerdaResp, isLoading, error } = useMotivoPerdas({
        name: searchTerm || undefined,
        page: page,
        limit: limit,
    });



    const deleteMutation = useDeleteMotivoPerda();

    const motivosperda = motivoPerdaResp?.data ?? [];
    const pagination = {
        total: motivoPerdaResp?.total ?? 0,
        totalPages: motivoPerdaResp?.totalPages ?? 1,
        currentPage: motivoPerdaResp?.page ?? 1,
        limit: motivoPerdaResp?.limit ?? 10,
    };

    const filteredMotivoPerdas = useMemo(() => {
        if (statusFilter === "all") return motivosperda;
        return motivosperda.filter((item) =>
            statusFilter === "active" ? item.situacao : !item.situacao
        );
    }, [motivosperda, statusFilter]);

    const handleCreate = () => {
        setEditingMotivoPerda(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (motivoPerda: MotivoPerda) => {
        setEditingMotivoPerda(motivoPerda);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (motivoPerda: MotivoPerda) => {
        setMotivoPerdaToDelete(motivoPerda);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (motivoPerdaToDelete) {
            await deleteMutation.mutateAsync(motivoPerdaToDelete.id);
            setDeleteDialogOpen(false);
            setMotivoPerdaToDelete(null);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
        } catch {
            return "Data inválida";
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando motivos de perda..." />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Motivos de Perda</h1>
                    <p className="mt-2 text-muted-foreground">
                        Gerencie os motivos de perda cadastrados no sistema
                    </p>
                </div>
                <Button onClick={handleCreate} variant="premium" className="cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Novo Motivo
                </Button>
            </div>

            {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">

                    <div className="flex flex-col gap-2 sm:flex-row">
                        {/* Busca */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Ativos</SelectItem>
                                <SelectItem value="inactive">Inativos</SelectItem>
                            </SelectContent>
                        </Select>

                        {(searchTerm || statusFilter !== "all") && (
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


            {filteredMotivoPerdas.length === 0 && !isLoading ? (
                <EmptyState
                    icon="package"
                    title="Nenhum motivo de perda encontrado"
                    description={
                        searchTerm || statusFilter !== "all"
                            ? "Nenhum motivo corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
                            : "Ainda não há motivos de perda cadastrados. Clique no botão acima para adicionar o primeiro."
                    }
                    action={
                        !searchTerm && statusFilter === "all"
                            ? { label: "Criar Primeiro Motivo", onClick: handleCreate }
                            : undefined
                    }
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-card text-muted-foreground">
                                <TableHead className="rounded-tl-md">Nome</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Observações</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="rounded-tr-md text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {motivosperda.map((motivoPerda: MotivoPerda) => {
                                return (
                                    <TableRow key={motivoPerda.id}>
                                        <TableCell className="font-medium py-1.5">{motivoPerda.name}</TableCell>
                                        <TableCell className="py-1.5">
                                            <Badge
                                                variant={motivoPerda.situacao ? "default" : "secondary"}
                                                className={
                                                    motivoPerda.situacao
                                                        ? "bg-success/10 text-success hover:bg-success/20"
                                                        : ""
                                                }
                                            >
                                                {motivoPerda.situacao ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate py-1.5">
                                            {motivoPerda.obs || "-"}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                            {motivoPerda.createdAt ? formatDate(motivoPerda.createdAt) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right py-1.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(motivoPerda)}
                                                    className="cursor-pointer"
                                                    aria-label={`Editar ${motivoPerda.name}`}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(motivoPerda)}
                                                    aria-label={`Excluir ${motivoPerda.name}`}
                                                    title="Excluir"
                                                    className="border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

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
                                )} de ${pagination.total} questões`
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


            {/* Dialog de criação/edição */}
            <MotivoPerdasFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                motivoPerda={editingMotivoPerda}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza de que deseja excluir o motivo de perda "
                            {motivoPerdaToDelete?.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="shadow-none" asChild >
                            <Button
                                variant="outline"
                                className="bg-background border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                                onClick={handleDeleteConfirm}
                                size="sm"
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
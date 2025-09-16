// FILE: src/app/(private)/categorias/page.tsx
"use client";

import React, { useState } from "react";
import { Tag, Plus, Search, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
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
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import CategoriaFormDialog from "../categorias/components/CategoriaFormDialog";
import { useCategorias, useDeleteCategoria } from "../categorias/hooks/useCategorias";
import type { Categoria } from "@/types";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CategoriasPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(
        null
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(
        null
    );

    const { data: categoriasResp, isLoading, isFetched } = useCategorias({
        name: searchTerm || undefined,
        page: page,
        limit: limit,
    });
    const deleteMutation = useDeleteCategoria();

    const categorias = categoriasResp?.data ?? [];
    const paginatedData = {
        total: categoriasResp?.total ?? 0,
        totalPages: categoriasResp?.totalPages ?? 1,
        currentPage: categoriasResp?.page ?? 1,
        limit: categoriasResp?.limit ?? 10
    }

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1);
    };

    // a API retorna { cats: Categoria[] }
    const categoriasArray: Categoria[] = (categoriasResp as any)?.cats ?? [];

    const handleEdit = (categoria: Categoria) => {
        setSelectedCategoria(categoria);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedCategoria(null);
        setDialogOpen(true);
    };

    const handleDeleteClick = (categoria: Categoria) => {
        setCategoriaToDelete(categoria);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (categoriaToDelete) {
            await deleteMutation.mutateAsync(categoriaToDelete.id);
            setDeleteDialogOpen(false);
            setCategoriaToDelete(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        try {
            return formatDistance(new Date(dateString), new Date(), {
                addSuffix: true,
                locale: ptBR,
            });
        } catch {
            return "-";
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando categorias..." />
            </div>
        );
    }

    const clearFilters = () => {
        setSearchTerm("");
        setPage(1);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                        <Tag className="h-8 w-8" />
                        Categorias
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie as categorias de usuários do sistema
                    </p>
                </div>

                <Button className="cursor-pointer" variant="premium" size="lg" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            {/* Busca */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar categorias..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {searchTerm && (
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

            {/* Lista / Empty */}
            {categorias.length === 0 && !isLoading ? (
                <EmptyState
                    icon="package"
                    title="Nenhuma categoria encontrada"
                    description={
                        searchTerm
                            ? "Nenhuma categoria encontrada com os critérios informados."
                            : "Comece criando a primeira categoria do sistema."
                    }
                    action={{
                        label: "Nova Categoria",
                        onClick: handleCreate,
                    }}
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 text-muted-foreground">
                                <TableHead>Nome</TableHead>
                                <TableHead>Criada em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categorias.map((categoria: Categoria) => {
                                return (
                                    <TableRow key={categoria.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-primary/10 p-2">
                                                    <Tag className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{categoria.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        ID: {categoria.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(categoria.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => handleEdit(categoria)}
                                                    aria-label={`Editar ${categoria.name}`}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(categoria)}
                                                    aria-label={`Excluir ${categoria.name}`}
                                                    title="Excluir"
                                                    className="border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>


                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Paginação */}
            {paginatedData.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
                    {/* Contagem */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {paginatedData.total > 0
                                ? `Mostrando ${(paginatedData.currentPage - 1) * paginatedData.limit + 1
                                } a ${Math.min(
                                    paginatedData.currentPage * paginatedData.limit,
                                    paginatedData.total
                                )} de ${paginatedData.total} usuários`
                                : "Nenhuma questão encontrada"}
                        </p>
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        setPage(Math.max(1, paginatedData.currentPage - 1))
                                    }
                                    className={
                                        paginatedData.currentPage === 1
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>

                            {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (paginatedData.totalPages <= 5) pageNum = i + 1;
                                else if (paginatedData.currentPage <= 3) pageNum = i + 1;
                                else if (paginatedData.currentPage >= paginatedData.totalPages - 2)
                                    pageNum = paginatedData.totalPages - 4 + i;
                                else pageNum = paginatedData.currentPage - 2 + i;

                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            onClick={() => setPage(pageNum)}
                                            isActive={paginatedData.currentPage === pageNum}
                                            className="cursor-pointer"
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        setPage(Math.min(paginatedData.totalPages, paginatedData.currentPage + 1))
                                    }
                                    className={
                                        paginatedData.currentPage === paginatedData.totalPages
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <CategoriaFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedCategoria(null);
                }}
                initialData={selectedCategoria}
            />

            {/* Confirmação de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria "
                            {categoriaToDelete?.name}"? Esta ação não pode ser desfeita e pode
                            afetar usuários que utilizam esta categoria.
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
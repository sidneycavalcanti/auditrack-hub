// FILE: src/app/(private)/lojas/page.tsx
"use client";

import React, { useState } from "react";
import { Store, Plus, Search, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useLojas, useDeleteLoja } from "../lojas/hooks/useLojas";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { Loja, PaginatedResponse } from "@/types";
import LojaFormDialog from "../lojas/components/LojaFormDialog";

export default function LojasPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data: response, isLoading, error, isFetching } = useLojas({
        search: searchTerm,
        page: currentPage,
        limit: pageSize,
    });
    const { mutate: deleteLoja } = useDeleteLoja();

    const paginatedData = response as PaginatedResponse<Loja> | undefined;
    const lojas = paginatedData?.data ?? [];
    const totalItems = paginatedData?.total ?? 0;
    const totalPages = paginatedData?.totalPages ?? 0;

    const handleEdit = (loja: Loja) => {
        setSelectedLoja(loja);
        setDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Tem certeza que deseja excluir esta loja?")) {
            deleteLoja(id);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => setCurrentPage(page);

    const handlePageSizeChange = (size: string) => {
        setPageSize(Number(size));
        setCurrentPage(1);
    };

    if (isLoading && !isFetching) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando lojas..." />
            </div>
        );
    }

    return (
        <div className="space-y-3">
        {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                        <Store className="h-8 w-8" />
                        Lojas
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie as lojas cadastradas no sistema
                    </p>
                </div>

                <Button
                    variant="premium"
                    size="lg"
                    onClick={() => {
                        setSelectedLoja(null);
                        setDialogOpen(true);
                    }}
                    >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Loja
                </Button>
            </div>

            {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Buscar por código ou descrição..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="6">6 por página</SelectItem>
                                <SelectItem value="9">9 por página</SelectItem>
                                <SelectItem value="18">18 por página</SelectItem>
                                <SelectItem value="36">36 por página</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Loading (refetch) */}
            {isFetching && (
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" text="Atualizando..." />
                </div>
            )}

            {/* Lista */}
            {lojas.length === 0 && !isLoading ? (
                <EmptyState
                    icon="package"
                    title="Nenhuma loja encontrada"
                    description={
                        searchTerm
                            ? "Não encontramos lojas com os filtros aplicados. Tente uma busca diferente."
                            : "Ainda não há lojas cadastradas. Clique em 'Nova Loja' para começar."
                    }
                    action={{
                        label: "Nova Loja",
                        onClick: () => {
                            setSelectedLoja(null);
                            setDialogOpen(true);
                        },
                    }}
                />
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {lojas.map((loja) => (
                            <Card
                                key={loja.id}
                                className="bg-gradient-card shadow-card transition-smooth hover:shadow-hover"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{loja.descricao}</CardTitle>
                                            <CardDescription>Código: {loja.codigo}</CardDescription>
                                        </div>

                                        <Badge variant={loja.ativa ? "default" : "secondary"}>
                                            {loja.ativa ? "Ativa" : "Inativa"}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {loja.luc && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                LUC: {loja.luc}
                                            </div>
                                        )}

                                        {loja.piso && (
                                            <div className="text-sm text-muted-foreground">
                                                Piso: {loja.piso}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(loja)}
                                                className="flex-1"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(loja.id)}
                                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                aria-label={`Excluir loja ${loja.descricao}`}
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalItems)} a{" "}
                                {Math.min(currentPage * pageSize, totalItems)} de {totalItems} resultados
                            </div>

                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                handlePageChange(Math.max(1, currentPage - 1))
                                            }
                                            className={
                                                currentPage === 1
                                                    ? "pointer-events-none opacity-50"
                                                    : "cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2)
                                            pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    onClick={() => handlePageChange(pageNum)}
                                                    isActive={currentPage === pageNum}
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
                                                handlePageChange(Math.min(totalPages, currentPage + 1))
                                            }
                                            className={
                                                currentPage === totalPages
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

            {/* Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Store className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                                <p className="text-sm text-muted-foreground">Total de Lojas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-success/10 p-2">
                                <Store className="h-6 w-6 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {lojas.filter((l) => l.ativa).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Lojas Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-warning/10 p-2">
                                <Store className="h-6 w-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {lojas.filter((l) => !l.ativa).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Lojas Inativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-accent/50 p-2">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {
                                        new Set(lojas.map((l) => l.luc).filter(Boolean) as string[])
                                        .size
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">Localizações</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <LojaFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedLoja(null);
                }}
                initialData={selectedLoja}
            />
        </div>
    );
}
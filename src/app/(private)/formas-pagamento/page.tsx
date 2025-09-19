// FILE: src/app/(private)/formas-pagamento/page.tsx
"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { FormaPagamentoFormDialog } from "./components/FormaPagamentoFormDialog";
import {
    useFormasPagamento,
    useDeleteFormaPagamento,
} from "./hooks/useFormasPagamento";
import type { FormaPagamento } from "@/types";

export default function FormasPagamentoPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<FormaPagamento | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formaPagamentoToDelete, setFormaPagamentoToDelete] = useState<FormaPagamento | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const filters = searchTerm ? { name: searchTerm } : {};

    const { data: formasPagamentoResp, isLoading, error } = useFormasPagamento({
        name: searchTerm || undefined,
        page: page,
        limit: limit,
    });

    // const formasPagamento: FormaPagamento[] = (formasPagamentoResp as any)?.formadepagamento ?? [];

    const deleteMutation = useDeleteFormaPagamento();

    const formasdepagamento = formasPagamentoResp?.data ?? []
    const paginatedData = {
        total: formasPagamentoResp?.total ?? 0,
        totalPages: formasPagamentoResp?.totalPages ?? 1,
        currentPage: formasPagamentoResp?.page ?? 1,
        limit: formasPagamentoResp?.limit ?? 10
    }

    const handleCreate = () => {
        setSelectedFormaPagamento(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (formaPagamento: FormaPagamento) => {
        setSelectedFormaPagamento(formaPagamento);
        setIsFormDialogOpen(true);
    };

    const handleDeleteClick = (formaPagamento: FormaPagamento) => {
        setFormaPagamentoToDelete(formaPagamento);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (formaPagamentoToDelete) {
            await deleteMutation.mutateAsync(formaPagamentoToDelete.id);
            setDeleteDialogOpen(false);
            setFormaPagamentoToDelete(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("pt-BR");
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando formas de pagamento..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <EmptyState
                    title="Erro ao carregar formas de pagamento"
                    description="Não foi possível carregar a lista de formas de pagamento. Tente novamente."
                />
            </div>
        );
    }

    const clearFilters = () => {
        setSearchTerm("");
        setPage(1);
    };

    return (
        <div className="space-y-3 pb-2">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                        Formas de Pagamento
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie as formas de pagamento do sistema
                    </p>
                </div>
                <Button className="cursor-pointer" variant="premium" size="lg" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Forma de Pagamento
                </Button>
            </div>

            {/* Busca */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar forma de pagamento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
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

            {formasdepagamento.length === 0 && !isLoading ? (
                <EmptyState
                    title="Nenhuma forma de pagamento encontrada"
                    description={
                        searchTerm
                            ? "Não foram encontradas formas de pagamento com os critérios de busca."
                            : "Ainda não há formas de pagamento cadastradas. Clique em 'Nova Forma de Pagamento' para começar."
                    }
                    action={{ label: "Nova Forma de Pagamento", onClick: handleCreate }}
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-card text-muted-foreground">
                                <TableHead className="rounded-tl-md">Nome</TableHead>
                                <TableHead>Situação</TableHead>
                                <TableHead>Data de Criação</TableHead>
                                <TableHead className="rounded-tr-md text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formasdepagamento.map((fp: FormaPagamento) => {
                                return (
                                    <TableRow key={fp.id}>
                                        <TableCell className="font-medium py-1.5">{fp.name}</TableCell>
                                        <TableCell className="py-1.5">
                                            <Badge variant={fp.situacao ? "default" : "secondary"}
                                                className={
                                                    fp.situacao
                                                        ? "bg-success/10 text-success hover:bg-success/20"
                                                        : ""
                                                }
                                            >
                                                {fp.situacao ? "Ativa" : "Inativa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-1.5">{formatDate(fp.createdAt)}</TableCell>
                                        <TableCell className="py-1.5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => handleEdit(fp)}
                                                    aria-label={`Editar ${fp.name}`}
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(fp)}
                                                    aria-label={`Excluir ${fp.name}`}
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
            {paginatedData.totalPages >= 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
                    {/* Contagem */}
                    <div className="flex items-center justify-between">
                        <p className="flex-wrap md:max-w-48 text-xs text-muted-foreground">
                            {paginatedData.total > 0
                                ? `Mostrando ${(paginatedData.currentPage - 1) * paginatedData.limit + 1
                                } a ${Math.min(
                                    paginatedData.currentPage * paginatedData.limit,
                                    paginatedData.total
                                )} de ${paginatedData.total} formas de pagamento`
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

            {/* Dialog de criação/edição */}
            <FormaPagamentoFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                formaPagamento={selectedFormaPagamento}
            />

            {/* Dialog de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a forma de pagamento "
                            {formaPagamentoToDelete?.name}"? Esta ação não pode ser desfeita.
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
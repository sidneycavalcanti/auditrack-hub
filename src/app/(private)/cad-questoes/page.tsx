// FILE: src/app/(private)/cad-questoes/page.tsx
"use client";

import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
// ⚠️ Import do form dialog pelo caminho relativo da rota
import CadQuestoesFormDialog from "./components/CadQuestoesFormDialog";

import { useCadQuestoes, useDeleteCadQuestoes } from "./hooks/useCadQuestoes";
import { useCadAvOperacional } from "../cad-av-operacional/hooks/useCadAvOperacional";
import type { CadQuestoes } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function CadQuestoesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [selectedAvOperacional, setSelectedAvOperacional] = useState<string>(
        ""
    );
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editingQuestao, setEditingQuestao] = useState<CadQuestoes | null>(
        null
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [questaoToDelete, setQuestaoToDelete] = useState<CadQuestoes | null>(
        null
    );

    // Data hooks
    const { data: questoesData, isLoading, error } = useCadQuestoes({
        page,
        limit,
        name: searchTerm || undefined,
        cadavoperacionalId: selectedAvOperacional
        ? Number(selectedAvOperacional)
        : undefined,
    });

    const { data: avaliacoesOperacionais } = useCadAvOperacional();
    const deleteMutation = useDeleteCadQuestoes();

    // Handlers
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1);
    };

    const handleEdit = (questao: CadQuestoes) => {
        setEditingQuestao(questao);
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (questao: CadQuestoes) => {
        setQuestaoToDelete(questao);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (questaoToDelete) {
            await deleteMutation.mutateAsync(questaoToDelete.id);
            setDeleteDialogOpen(false);
            setQuestaoToDelete(null);
        }
    };

    const handleFilterChange = (value: string) => {
        setSelectedAvOperacional(value === "all" ? "" : value);
        setPage(1);
    };

    if (isLoading) return <LoadingSpinner size="lg" text="Carregando questões cadastradas" />;

    if (error) {
        return (
            <div className="text-center text-red-500">
                Erro ao carregar questões: {(error as any)?.message ?? "desconhecido"}
            </div>
        );
    }

    const questoes = questoesData?.data ?? [];
    const pagination = {
        total: questoesData?.total ?? 0,
        totalPages: questoesData?.totalPages ?? 1,
        currentPage: questoesData?.page ?? 1,
        limit: questoesData?.limit ?? 10,
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Cadastro de Questões</h1>
                    <p className="text-muted-foreground">
                        Gerencie as questões do sistema de auditoria
                    </p>
                </div>
                {/* Novo */}
                <Button onClick={() => setFormDialogOpen(true)} variant="premium">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Questão
                </Button>
            </div>

            {/* Filtros e Ações */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        {/* Busca */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Buscar questões..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filtro por Avaliação Operacional */}
                        <div>
                            <Select
                                value={selectedAvOperacional || "all"}
                                onValueChange={handleFilterChange}
                            >
                                <SelectTrigger>
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filtrar por Avaliação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Avaliações</SelectItem>
                                    {avaliacoesOperacionais?.data?.map((av: any) => (
                                        <SelectItem key={av.id} value={av.id.toString()}>
                                            {av.descricao}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela */}            
            {questoes.length === 0 ? (
                <EmptyState
                    title="Nenhuma questão encontrada"
                    description="Não há questões cadastradas ou que correspondam aos filtros aplicados."
                    action={{
                        label: "Cadastrar Primeira Questão",
                        onClick: () => setFormDialogOpen(true),
                    }}
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 text-muted-foreground">
                                <TableHead>ID</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Avaliação Operacional</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data de Criação</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {questoes.map((questao: CadQuestoes) => (
                                <TableRow key={questao.id}>
                                    <TableCell className="font-medium">#{questao.id}</TableCell>
                                    <TableCell>
                                        <p className="font-medium text-wrap">{questao.name}</p>
                                    </TableCell>
                                    <TableCell>
                                        {questao.cadavoperacional ? (
                                            <Badge variant="secondary">
                                                {questao.cadavoperacional.descricao}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={questao.situacao ? "default" : "secondary"}>
                                            {questao.situacao ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {questao.createdAt && (
                                            <span className="text-muted-foreground">
                                                {format(new Date(questao.createdAt), "dd/MM/yyyy", {
                                                    locale: ptBR,
                                                })}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEdit(questao)}
                                                aria-label={`Editar ${questao.name}`}
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDeleteClick(questao)}
                                                className="text-destructive hover:text-destructive"
                                                aria-label={`Excluir ${questao.name}`}
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Paginação */}
            {pagination.totalPages > 1 && (                    
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
                    {/* Contagem */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {pagination.total > 0
                                ? `Mostrando ${
                                    (pagination.currentPage - 1) * pagination.limit + 1
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

            {/* Form Dialog */}
            <CadQuestoesFormDialog
                open={formDialogOpen}
                onOpenChange={(open) => {
                    setFormDialogOpen(open);
                    if (!open) setEditingQuestao(null);
                }}
                questao={editingQuestao}
            />

            {/* Confirmação de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza de que deseja excluir a questão "
                            {questaoToDelete?.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
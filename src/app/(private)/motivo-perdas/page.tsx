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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { MotivoPerda } from "@/types";

// ⚠️ imports atualizados para a nova estrutura
import { useMotivoPerdas } from "./hooks/useMotivoPerdas";
import MotivoPerdasFormDialog from "./components/MotivoPerdasFormDialog";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MotivoPerdasPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMotivoPerda, setEditingMotivoPerda] = useState<
        MotivoPerda | undefined
    >();
    const [currentPage, setCurrentPage] = useState(1);

    const filters = useMemo(
        () => ({
            page: currentPage,
            limit: 10,
            search: searchTerm || undefined, // <- usar 'search' aqui
        }),
        [currentPage, searchTerm]
    );    

    const {
        motivoPerdas,
        totalItems,
        totalPages,
        isLoading,
        createMotivoPerda,
        updateMotivoPerda,
        deleteMotivoPerda,
        isCreating,
        isUpdating,
        isDeleting,
    } = useMotivoPerdas(filters);

    const filteredMotivoPerdas = useMemo(() => {
        if (statusFilter === "all") return motivoPerdas;
        return motivoPerdas.filter((item) =>
            statusFilter === "active" ? item.situacao : !item.situacao
        );
    }, [motivoPerdas, statusFilter]);    

    const handleCreate = () => {
        setEditingMotivoPerda(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (motivoPerda: MotivoPerda) => {
        setEditingMotivoPerda(motivoPerda);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (
        data: Omit<MotivoPerda, "id" | "createdAt" | "updatedAt">
    ) => {
        if (editingMotivoPerda) {
            await updateMotivoPerda({ id: editingMotivoPerda.id, data });
        } else {
            await createMotivoPerda(data);
        }
    };

    const handleDelete = async (id: number) => {
        await deleteMotivoPerda(id);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setCurrentPage(1);
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
            <div className="flex min-h-[400px] items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando motivos de perda..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Motivos de Perda</h1>
                    <p className="mt-2 text-muted-foreground">
                        Gerencie os motivos de perda cadastrados no sistema
                    </p>
                </div>
                <Button onClick={handleCreate} variant="premium" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Motivo
                </Button>
            </div>

            {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-4">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex w-full items-center gap-4 md:w-auto">
                            <div className="relative flex-1 md:max-w-sm">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                                    className="flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Limpar
                                </Button>
                            )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {totalItems} {totalItems === 1 ? "motivo encontrado" : "motivos encontrados"}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {filteredMotivoPerdas.length === 0 ? (
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
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Observações</TableHead>
                                        <TableHead>Criado em</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMotivoPerdas.map((motivoPerda: MotivoPerda) => (
                                        <TableRow key={motivoPerda.id}>
                                            <TableCell className="font-medium">{motivoPerda.name}</TableCell>
                                            <TableCell>
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
                                            <TableCell className="max-w-xs truncate">
                                                {motivoPerda.obs || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {motivoPerda.createdAt ? formatDate(motivoPerda.createdAt) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(motivoPerda)}
                                                        className="h-8 w-8 p-0"
                                                        aria-label={`Editar ${motivoPerda.name}`}
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                disabled={isDeleting}
                                                                aria-label={`Excluir ${motivoPerda.name}`}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza de que deseja excluir o motivo de perda "
                                                                    {motivoPerda.name}"? Esta ação não pode ser desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(motivoPerda.id)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de criação/edição */}
            <MotivoPerdasFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                motivoPerda={editingMotivoPerda}
                onSubmit={handleSubmit}
                isSubmitting={isCreating || isUpdating}
            />
        </div>
    );
}
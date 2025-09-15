// FILE: src/app/(private)/motivo-pausas/page.tsx
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
import type { MotivoDepausa } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ✅ imports atualizados para a estrutura dentro da rota
import { useMotivoDePausa } from "./hooks/useMotivoPausas";
import MotivoDePausaFormDialog from "./components/MotivoDePausaFormDialog";

export default function MotivoDepausaPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMotivoDepausa, setEditingMotivoDepausa] = useState<
        MotivoDepausa | undefined
    >();
    const [currentPage, setCurrentPage] = useState(1);

    const filters = useMemo(
        () => ({
            page: currentPage,
            limit: 10,
            name: searchTerm || undefined,
        }),
        [currentPage, searchTerm]
    );

    const {
        motivosDePausa,
        totalItems,
        totalPages,
        isLoading,
        createMotivoDepausa,
        updateMotivoDepausa,
        deleteMotivoDepausa,
        isCreating,
        isUpdating,
        isDeleting,
    } = useMotivoDePausa(filters);

    const filteredMotivosDePausa = useMemo(() => {
        if (statusFilter === "all") return motivosDePausa;
        return motivosDePausa.filter((item) =>
            statusFilter === "active" ? item.situacao : !item.situacao
        );
    }, [motivosDePausa, statusFilter]);

    const handleCreate = () => {
        setEditingMotivoDepausa(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (motivoDepausa: MotivoDepausa) => {
        setEditingMotivoDepausa(motivoDepausa);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (
        data: Omit<MotivoDepausa, "id" | "createdAt" | "updatedAt">
    ) => {
        if (editingMotivoDepausa) {
            await updateMotivoDepausa({ id: editingMotivoDepausa.id, data });
        } else {
            await createMotivoDepausa(data);
        }
    };

    const handleDelete = async (id: number) => {
        await deleteMotivoDepausa(id);
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
                <LoadingSpinner size="lg" text="Carregando motivos de pausa..." />
            </div>
        );
    }

    return (
        <div className="space-y-3">
        {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Motivos de Pausa</h1>
                    <p className="mt-2 text-muted-foreground">
                        Gerencie os motivos de pausa cadastrados no sistema
                    </p>
                </div>
                <Button onClick={handleCreate} variant="premium" className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Novo Motivo
                </Button>
            </div>

        {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    {/* <div className="flex flex-col items-center justify-between gap-4 md:flex-row"> */}
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
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
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                    Limpar
                                </Button>
                            )}

                            <div className="flex items-center text-sm text-muted-foreground">
                                {totalItems} {totalItems === 1 ? "motivo encontrado" : "motivos encontrados"}
                            </div>
                        </div>

                        
                    {/* </div> */}
                </CardContent>
            </Card>
            {filteredMotivosDePausa.length === 0 ? (
                <EmptyState
                    icon="package"
                    title="Nenhum motivo de pausa encontrado"
                    description={
                        searchTerm || statusFilter !== "all"
                            ? "Nenhum motivo corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
                            : "Ainda não há motivos de pausa cadastrados. Clique no botão acima para adicionar o primeiro."
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
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMotivosDePausa.map((motivoDepausa: MotivoDepausa) => (
                                <TableRow key={motivoDepausa.id}>
                                    <TableCell className="font-medium">{motivoDepausa.name}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={motivoDepausa.situacao ? "default" : "secondary"}
                                            className={
                                                motivoDepausa.situacao
                                                    ? "bg-success/10 text-success hover:bg-success/20"
                                                    : ""
                                            }
                                        >
                                            {motivoDepausa.situacao ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {motivoDepausa.createdAt ? formatDate(motivoDepausa.createdAt) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(motivoDepausa)}
                                                className="h-8 w-8 p-0 cursor-pointer"
                                                aria-label={`Editar ${motivoDepausa.name}`}
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive cursor-pointer"
                                                        disabled={isDeleting}
                                                        aria-label={`Excluir ${motivoDepausa.name}`}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem certeza de que deseja excluir o motivo de pausa "
                                                            {motivoDepausa.name}"? Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(motivoDepausa.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
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

            {/* Dialog de criação/edição */}
            <MotivoDePausaFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                motivoDepausa={editingMotivoDepausa}
                onSubmit={handleSubmit}
                isSubmitting={isCreating || isUpdating}
            />
        </div>
    );
}
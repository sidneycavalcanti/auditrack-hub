// FILE: src/app/(private)/categorias/page.tsx
"use client";

import React, { useState } from "react";
import { Tag, Plus, Search, Edit, Trash2 } from "lucide-react";
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

    const { data: categoriasResp, isLoading } = useCategorias({
        name: searchTerm,
        limit: 50,
    });
    const { mutate: deleteCategoria } = useDeleteCategoria();

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

    const handleDelete = (id: number) => {
        deleteCategoria(id);
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
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando categorias..." />
            </div>
        );
    }

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

                <Button variant="premium" size="lg" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            {/* Busca */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar categorias..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista / Empty */}
            {categoriasArray.length === 0 ? (
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
                <Card className="bg-gradient-card shadow-card">
                    <CardHeader>
                        <CardTitle>Categorias Cadastradas</CardTitle>
                        <CardDescription>
                            {categoriasArray.length} categoria
                            {categoriasArray.length !== 1 ? "s" : ""} encontrada
                            {categoriasArray.length !== 1 ? "s" : ""}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Criada em</TableHead>
                                    <TableHead>Atualizada em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoriasArray.map((categoria) => (
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
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(categoria.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(categoria)}
                                                    aria-label={`Editar ${categoria.name}`}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button 
                                                            variant="outline"
                                                            size="sm" aria-label="Excluir"
                                                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tem certeza que deseja excluir a categoria "
                                                                {categoria.name}"? Esta ação não pode ser desfeita e pode
                                                                afetar usuários que utilizam esta categoria.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(categoria.id)}
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
                    </CardContent>
                </Card>
            )}

            <CategoriaFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedCategoria(null);
                }}
                initialData={selectedCategoria}
            />
        </div>
    );
}
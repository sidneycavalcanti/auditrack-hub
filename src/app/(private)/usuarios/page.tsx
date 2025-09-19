// FILE: src/app/(private)/usuarios/page.tsx
"use client";

import React, { useState } from "react";
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    Shield,
    User as UserIcon,
    X,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import UsuarioFormDialog from "../usuarios/components/UsuarioFormDialog";
import { useUsuarios, useDeleteUsuario } from "../usuarios/hooks/useUsuarios";
import type { User, PaginatedResponse } from "@/types";

export default function UsuariosPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimitSize] = useState(10);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<User | null>(
        null
    );


    const { data: usuariosResp, isLoading, error, isFetching } = useUsuarios({
        name: searchTerm || undefined,
        page: page,
        limit: limit
    });
    const deleteMutation = useDeleteUsuario();

    const usuarios = usuariosResp?.data ?? [];
    const paginatedData = {
        total: usuariosResp?.total ?? 0,
        totalPages: usuariosResp?.totalPages ?? 1,
        currentPage: usuariosResp?.page ?? 1,
        limit: usuariosResp?.limit ?? 10
    }

    // a API retorna { users: User[] }
    // const usuariosArray: User[] = (usuariosResp as any)?.users ?? [];

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPage(1);
    };

    const handleEdit = (usuario: User) => {
        setSelectedUsuario(usuario);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedUsuario(null);
        setDialogOpen(true);
    };

    const handleDeleteClick = (usuario: User) => {
        setUsuarioToDelete(usuario);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (usuarioToDelete) {
            await deleteMutation.mutateAsync(usuarioToDelete.id);
            setDeleteDialogOpen(false);
            setUsuarioToDelete(null);
        }
    };

    const getCategoryIcon = (categoria?: string) => {
        switch (categoria?.toLowerCase()) {
            case "administrador":
                return Shield;
            default:
                return UserIcon;
        }
    };

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando usuários..." />
            </div>
        );
    }

    const clearFilters = () => {
        setSearchTerm("");
        setPage(1);
        setLimitSize(10)
    };

    return (
        <div className="space-y-3 pb-2">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                        <Users className="h-8 w-8" />
                        Usuários
                    </h1>
                    <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
                </div>

                <Button variant="premium" size="lg" onClick={handleCreate} className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Usuário
                </Button>
            </div>

            {/* Busca */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuários..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
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

            {/* Lista / Empty */}
            {usuarios.length === 0 && !isLoading ? (
                <EmptyState
                    icon="users"
                    title="Nenhum usuário encontrado"
                    description={
                        searchTerm
                            ? "Nenhum usuário encontrado com os critérios informados."
                            : "Comece criando o primeiro usuário do sistema."
                    }
                    action={{
                        label: "Novo Usuário",
                        onClick: handleCreate,
                    }}
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-card text-muted-foreground">
                                <TableHead className="rounded-tl-md">Usuário</TableHead>
                                <TableHead>Nome de usuário</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="rounded-tr-md text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usuarios.map((usuario: User) => {
                                const Icon = getCategoryIcon(usuario.categoria?.name);
                                return (
                                    <TableRow key={usuario.id}>
                                        <TableCell className="py-1.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(usuario.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{usuario.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        ID: {usuario.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-mono py-1.5">
                                            {usuario.username}
                                        </TableCell>

                                        <TableCell className="py-1.5">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                <span>{usuario.categoria?.name ?? "Sem categoria"}</span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-1.5">
                                            <Badge variant={usuario.situacao ? "default" : "secondary"}
                                                className={
                                                    usuario.situacao
                                                        ? "bg-success/10 text-success hover:bg-success/20"
                                                        : ""
                                                }
                                            >
                                                {usuario.situacao ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right py-1.5">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => handleEdit(usuario)}
                                                    aria-label={`Editar ${usuario.name}`}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(usuario)}
                                                    aria-label={`Excluir ${usuario.name}`}
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

            <UsuarioFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedUsuario(null);
                }}
                initialData={selectedUsuario}
            />

            {/* Confirmação de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza de que deseja excluir o usuário "
                            {usuarioToDelete?.name}"? Esta ação não pode ser desfeita.
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
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
} from "lucide-react";
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
import type { User } from "@/types";

export default function UsuariosPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data: usuariosResp, isLoading } = useUsuarios({
        name: searchTerm,
        limit: 50,
    });
    const { mutate: deleteUsuario } = useDeleteUsuario();

    // a API retorna { users: User[] }
    const usuariosArray: User[] = (usuariosResp as any)?.users ?? [];

    const handleEdit = (usuario: User) => {
        setSelectedUsuario(usuario);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedUsuario(null);
        setDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
            deleteUsuario(id);
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
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando usuários..." />
            </div>
        );
    }

    return (
        <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                    <Users className="h-8 w-8" />
                    Usuários
                </h1>
                <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
            </div>

            <Button variant="premium" size="lg" onClick={handleCreate}>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Lista / Empty */}
        {usuariosArray.length === 0 ? (
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
            <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                    <CardTitle>Usuários Cadastrados</CardTitle>
                    <CardDescription>
                        {usuariosArray.length} usuário
                        {usuariosArray.length !== 1 ? "s" : ""} encontrado
                        {usuariosArray.length !== 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Nome de usuário</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usuariosArray.map((usuario) => {
                            const Icon = getCategoryIcon(usuario.categoria?.name);
                            return (
                                <TableRow key={usuario.id}>
                                    <TableCell>
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

                                    <TableCell className="font-mono">
                                        {usuario.username}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span>{usuario.categoria?.name ?? "Sem categoria"}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge variant={usuario.situacao ? "default" : "secondary"}>
                                            {usuario.situacao ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(usuario)}
                                                aria-label={`Editar ${usuario.name}`}
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(usuario.id)}
                                                aria-label={`Excluir ${usuario.name}`}
                                                title="Excluir"
                                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
                </CardContent>
            </Card>
        )}

        <UsuarioFormDialog
            open={dialogOpen}
            onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedUsuario(null);
            }}
            initialData={selectedUsuario}
        />
        </div>
    );
}
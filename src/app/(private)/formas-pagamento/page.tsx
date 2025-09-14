// FILE: src/app/(private)/formas-pagamento/page.tsx
"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
// ⚠️ Importe o dialog do caminho relativo da própria rota:
import { FormaPagamentoFormDialog } from "./components/FormaPagamentoFormDialog";
import {
    useFormasPagamento,
    useDeleteFormaPagamento,
} from "./hooks/useFormasPagamento";
import type { FormaPagamento } from "@/types";

export default function FormasPagamentoPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedFormaPagamento, setSelectedFormaPagamento] =
        useState<FormaPagamento | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formaPagamentoToDelete, setFormaPagamentoToDelete] =
        useState<FormaPagamento | null>(null);

    const filters = searchTerm ? { name: searchTerm } : {};
    const { data: formasPagamentoResp, isLoading, error } = useFormasPagamento(filters);

    const formasPagamento: FormaPagamento[] = (formasPagamentoResp ?? []) as FormaPagamento[];

    const deleteMutation = useDeleteFormaPagamento();

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
            <div className="flex min-h-[400px] items-center justify-center">
                <LoadingSpinner />
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

    return (
        <div className="space-y-3">
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
                <Button variant="premium" size="lg" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Forma de Pagamento
                </Button>
            </div>

            {/* Busca */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="px-6 py-0">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar forma de pagamento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
                
            {formasPagamento.length === 0 ? (
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
                <Card className="bg-gradient-card shadow-card">
                    <CardHeader>
                        <CardTitle>Forma de pagamentos Cadastradas</CardTitle>
                        <CardDescription>
                            {formasPagamento.length} forma de pagamento
                            {formasPagamento.length !== 1 ? "s" : ""} encontrada
                            {formasPagamento.length !== 1 ? "s" : ""}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Situação</TableHead>
                                    <TableHead>Data de Criação</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {formasPagamento.map((fp) => (
                                    <TableRow key={fp.id}>
                                        <TableCell className="font-medium">{fp.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={fp.situacao ? "default" : "secondary"}>
                                                {fp.situacao ? "Ativa" : "Inativa"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(fp.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
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
                                                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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
// FILE: src/app/(private)/cad-av-operacional/page.tsx
"use client";

import React, { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCadAvOperacional,
  useDeleteCadAvOperacional,
} from "./hooks/useCadAvOperacional";
// ⚠️ importe o dialog pelo caminho RELATIVO da rota:
import CadAvOperacionalFormDialog from "./components/CadAvOperacionalFormDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { CadAvOperacional } from "@/types";
import { format } from "date-fns";

export default function CadAvOperacionalPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CadAvOperacional | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CadAvOperacional | null>(
    null
  );

  const { data: response, isLoading, error } = useCadAvOperacional({
    q: searchTerm,
    limit: 100,
  });

  const { mutate: deleteItem, isPending: deleting } =
    useDeleteCadAvOperacional();

  const items: CadAvOperacional[] = response?.data ?? [];
  const filteredItems = items.filter((item) =>
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: CadAvOperacional) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleDelete = (item: CadAvOperacional) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
      });
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedItem(null);
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">
          Erro ao carregar avaliações operacionais
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Avaliações Operacionais
          </h1>
          <p className="text-muted-foreground">
            Gerencie os cadastros de avaliações operacionais
          </p>
        </div>
        <Button variant="premium" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Lista de Avaliações Operacionais</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhuma avaliação operacional encontrada"
              description={
                searchTerm
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando uma nova avaliação operacional"
              }
              action={{
                label: "Nova Avaliação",
                onClick: () => setFormOpen(true),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: CadAvOperacional) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={item.situacao ? "default" : "secondary"}>
                        {item.situacao ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.createdAt
                        ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          aria-label={`Editar ${item.descricao}`}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          aria-label={`Excluir ${item.descricao}`}
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
          )}
        </CardContent>
      </Card>

      <CadAvOperacionalFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        initialData={selectedItem}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a avaliação operacional "
              {itemToDelete?.descricao}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
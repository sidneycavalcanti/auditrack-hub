// FILE: src/app/(private)/cad-av-operacional/page.tsx
"use client";

import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedAvaliacaoOper, setSelectedAvaliacaoOper] = useState<CadAvOperacional | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CadAvOperacional | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: cadAvOperResponse, isLoading, error } = useCadAvOperacional({
    name: searchTerm || undefined,
    page: page,
    limit: limit,
  });

  const deleteMutation = useDeleteCadAvOperacional();

  const cadastrosAvOperacional = cadAvOperResponse?.data ?? [];
  const paginatedData = {
    total: cadAvOperResponse?.total ?? 0,
    totalPages: cadAvOperResponse?.totalPages ?? 0,
    currentPage: cadAvOperResponse?.page ?? 1,
    limit: cadAvOperResponse?.limit ?? 10
  }

  const handleCreate = () => {
    setSelectedAvaliacaoOper(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (item: CadAvOperacional) => {
    setSelectedAvaliacaoOper(item);
    setIsFormDialogOpen(true);
  };

  const handleDeleteClick = (item: CadAvOperacional) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando avaliações operacional..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        < EmptyState
          title="Erro ao carregar avaliação operacional"
          description="Não foi possível carregar a lista de avaliação operacional. Tente novamente."
        />
      </div>
    );
  }

  const clearFilters = () => {
    setSearchTerm("");
    setPage(1);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
            Avaliações Operacionais
          </h1>
          <p className="text-muted-foreground">
            Gerencie os cadastros de avaliações operacionais
          </p>
        </div>
        <Button className="cursor-pointer" variant="premium" size="lg" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="px-6 py-0">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
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

      {cadastrosAvOperacional.length === 0 && !isLoading ? (
        <EmptyState
          title="Nenhuma avaliação operacional encontrada"
          description={
            searchTerm
              ? "Não foram encontradas avaliação operacional com os critérios de busca"
              : "Ainda não há avaliação operacional cadastradas. Clique em 'Nova Avaliação Operacional' para começar."
          }
          action={{
            label: "Nova Avaliação",
            onClick: handleCreate,
          }}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-card text-muted-foreground">
                <TableHead className="rounded-tl-md">ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="rounded-tr-md text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cadastrosAvOperacional.map((item: CadAvOperacional) => {
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium py-1.5">{item.id}</TableCell>
                    <TableCell className="py-1.5">{item.descricao}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant={item.situacao ? "default" : "secondary"}
                        className={
                          item.situacao
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : ""
                        }
                      >
                        {item.situacao ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      {item.createdAt
                        ? format(new Date(item.createdAt), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleEdit(item)}
                          aria-label={`Editar ${item.descricao}`}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          aria-label={`Excluir ${item.descricao}`}
                          title="Excluir"
                          className="border-destructive text-destructive hover:bg-destructive-light hover:text-destructive-glow cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
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


      <CadAvOperacionalFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        initialData={selectedAvaliacaoOper}
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
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="shadow-none" asChild >
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
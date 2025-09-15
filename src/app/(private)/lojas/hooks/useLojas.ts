// src/hooks/useLojas.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lojaAPI, handleApiError } from "@/services/api";
import type { Loja, FilterOptions } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const QUERY_KEY = 'lojas';

export const useLojas = (filters?: FilterOptions) => {
    const { isAuthenticated } = useAuth();
    
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: async () => {
            const response = await lojaAPI.getAll(filters);
            
            // A API retorna os dados na propriedade "loja"
            let lojas: Loja[] = [];

            if (response.data && Array.isArray((response.data as any).loja)) {
                // Mapear os campos da API para o formato esperado pelo frontend
                lojas = (response.data as any).loja.map((item: any) => ({
                    id: item.id,
                    codigo: String(item.codigo ?? ''),
                    descricao: item.name,        // API usa "name", frontend espera "descricao"
                    luc: item.luc,
                    piso: item.piso,
                    ativa: item.situacao,        // API usa "situacao", frontend espera "ativa"
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                }));
            } else if (Array.isArray(response.data)) {
                // Caso extremo: API retorne array direto
                lojas = (response.data as any[]).map((item: any) => ({
                    id: item.id,
                    codigo: String(item.codigo ?? ''),
                    descricao: item.name ?? item.descricao,
                    luc: item.luc,
                    piso: item.piso,
                    ativa: item.situacao ?? item.ativa,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                }));
            }

            // Calcular paginação com suportes a chaves diferentes
            const total = (response.data as any).total ?? (response.data as any).totalItems ?? lojas.length;
            const totalPages = (response.data as any).totalPages ?? (total && (filters?.limit ? Math.ceil(total / (filters.limit || 10)) : 1)) ?? 1;
            const page = (response.data as any).page ?? (response.data as any).currentPage ?? filters?.page ?? 1;
            const limit = (response.data as any).limit ?? filters?.limit ?? lojas.length;

            return { data: lojas, total, totalPages, page, limit };
        },
        enabled: isAuthenticated, // Só executa se estiver autenticado
        staleTime: 5 * 60 * 1000, // 5 minutos
        placeholderData: (previousData) => previousData, // Mantém dados anteriores durante carregamento de nova página
    });
};

export const useLoja = (id: number) => {
    const { isAuthenticated } = useAuth();
    
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            const response = await lojaAPI.getById(id);
            
            // Mapear os campos da API para o formato esperado
            if (response.data) {
                return {
                    id: response.data.id,
                    codigo: String(response.data.codigo),
                    descricao: response.data.name,
                    luc: response.data.luc,
                    piso: response.data.piso,
                    ativa: response.data.situacao,
                    createdAt: response.data.createdAt,
                    updatedAt: response.data.updatedAt
                };
            }
            
            return response.data;
        },
        enabled: !!id && isAuthenticated, // Só executa se tiver ID e estiver autenticado
    });
};

export const useCreateLoja = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Loja>) => {
            // Mapear do modelo do frontend para o backend
            const payload = {
                name: data.descricao,
                codigo: data.codigo,
                luc: data.luc,
                piso: data.piso,
                situacao: data.ativa,
            };
            const response = await lojaAPI.create(payload as any);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Loja criada', {
                description: 'A loja foi criada com sucesso.',
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error(
                'Erro ao criar loja', {
                description: errorMessage
            });
        },
    });
};

export const useUpdateLoja = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Loja> }) => {
            const payload = {
                name: data.descricao,
                codigo: data.codigo,
                luc: data.luc,
                piso: data.piso,
                situacao: data.ativa,
            };
            const response = await lojaAPI.update(id, payload as any);
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            toast.success(
                'Loja atualizada', {
                description: 'A loja foi atualizada com sucesso.',
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error(
                'Erro ao atualizar loja', {
                description: errorMessage
            });
        },
    });
};

export const useDeleteLoja = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await lojaAPI.delete(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            toast.success(
                'Loja removida', {
                description: 'A loja foi removida com sucesso.',
            });
        },
        onError: (error) => {
            const errorMessage = handleApiError(error);
            toast.error(
                'Erro ao remover loja', {
                description: errorMessage
            });
        },
    });
};
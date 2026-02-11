// src/app/(private)/lojas/hooks/useLojas.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lojaAPI, handleApiError } from "@/services/api";
import type { Loja, FilterOptions } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const QUERY_KEY = "lojas";

export const useLojas = (filters: FilterOptions = {}) => {
  const { isAuthenticated } = useAuth();

  // normaliza e mapeia nomes de params para o que o backend entende
  const params: Record<string, any> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };

  const term = (filters.search ?? (filters as any).name ?? (filters as any).q)
    ?.toString()
    .trim();
  if (term) {
    // 1) principal: a maioria dos seus endpoints filtra por "name"
    params.name = term;
    // 2) compat extra (caso este endpoint use q)
    params.q = term;
    // se seu backend aceitar "search", deixar também não machuca:
    params.search = term;
  }

  // ✅ filtro por situação (backend: situacao=1/0)
  // ✅ filtro por situação (backend: situacao=1/0)
  const situacao = (filters as any).situacao ?? (filters as any).ativa;

  // IMPORTANTE: isso aceita 0 e 1
  if (situacao !== undefined && situacao !== null && situacao !== "") {
    params.situacao =
      situacao === true ? 1 : situacao === false ? 0 : Number(situacao); // se vier "0"/"1" em string
  }
  return useQuery({
    queryKey: [QUERY_KEY, params], // usa os params normalizados na key
    queryFn: async () => {
      const response = await lojaAPI.getAll(params);

      // ---- mapeamento do payload ----
      let loja: Loja[] = [];

      const data: any = response.data;

      // Ex.: { loja: [...] } (pluralizar aqui se preciso)
      const arr = Array.isArray(data?.loja)
        ? data.loja
        : Array.isArray(data?.lojas)
          ? data.lojas
          : Array.isArray(data)
            ? data
            : [];

      loja = arr.map((item: any) => ({
        id: item.id,
        codigo: String(item.codigo ?? ""),
        // backend manda "name"; seu front usa "descricao"
        descricao: item.name ?? item.descricao ?? "",
        luc: item.luc,
        piso: item.piso,
        ativa: item.situacao ?? item.ativa,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      const total =
        data?.total ?? data?.totalItems ?? data?.count ?? loja.length;

      const page = data?.page ?? data?.currentPage ?? params.page ?? 1;

      const limit = data?.limit ?? params.limit ?? loja.length;

      const totalPages =
        data?.totalPages ?? (limit ? Math.max(1, Math.ceil(total / limit)) : 1);

      return { data: loja, total, totalPages, page, limit };
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    placeholderData: (d) => d, // mantém os dados antigos
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
          updatedAt: response.data.updatedAt,
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
      toast.success("Loja criada", {
        description: "A loja foi criada com sucesso.",
      });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toast.error("Erro ao criar loja", {
        description: errorMessage,
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
      toast.success("Loja atualizada", {
        description: "A loja foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toast.error("Erro ao atualizar loja", {
        description: errorMessage,
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
      toast.success("Loja removida", {
        description: "A loja foi removida com sucesso.",
      });
    },
    onError: (error) => {
      const errorMessage = handleApiError(error);
      toast.error("Erro ao remover loja", {
        description: errorMessage,
      });
    },
  });
};

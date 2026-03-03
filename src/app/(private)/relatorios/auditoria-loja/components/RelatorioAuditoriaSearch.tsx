"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import RelatorioAuditoria from "./RelatorioAuditoria";
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";
import { useRelatorioMensal } from "../hooks/useRelatorioMensal";
import { useQuery } from "@tanstack/react-query";
import { vendaAPI } from "@/services/api";
import type { Loja } from "@/types";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MESES = [
  { v: 1, label: "Janeiro" },
  { v: 2, label: "Fevereiro" },
  { v: 3, label: "Marco" },
  { v: 4, label: "Abril" },
  { v: 5, label: "Maio" },
  { v: 6, label: "Junho" },
  { v: 7, label: "Julho" },
  { v: 8, label: "Agosto" },
  { v: 9, label: "Setembro" },
  { v: 10, label: "Outubro" },
  { v: 11, label: "Novembro" },
  { v: 12, label: "Dezembro" },
];

type AppliedFilters = {
  lojaId: number;
  lojaNome: string;
  mes: number;
  ano: number;
};

type VendaPerfil = {
  sexoId?: number;
  faixaetaria?: string;
  sexo?: { id?: number; name?: string };
  auditoria?: { data?: string };
};

export default function RelatorioAuditoriaSearch() {
  const now = new Date();
  const [mes, setMes] = React.useState(now.getMonth() + 1);
  const [ano, setAno] = React.useState(now.getFullYear());
  const [lojaId, setLojaId] = React.useState<number>(0);
  const [lojaNome, setLojaNome] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [searchDebounced, setSearchDebounced] = React.useState("");
  const [openLoja, setOpenLoja] = React.useState(false);
  const [applied, setApplied] = React.useState<AppliedFilters | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const lojasQuery = useLojas({
    page: 1,
    limit: 300,
    search: searchDebounced,
  });

  const lojas = React.useMemo<Loja[]>(() => lojasQuery.data?.data ?? [], [lojasQuery.data?.data]);
  const lojaSelecionada = React.useMemo(
    () => lojas.find((item) => Number(item.id) === Number(lojaId)) ?? null,
    [lojas, lojaId],
  );

  const q = useRelatorioMensal(
    applied
      ? {
          lojaId: applied.lojaId,
          mes: applied.mes,
          ano: applied.ano,
        }
      : null,
    { enabled: !!applied },
  );

  const qVendas = useQuery({
    queryKey: ["auditoria-loja-vendas-perfil", applied?.lojaId ?? null, applied?.mes ?? null, applied?.ano ?? null],
    enabled: !!applied,
    queryFn: async (): Promise<VendaPerfil[]> => {
      const { data } = await vendaAPI.getAll({
        lojaId: applied!.lojaId,
        mes: applied!.mes,
        ano: applied!.ano,
        page: 1,
        limit: 5000,
      });
      return Array.isArray(data?.vendas) ? data.vendas : [];
    },
    staleTime: 60_000,
  });

  const anos = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => current - i);
  }, []);

  const handleGerar = () => {
    if (!lojaId) return;
    setApplied({ lojaId, lojaNome, mes, ano });
  };

  const clearLoja = () => {
    setLojaId(0);
    setLojaNome("");
    setSearch("");
    setApplied(null);
  };

  return (
    <div className="space-y-4">
      <Card className="print:hidden bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1 md:col-span-2">
              <span className="text-sm text-muted-foreground">Loja</span>
              <div className="flex items-center gap-2">
                <Popover open={openLoja} onOpenChange={setOpenLoja}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openLoja} className="w-full justify-between">
                      {(lojaSelecionada?.descricao ?? lojaNome) || "Selecione a loja..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar loja..."
                        value={search}
                        onValueChange={setSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {lojasQuery.isLoading ? "Buscando lojas..." : "Nenhuma loja encontrada."}
                        </CommandEmpty>
                        <CommandGroup>
                          {lojas.map((loja) => (
                            <CommandItem
                              key={loja.id}
                              value={String(loja.descricao ?? loja.name ?? loja.id)}
                              onSelect={() => {
                                setLojaId(Number(loja.id));
                                setLojaNome(loja.descricao ?? loja.name ?? "");
                                setOpenLoja(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  Number(loja.id) === Number(lojaId) ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {loja.descricao ?? loja.name ?? `Loja ${loja.id}`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={clearLoja}
                  disabled={!lojaId && !search}
                  title="Limpar loja selecionada"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite para buscar por nome e selecione na lista.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Mes</span>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {MESES.map((item) => (
                  <option key={item.v} value={item.v}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Ano</span>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
              >
                {anos.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleGerar} disabled={!lojaId || q.isFetching}>
              Gerar relatorio
            </Button>
            {lojasQuery.isLoading && <span className="text-sm text-muted-foreground">Carregando lojas...</span>}
            {q.isLoading && <span className="text-sm text-muted-foreground">Carregando relatorio...</span>}
            {q.error && <span className="text-sm text-red-500">Erro ao buscar dados do relatorio.</span>}
          </div>
        </CardContent>
      </Card>

      {q.data ? (
        <RelatorioAuditoria
          data={q.data}
          lojaNome={applied?.lojaNome || lojaNome}
          vendasPerfil={qVendas.data ?? []}
        />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Selecione os filtros e clique em &quot;Gerar relatorio&quot;.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

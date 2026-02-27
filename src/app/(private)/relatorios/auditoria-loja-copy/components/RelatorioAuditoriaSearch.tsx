"use client";

import * as React from "react";
import RelatorioAuditoria from "./RelatorioAuditoria";
import { useAuditoriaLojaReport } from "../hooks/useAuditoriaLojaReport";

// ✅ usa o hook que já funciona no sistema
import { useLojas } from "@/app/(private)/lojas/hooks/useLojas";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MESES = [
  { v: 1, label: "Janeiro" }, { v: 2, label: "Fevereiro" }, { v: 3, label: "Março" },
  { v: 4, label: "Abril" }, { v: 5, label: "Maio" }, { v: 6, label: "Junho" },
  { v: 7, label: "Julho" }, { v: 8, label: "Agosto" }, { v: 9, label: "Setembro" },
  { v: 10, label: "Outubro" }, { v: 11, label: "Novembro" }, { v: 12, label: "Dezembro" },
];

export default function RelatorioAuditoriaSearch() {
  const now = new Date();

  const [includeInativas, setIncludeInativas] = React.useState(false);

  const [mes, setMes] = React.useState<number>(now.getMonth() + 1);
  const [ano, setAno] = React.useState<number>(now.getFullYear());

  const [lojaId, setLojaId] = React.useState<number | null>(null);
  const [lojaNome, setLojaNome] = React.useState<string>("");

  const [openLoja, setOpenLoja] = React.useState(false);

  // texto digitado no combobox
  const [search, setSearch] = React.useState("");

  // aplica só quando clicar em Gerar
  const [applied, setApplied] = React.useState<{ lojaId: number; mes: number; ano: number; lojaNome: string } | null>(null);

  // ✅ seu hook entende "situacao=1/0"
  // - se NÃO incluir inativas -> situacao=1
  // - se incluir -> não manda situacao (traz tudo)
  const lojasQuery = useLojas({
    page: 1,
    limit: 200, // ↑ se tiver muitas, pode subir p/ 500 ou implementar paginação
    search,
    ...(includeInativas ? {} : { situacao: 1 }),
  } as any);

  const lojas = lojasQuery.data?.data ?? []; // seu hook retorna { data: loja[], total... }

  const lojaSelecionada = React.useMemo(() => {
    if (!lojaId) return null;
    return lojas.find((l: any) => Number(l.id) === Number(lojaId)) ?? null;
  }, [lojas, lojaId]);

  const q = useAuditoriaLojaReport(
    applied
      ? {
          lojaId: applied.lojaId,
          lojaNome: applied.lojaNome,
          mes: applied.mes,
          ano: applied.ano,
        }
      : {},
    { enabled: !!applied }
  );

  const anos = React.useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => y - i);
  }, []);

  function gerar() {
    if (!lojaId || !lojaNome) {
      alert("Selecione uma loja.");
      return;
    }
    setApplied({ lojaId, lojaNome, mes, ano });
  }

  // se trocar “incluir inativas”, limpa seleção (evita loja sumir e ficar id inválido)
  React.useEffect(() => {
    setLojaId(null);
    setLojaNome("");
    setApplied(null);
  }, [includeInativas]);

  return (
    <div className="space-y-4">
      <Card className="print:hidden bg-gradient-card shadow-card">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeInativas"
              checked={includeInativas}
              onCheckedChange={(v) => setIncludeInativas(Boolean(v))}
            />
            <Label htmlFor="includeInativas">Incluir lojas inativas</Label>

            {lojasQuery.isLoading ? (
              <span className="text-xs text-muted-foreground ml-2">Carregando lojas...</span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Loja pesquisável */}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Loja</span>

              <Popover open={openLoja} onOpenChange={setOpenLoja}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openLoja} className="w-full justify-between">
                    {lojaSelecionada?.descricao ?? lojaNome ?? "Selecione a loja..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false /* ✅ a filtragem é no backend */}>
                    <CommandInput
                      placeholder="Digite para buscar loja..."
                      value={search}
                      onValueChange={(v) => setSearch(v)}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {lojasQuery.isLoading ? "Buscando..." : "Nenhuma loja encontrada."}
                      </CommandEmpty>

                      <CommandGroup>
                        {lojas.map((l: any) => (
                          <CommandItem
                            key={l.id}
                            value={l.descricao ?? l.name ?? ""}
                            onSelect={() => {
                              setLojaId(Number(l.id));
                              setLojaNome(l.descricao ?? l.name ?? "");
                              setOpenLoja(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", lojaId === Number(l.id) ? "opacity-100" : "opacity-0")} />
                            {l.descricao ?? l.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Mês */}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Mês</span>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {MESES.map((m) => (
                  <option key={m.v} value={m.v}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ano */}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Ano</span>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
              >
                {anos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button onClick={gerar}>Gerar</Button>

            {q.loading ? <span className="text-sm text-muted-foreground">Buscando dados...</span> : null}
            {q.error ? <span className="text-sm text-red-500">Erro ao carregar (veja console).</span> : null}
          </div>
        </CardContent>
      </Card>

      <RelatorioAuditoria data={q.report} />
    </div>
  );
}
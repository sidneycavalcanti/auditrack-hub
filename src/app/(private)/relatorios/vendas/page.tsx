// src/app/(private)/relatorios/vendas/page.tsx
"use client";
import TabelaResumoVendas from "./components/TabelaResumoVendas";
import TabelaComparativoVendasHora from "./components/TabelaComparativoVendasHora";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function RelatorioVendas() {
  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            {/* <ClipboardList className="h-8 w-8" /> */}
            Relatórios de vendas
          </h1>
        </div>
      </div>
      <Tabs defaultValue="resumo-venda-fluxo">
        <TabsList className="flex border gap-2 bg-gradient-card shadow-card">
          <TabsTrigger className="cursor-pointer" value="resumo-venda-fluxo">Resumo mensal de venda e fluxo</TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="comparativo-vendas-horas">Comparativo de vendas por hora</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo-venda-fluxo">
          <TabelaResumoVendas />
        </TabsContent>
        <TabsContent value="comparativo-vendas-horas">
          <TabelaComparativoVendasHora />
        </TabsContent>
      </Tabs>

    </div>
  );
}
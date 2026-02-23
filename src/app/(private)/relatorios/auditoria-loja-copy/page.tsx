// FILE: src/app/(private)/relatorios/auditoria-loja/page.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelatorioAuditoria from "./components/RelatorioAuditoria";
import type { AudReportData } from "./types/auditoria";

const data: AudReportData = {
  meta: {
    loja: "LA CAMICERIA PREMIUM",
    muc: "005/6",
    mes: "Junho",
    ano: 2022,
  },

  // ===== FLUXO POR GRUPO =====
  fluxoPorGrupo: [
    { name: "Vendas Realizadas", value: 44.1 },
    { name: "Acompanhantes", value: 22.1 },
    { name: "Vendas Perdidas Identificadas", value: 30.8 },
    { name: "Possíveis Vendas Perdidas", value: 2.0 },
    { name: "Outros", value: 1.0 },
  ],

  // ===== FLUXO POR DIA DA SEMANA =====
  fluxoPorDiaSemana: [
    {
      dia: "Segunda-feira",
      vendasRealizadas: 350,
      acompanhantes: 140,
      vendasPerdidasIdentificadas: 120,
      possiveisVendasPerdidas: 80,
      outros: 15,
      trocas: 25,
    },
    {
      dia: "Terça-feira",
      vendasRealizadas: 230,
      acompanhantes: 155,
      vendasPerdidasIdentificadas: 90,
      possiveisVendasPerdidas: 70,
      outros: 5,
      trocas: 12,
    },
    {
      dia: "Quarta-feira",
      vendasRealizadas: 410,
      acompanhantes: 180,
      vendasPerdidasIdentificadas: 140,
      possiveisVendasPerdidas: 110,
      outros: 20,
      trocas: 18,
    },
    {
      dia: "Quinta-feira",
      vendasRealizadas: 215,
      acompanhantes: 90,
      vendasPerdidasIdentificadas: 85,
      possiveisVendasPerdidas: 140,
      outros: 25,
      trocas: 14,
    },
    {
      dia: "Sexta-feira",
      vendasRealizadas: 500,
      acompanhantes: 210,
      vendasPerdidasIdentificadas: 200,
      possiveisVendasPerdidas: 150,
      outros: 35,
      trocas: 30,
    },
    {
      dia: "Sábado",
      vendasRealizadas: 650,
      acompanhantes: 320,
      vendasPerdidasIdentificadas: 280,
      possiveisVendasPerdidas: 190,
      outros: 40,
      trocas: 45,
    },
    {
      dia: "Domingo",
      vendasRealizadas: 180,
      acompanhantes: 60,
      vendasPerdidasIdentificadas: 55,
      possiveisVendasPerdidas: 35,
      outros: 10,
      trocas: 5,
    },
  ],

  // ===== PERDAS POR GRUPO =====
  perdasPorGrupo: [
    { name: "Preço", value: 28 },
    { name: "Falta de Mercadoria", value: 24 },
    { name: "Modelo / Cor / Tamanho", value: 18 },
    { name: "Forma de Pagamento", value: 12 },
    { name: "Atendimento", value: 10 },
    { name: "Outros", value: 8 },
  ],

  perfilPorIdade: [
  { dia: "Segunda", crianca: 40, adulto: 320, idoso: 30 },
  { dia: "Terça", crianca: 25, adulto: 210, idoso: 20 },
  { dia: "Quarta", crianca: 30, adulto: 180, idoso: 15 },
  { dia: "Quinta", crianca: 35, adulto: 190, idoso: 18 },
  { dia: "Sexta", crianca: 60, adulto: 260, idoso: 25 },
  { dia: "Sábado", crianca: 90, adulto: 340, idoso: 40 },
  { dia: "Domingo", crianca: 50, adulto: 120, idoso: 15 },
],

fluxoPorSemanaMes: [
  { semana: "1ª Semana", crianca: 120, adulto: 850, idoso: 90 },
  { semana: "2ª Semana", crianca: 140, adulto: 920, idoso: 100 },
  { semana: "3ª Semana", crianca: 110, adulto: 780, idoso: 85 },
  { semana: "4ª Semana", crianca: 160, adulto: 990, idoso: 120 },
],

compradoresPorGenero: [
  { dia: "Segunda-feira", feminino: 270, masculino: 80 },
  { dia: "Terça-feira", feminino: 180, masculino: 45 },
  { dia: "Quarta-feira", feminino: 0, masculino: 0 },
  { dia: "Quinta-feira", feminino: 195, masculino: 20 },
  { dia: "Sexta-feira", feminino: 75, masculino: 30 },
  { dia: "Sábado", feminino: 230, masculino: 70 },
  { dia: "Domingo", feminino: 20, masculino: 10 },
],

  // ===== PERDAS POR DIA =====
  perdasPorDiaSemana: [
    {
      dia: "Segunda-feira",
      preco: 12,
      faltaMercadoria: 18,
      modeloCorTamanho: 10,
      formaPagamento: 6,
      atendimento: 4,
      outros: 2,
    },
    {
      dia: "Terça-feira",
      preco: 8,
      faltaMercadoria: 10,
      modeloCorTamanho: 6,
      formaPagamento: 3,
      atendimento: 2,
      outros: 1,
    },
    {
      dia: "Quarta-feira",
      preco: 15,
      faltaMercadoria: 12,
      modeloCorTamanho: 8,
      formaPagamento: 4,
      atendimento: 3,
      outros: 1,
    },
    {
      dia: "Quinta-feira",
      preco: 10,
      faltaMercadoria: 14,
      modeloCorTamanho: 9,
      formaPagamento: 5,
      atendimento: 4,
      outros: 2,
    },
    {
      dia: "Sexta-feira",
      preco: 20,
      faltaMercadoria: 16,
      modeloCorTamanho: 12,
      formaPagamento: 7,
      atendimento: 6,
      outros: 3,
    },
    {
      dia: "Sábado",
      preco: 25,
      faltaMercadoria: 20,
      modeloCorTamanho: 15,
      formaPagamento: 8,
      atendimento: 7,
      outros: 4,
    },
    {
      dia: "Domingo",
      preco: 5,
      faltaMercadoria: 4,
      modeloCorTamanho: 3,
      formaPagamento: 2,
      atendimento: 1,
      outros: 1,
    },
  ],

  clientesCompraramVsNao: {
    compraram: 1560,
    naoCompraram: 820,
    total: 2380,
  },

  conversaoGeral: {
    totalFluxo: 2380,
    totalVendas: 1560,
    aproveitamento: 0.655,
  },

  ticketMedioGeral: 412.75,
};

export default function Page() {
  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h1 className="text-3xl font-bold text-foreground">
          Relatório de Auditoria do Lojista
        </h1>
      </div>

      <Tabs defaultValue="relatorio-loja" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:inline-flex print:hidden bg-gradient-card h-auto shadow-card">
          <TabsTrigger value="relatorio-loja">
            Relatório de loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio-loja">
          <RelatorioAuditoria data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import type { AudReportData } from "../types/auditoria";

const COLORS = [
  "#5B5F97",
  "#9C2F6F",
  "#7A7A7A",
  "#6C63FF",
  "#F26B6B",
  "#2E8B57",
];

type Props = {
  data: AudReportData;
};

export default function RelatorioAuditoria({ data }: Props) {
  const { meta } = data;

  const exportPDF = () => {
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <Card className="bg-transparent print:shadow-none">
      {/* HEADER NÃO APARECE NO PDF */}
      <CardHeader className="print:hidden">
        <div className="flex items-center justify-between">
          <CardTitle>Relatório de Auditoria</CardTitle>
          <Button onClick={exportPDF}>Exportar PDF</Button>
        </div>
        <CardDescription>
          {meta.loja} • {meta.mes}/{meta.ano}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-14">

        {/* ================= PERFIL FREQUENTADOR ================= */}
        <SectionBand title="PERFIL FREQUENTADOR" />

        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-1 gap-10">

          <ChartWrapper title="Perfil de Clientes (Compradores) por Gênero">
            <BarChart data={data.compradoresPorGenero}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="masculino" name="Masculino" fill="#5B5F97" />
              <Bar dataKey="feminino" name="Feminino" fill="#9C2F6F" />
            </BarChart>
          </ChartWrapper>

          <ChartWrapper title="Fluxo de Pessoas por Grupo">
            <PieChart>
              <Pie
                data={data.fluxoPorGrupo}
                dataKey="value"
                nameKey="name"
                outerRadius={130}
                label={({ percent }) =>
                  `${(percent * 100).toFixed(1)}%`
                }
              >
                {data.fluxoPorGrupo.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartWrapper>

          <ChartWrapper title="Fluxo por Dia da Semana">
            <BarChart data={data.fluxoPorDiaSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendasRealizadas" name="Vendas" fill="#5B5F97" />
              <Bar dataKey="acompanhantes" name="Acompanhantes" fill="#9C2F6F" />
              <Bar dataKey="outros" name="Outros" fill="#F26B6B" />
            </BarChart>
          </ChartWrapper>

          <ChartWrapper title="Perfil por Idade - Semana do Mês">
            <BarChart data={data.fluxoPorSemanaMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="crianca" name="Criança" fill="#6C63FF" />
              <Bar dataKey="adulto" name="Adulto" fill="#5B5F97" />
              <Bar dataKey="idoso" name="Idoso" fill="#2E8B57" />
            </BarChart>
          </ChartWrapper>

        </div>

        {/* ================= VENDAS PERDIDAS ================= */}
        <SectionBand title="VENDAS PERDIDAS" />

        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-1 gap-10">

          <ChartWrapper title="Vendas Perdidas por Grupo">
            <PieChart>
              <Pie
                data={data.perdasPorGrupo}
                dataKey="value"
                nameKey="name"
                outerRadius={140}
                label={({ percent }) =>
                  `${(percent * 100).toFixed(1)}%`
                }
              >
                {data.perdasPorGrupo.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartWrapper>

          <ChartWrapper title="Vendas Perdidas por Dia da Semana">
            <BarChart data={data.perdasPorDiaSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="preco" name="Preço" fill="#5B5F97" />
              <Bar dataKey="faltaMercadoria" name="Falta Mercadoria" fill="#9C2F6F" />
              <Bar dataKey="modeloCorTamanho" name="Modelo/Cor/Tam" fill="#7A7A7A" />
              <Bar dataKey="formaPagamento" name="Pagamento" fill="#6C63FF" />
              <Bar dataKey="atendimento" name="Atendimento" fill="#2E8B57" />
              <Bar dataKey="outros" name="Outros" fill="#F26B6B" />
            </BarChart>
          </ChartWrapper>

        </div>

      </CardContent>
    </Card>
  );
}

/* ================= WRAPPER FIXO PARA GRÁFICOS ================= */

function ChartWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-center font-semibold mb-4">
        {title}
      </h3>

      <div className="w-full h-[380px] print-chart">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ================= FAIXA DE SEÇÃO ================= */

function SectionBand({ title }: { title: string }) {
  return (
    <div className="bg-muted px-4 py-2 rounded-md">
      <span className="font-semibold">{title}</span>
    </div>
  );
}
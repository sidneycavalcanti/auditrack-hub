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

const COLORS = ["#5B5F97","#9C2F6F","#7A7A7A","#6C63FF","#F26B6B","#2E8B57","#FFB703","#219EBC","#8E44AD","#16A085"];

type Props = { data: AudReportData };

function getDynamicKeys(rows: Array<Record<string, any>>, ignore: string[] = ["label"]) {
  const keys = new Set<string>();
  for (const r of rows) {
    Object.keys(r).forEach((k) => {
      if (!ignore.includes(k)) keys.add(k);
    });
  }
  return Array.from(keys);
}

function prettyLabelFromKey(key: string) {
  // se você quiser mapear key -> label original, dá pra carregar um dicionário.
  // por enquanto fica legível.
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RelatorioAuditoria({ data }: Props) {
  const { meta } = data;

  const exportPDF = () => setTimeout(() => window.print(), 300);

  const sexoKeys = React.useMemo(
    () => getDynamicKeys(data.compradoresPorSexo, ["label"]),
    [data.compradoresPorSexo]
  );

  const perdasKeys = React.useMemo(
    () => getDynamicKeys(data.perdasPorDiaSemana, ["label"]),
    [data.perdasPorDiaSemana]
  );

  return (
    <Card className="bg-transparent print:shadow-none">
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
          {/* SEXO/GÊNERO dinâmico */}
          <ChartWrapper title="Compradores por Sexo/Gênero (dinâmico)">
            <BarChart data={data.compradoresPorSexo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {sexoKeys.map((k, idx) => (
                <Bar key={k} dataKey={k} name={prettyLabelFromKey(k)} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ChartWrapper>

          {/* Fluxo por grupo fixo */}
          <ChartWrapper title="Fluxo de Pessoas por Grupo (fixo)">
            <PieChart>
              <Pie
                data={data.fluxoPorGrupo}
                dataKey="value"
                nameKey="name"
                outerRadius={130}
                label={({ percent }) => `${((percent as number) * 100).toFixed(1)}%`}
              >
                {data.fluxoPorGrupo.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartWrapper>

          {/* Fluxo por dia semana fixo (4) */}
          <ChartWrapper title="Fluxo por Dia da Semana (no mês)">
            <BarChart data={data.fluxoPorDiaSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendas" name="Vendas" fill={COLORS[0]} />
              <Bar dataKey="acompanhante" name="Acompanhante" fill={COLORS[1]} />
              <Bar dataKey="especulador" name="Especulador" fill={COLORS[2]} />
              <Bar dataKey="outros" name="Outros" fill={COLORS[3]} />
            </BarChart>
          </ChartWrapper>

          {/* Idade por semana */}
          <ChartWrapper title="Perfil por Idade - Semana do Mês">
            <BarChart data={data.fluxoPorSemanaMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="crianca" name="Criança" fill={COLORS[3]} />
              <Bar dataKey="adulto" name="Adulto" fill={COLORS[0]} />
              <Bar dataKey="idoso" name="Idoso" fill={COLORS[5]} />
            </BarChart>
          </ChartWrapper>
        </div>

        {/* ================= VENDAS PERDIDAS ================= */}
        <SectionBand title="VENDAS PERDIDAS" />

        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-1 gap-10">
          {/* Pizza dinâmica */}
          <ChartWrapper title="Vendas Perdidas por Motivo (dinâmico)">
            <PieChart>
              <Pie
                data={data.perdasPorMotivo}
                dataKey="value"
                nameKey="name"
                outerRadius={140}
                label={({ percent }) => `${((percent as number) * 100).toFixed(1)}%`}
              >
                {data.perdasPorMotivo.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartWrapper>

          {/* Barras dinâmicas por dia da semana */}
          <ChartWrapper title="Vendas Perdidas por Dia da Semana (dinâmico)">
            <BarChart data={data.perdasPorDiaSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {perdasKeys.map((k, idx) => (
                <Bar key={k} dataKey={k} name={prettyLabelFromKey(k)} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ChartWrapper>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-center font-semibold mb-4">{title}</h3>
      <div className="w-full h-[380px] print-chart">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function SectionBand({ title }: { title: string }) {
  return (
    <div className="bg-muted px-4 py-2 rounded-md">
      <span className="font-semibold">{title}</span>
    </div>
  );
}
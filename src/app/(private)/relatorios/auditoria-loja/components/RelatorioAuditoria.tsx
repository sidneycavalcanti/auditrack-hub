"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import type { DiaSemana, RelatorioMensalData } from "../types/auditoria";
import exportRelatorioAuditoriaXLSX from "./_exporters/exportRelatorioAuditoriaXLSX";
import "@/app/styles/relatorios_pdf/auditoria-loja.css";

const DIAS: DiaSemana[] = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const CHART_PALETTE = [
  "#2563eb",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
];

const C = (i: number) => CHART_PALETTE[(i - 1) % CHART_PALETTE.length];

function monthNamePt(m: number): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[m - 1] ?? String(m);
}

function n(value: number | undefined | null) {
  return Number(value ?? 0);
}

type Props = {
  data: RelatorioMensalData;
  lojaNome?: string;
  vendasPerfil?: Array<{
    sexoId?: number;
    faixaetaria?: string;
    sexo?: { id?: number; name?: string };
    auditoria?: { data?: string };
    createdAt?: string;
  }>;
};

type PerfilRow = {
  masculino: number;
  feminino: number;
  crianca: number;
  jovem: number;
  adulto: number;
  idoso: number;
  total: number;
};

const EMPTY_PERFIL_ROW: PerfilRow = {
  masculino: 0,
  feminino: 0,
  crianca: 0,
  jovem: 0,
  adulto: 0,
  idoso: 0,
  total: 0,
};

function newPerfilRow(): PerfilRow {
  return { ...EMPTY_PERFIL_ROW };
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function getDiaSemanaFromISO(iso?: string): DiaSemana | null {
  if (!iso) return null;
  const simple = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dt = simple
    ? new Date(Number(simple[1]), Number(simple[2]) - 1, Number(simple[3]), 12, 0, 0)
    : new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  const day = dt.getDay();
  if (day === 1) return "Segunda-feira";
  if (day === 2) return "Terça-feira";
  if (day === 3) return "Quarta-feira";
  if (day === 4) return "Quinta-feira";
  if (day === 5) return "Sexta-feira";
  if (day === 6) return "Sábado";
  return "Domingo";
}

function normalizeGeneroLabel(sexoName?: string, sexoId?: number) {
  const txt = normalizeText(sexoName ?? "");
  if (txt.startsWith("masc")) return "Masculino";
  if (txt.startsWith("fem")) return "Feminino";
  if (sexoName && sexoName.trim()) return sexoName.trim();
  if (sexoId === 1) return "Masculino";
  if (sexoId === 2) return "Feminino";
  if (sexoId) return `Sexo ${sexoId}`;
  return "Nao informado";
}

function normalizeFaixa(value?: string): "crianca" | "jovem" | "adulto" | "idoso" {
  const txt = normalizeText(value ?? "");
  if (txt.startsWith("cri")) return "crianca";
  if (txt.startsWith("jov")) return "jovem";
  if (txt.startsWith("ido")) return "idoso";
  return "adulto";
}

export default function RelatorioAuditoria({ data, lojaNome, vendasPerfil = [] }: Props) {
  const totalVendidoMes = n(data.totalVendidoMes);
  const [exportingXlsx, setExportingXlsx] = React.useState(false);
  const exportPDF = () => {
    const prev = document.title;
    document.title = `Relatorio Auditoria - ${lojaNome || `Loja ${data.lojaId}`} - ${data.mes}/${data.ano}`;
    const restore = () => {
      document.title = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    setTimeout(restore, 1500);
  };

  const exportXLSX = async () => {
    setExportingXlsx(true);
    try {
      await exportRelatorioAuditoriaXLSX({ data, lojaNome });
    } finally {
      setExportingXlsx(false);
    }
  };

  const perfilCompradores = React.useMemo(() => {
    const hasVendasPerfil = vendasPerfil.length > 0;

    if (!hasVendasPerfil) {
      const rowsByDay = DIAS.reduce(
        (acc, dia) => {
          acc[dia] = {
            masculino: n(data.perfilClientesCompradores.rows[dia]?.masculino),
            feminino: n(data.perfilClientesCompradores.rows[dia]?.feminino),
            crianca: n(data.perfilClientesCompradores.rows[dia]?.crianca),
            jovem: n(data.perfilClientesCompradores.rows[dia]?.jovem),
            adulto: n(data.perfilClientesCompradores.rows[dia]?.adulto),
            idoso: n(data.perfilClientesCompradores.rows[dia]?.idoso),
            total: n(data.perfilClientesCompradores.rows[dia]?.total),
          };
          return acc;
        },
        {} as Record<DiaSemana, PerfilRow>,
      );

      return {
        rowsByDay,
        totalGeral: {
          masculino: n(data.perfilClientesCompradores.totalGeral.masculino),
          feminino: n(data.perfilClientesCompradores.totalGeral.feminino),
          crianca: n(data.perfilClientesCompradores.totalGeral.crianca),
          jovem: n(data.perfilClientesCompradores.totalGeral.jovem),
          adulto: n(data.perfilClientesCompradores.totalGeral.adulto),
          idoso: n(data.perfilClientesCompradores.totalGeral.idoso),
          total: n(data.perfilClientesCompradores.totalGeral.total),
        },
        participacaoPct: data.perfilClientesCompradores.participacaoPct,
        generoKeys: ["Masculino", "Feminino"],
        generoChart: DIAS.map((dia) => ({
          dia,
          Masculino: n(data.perfilClientesCompradores.rows[dia]?.masculino),
          Feminino: n(data.perfilClientesCompradores.rows[dia]?.feminino),
        })),
        idadeChart: DIAS.map((dia) => ({
          dia,
          crianca: n(data.perfilClientesCompradores.rows[dia]?.crianca),
          jovem: n(data.perfilClientesCompradores.rows[dia]?.jovem),
          adulto: n(data.perfilClientesCompradores.rows[dia]?.adulto),
          idoso: n(data.perfilClientesCompradores.rows[dia]?.idoso),
        })),
      };
    }

    const rowsByDay = DIAS.reduce(
      (acc, dia) => {
        acc[dia] = newPerfilRow();
        return acc;
      },
      {} as Record<DiaSemana, PerfilRow>,
    );
    const generoDayMap = DIAS.reduce(
      (acc, dia) => {
        acc[dia] = {};
        return acc;
      },
      {} as Record<DiaSemana, Record<string, number>>,
    );
    const generoKeysSet = new Set<string>();

    vendasPerfil.forEach((venda) => {
      const dia = getDiaSemanaFromISO(venda.auditoria?.data ?? venda.createdAt);
      if (!dia) return;

      const generoLabel = normalizeGeneroLabel(venda.sexo?.name, venda.sexoId);
      generoKeysSet.add(generoLabel);
      generoDayMap[dia][generoLabel] = n(generoDayMap[dia][generoLabel]) + 1;

      if (normalizeText(generoLabel).startsWith("masc")) rowsByDay[dia].masculino += 1;
      if (normalizeText(generoLabel).startsWith("fem")) rowsByDay[dia].feminino += 1;

      const faixa = normalizeFaixa(venda.faixaetaria);
      rowsByDay[dia][faixa] += 1;
      rowsByDay[dia].total += 1;
    });

    const totalGeral = DIAS.reduce(
      (acc, dia) => {
        acc.masculino += rowsByDay[dia].masculino;
        acc.feminino += rowsByDay[dia].feminino;
        acc.crianca += rowsByDay[dia].crianca;
        acc.jovem += rowsByDay[dia].jovem;
        acc.adulto += rowsByDay[dia].adulto;
        acc.idoso += rowsByDay[dia].idoso;
        acc.total += rowsByDay[dia].total;
        return acc;
      },
      newPerfilRow(),
    );

    const pct = (value: number) => (totalGeral.total > 0 ? Math.round((value / totalGeral.total) * 100) : 0);
    const participacaoPct = {
      masculino: pct(totalGeral.masculino),
      feminino: pct(totalGeral.feminino),
      crianca: pct(totalGeral.crianca),
      jovem: pct(totalGeral.jovem),
      adulto: pct(totalGeral.adulto),
      idoso: pct(totalGeral.idoso),
      total: totalGeral.total > 0 ? 100 : 0,
    };

    const orderedGender = Array.from(generoKeysSet).sort((a, b) => {
      if (a === "Masculino") return -1;
      if (b === "Masculino") return 1;
      if (a === "Feminino") return -1;
      if (b === "Feminino") return 1;
      return a.localeCompare(b);
    });

    const generoChart = DIAS.map((dia) => {
      const row: Record<string, string | number> = { dia };
      orderedGender.forEach((key) => {
        row[key] = n(generoDayMap[dia][key]);
      });
      return row;
    });

    const idadeChart = DIAS.map((dia) => ({
      dia,
      crianca: rowsByDay[dia].crianca,
      jovem: rowsByDay[dia].jovem,
      adulto: rowsByDay[dia].adulto,
      idoso: rowsByDay[dia].idoso,
    }));

    return {
      rowsByDay,
      totalGeral,
      participacaoPct,
      generoKeys: orderedGender,
      generoChart,
      idadeChart,
    };
  }, [data.perfilClientesCompradores, vendasPerfil]);

  const fluxoDiaChart = DIAS.map((dia) => ({
    dia,
    vendasRealizadas: n(data.fluxoPessoasPorDiaSemana.rows[dia]?.vendasRealizadas),
    acompanhantes: n(data.fluxoPessoasPorDiaSemana.rows[dia]?.acompanhantes),
    vendasPerdidasIdentificadas: n(data.fluxoPessoasPorDiaSemana.rows[dia]?.vendasPerdidasIdentificadas),
    possiveisVendasPerdidas: n(data.fluxoPessoasPorDiaSemana.rows[dia]?.possiveisVendasPerdidas),
    trocas: n(data.fluxoPessoasPorDiaSemana.rows[dia]?.trocas),
    outros: n(data.fluxoPessoasPorDiaSemana.rows[dia]?.outros),
  }));

  const fluxoGrupoPie = [
    { name: "Vendas realizadas", value: n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasRealizadas) },
    { name: "Acompanhantes", value: n(data.fluxoPessoasPorDiaSemana.totalGeral.acompanhantes) },
    { name: "Vendas perdidas identificadas", value: n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasPerdidasIdentificadas) },
    { name: "Possiveis vendas perdidas", value: n(data.fluxoPessoasPorDiaSemana.totalGeral.possiveisVendasPerdidas) },
    { name: "Trocas", value: n(data.fluxoPessoasPorDiaSemana.totalGeral.trocas) },
    { name: "Outros", value: n(data.fluxoPessoasPorDiaSemana.totalGeral.outros) },
  ];

  const fluxoSemanaChart = Array.from({ length: 6 }, (_, idx) => {
    const week = `w${idx + 1}` as keyof RelatorioMensalData["fluxoPessoasPorSemana"]["totalGeral"];
    const row: Record<string, number | string> = { semana: `${idx + 1}a Semana` };
    DIAS.forEach((dia) => {
      row[dia] = n(data.fluxoPessoasPorSemana.rows[dia]?.[week] as number);
    });
    return row;
  });

  const perdasPie = [
    { name: "Preco", value: n(data.vendasPerdidasPorDiaSemana.totalGeral.preco) },
    { name: "Falta de mercadoria", value: n(data.vendasPerdidasPorDiaSemana.totalGeral.faltaMercadoria) },
    { name: "Mod/cor/tamanho", value: n(data.vendasPerdidasPorDiaSemana.totalGeral.modCorTamanho) },
    { name: "Forma de pagamento", value: n(data.vendasPerdidasPorDiaSemana.totalGeral.formaPagamento) },
    { name: "Atendimento", value: n(data.vendasPerdidasPorDiaSemana.totalGeral.atendimento) },
    { name: "Outros", value: n(data.vendasPerdidasPorDiaSemana.totalGeral.outros) },
  ];

  const perdasDiaChart = DIAS.map((dia) => ({
    dia,
    preco: n(data.vendasPerdidasPorDiaSemana.rows[dia]?.preco),
    faltaMercadoria: n(data.vendasPerdidasPorDiaSemana.rows[dia]?.faltaMercadoria),
    modCorTamanho: n(data.vendasPerdidasPorDiaSemana.rows[dia]?.modCorTamanho),
    formaPagamento: n(data.vendasPerdidasPorDiaSemana.rows[dia]?.formaPagamento),
    atendimento: n(data.vendasPerdidasPorDiaSemana.rows[dia]?.atendimento),
    outros: n(data.vendasPerdidasPorDiaSemana.rows[dia]?.outros),
  }));

  const aproveitamentoChart = DIAS.map((dia) => ({
    dia,
    fluxoPessoas: n(data.aproveitamentoVendas.rows[dia]?.fluxoPessoas),
    numeroVendas: n(data.aproveitamentoVendas.rows[dia]?.numeroVendas),
  }));

  return (
    <Card className="bg-transparent">
      <div className="aud-topbar print:aud-topbar-print">
        <div className="aud-topbar__logo">
          <Image src="/auditoria/logo-plaza.png" alt="Plaza" width={56} height={56} priority />
        </div>
        <div className="aud-topbar__title">
          <div className="aud-topbar__muc">Auditoria - {lojaNome || `Loja ${data.lojaId}`}</div>
          <div className="aud-topbar__periodo">
            Periodo: {monthNamePt(data.mes).toUpperCase()} / {data.ano}
          </div>
        </div>
      </div>

      <CardHeader className="print:hidden">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Relatorio de Auditoria</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportXLSX} disabled={exportingXlsx} className="cursor-pointer">
              {exportingXlsx ? "Exportando XLSX..." : "Exportar XLSX"}
            </Button>
            <Button size="sm" onClick={exportPDF} className="cursor-pointer">
              Exportar PDF
            </Button>
          </div>
        </div>
        <CardDescription>
          Loja: {lojaNome || data.lojaId} - Mes/Ano: {data.mes}/{data.ano} - Total vendido:{" "}
          {totalVendidoMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </CardDescription>
      </CardHeader>

      <CardContent id="print-root-auditoria" className="space-y-6">
        <div className="only-print aud-print-title">
          Auditoria - {lojaNome || `Loja ${data.lojaId}`} - {monthNamePt(data.mes)}/{data.ano}
        </div>
        <SectionBand title="1. Perfil de Clientes (Compradores)" />
        <TableSectionPerfil perfil={perfilCompradores} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 grid-print-2">
          <ChartCard
            title="Perfil de clientes (compradores) por genero"
            chartId="chart-perfil-genero"
          >
            <BarChart data={perfilCompradores.generoChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              {perfilCompradores.generoKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={C((i % 5) + 1)} isAnimationActive={false} />
              ))}
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Perfil de clientes (compradores) por idade"
            chartId="chart-perfil-idade"
          >
            <BarChart data={perfilCompradores.idadeChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="crianca" fill={C(3)} isAnimationActive={false} />
              <Bar dataKey="jovem" fill={C(4)} isAnimationActive={false} />
              <Bar dataKey="adulto" fill={C(5)} isAnimationActive={false} />
              <Bar dataKey="idoso" fill={C(2)} isAnimationActive={false} />
            </BarChart>
          </ChartCard>
        </div>

        <SectionBand title="2. Fluxo de Pessoas por Dia da Semana" />
        <TableSectionFluxoDia data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 grid-print-2">
          <ChartCard
            title="Fluxo de pessoas por grupo"
            chartId="chart-fluxo-grupo"
          >
            <PieChart>
              <Pie data={fluxoGrupoPie} dataKey="value" nameKey="name" outerRadius={100} label isAnimationActive={false}>
                {fluxoGrupoPie.map((_, i) => (
                  <Cell key={i} fill={C((i % 5) + 1)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartCard>

          <ChartCard
            title="Fluxo de grupo de pessoas por dia da semana"
            chartId="chart-fluxo-dia"
          >
            <BarChart data={fluxoDiaChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendasRealizadas" fill={C(1)} isAnimationActive={false} />
              <Bar dataKey="acompanhantes" fill={C(2)} isAnimationActive={false} />
              <Bar dataKey="vendasPerdidasIdentificadas" fill={C(3)} isAnimationActive={false} />
              <Bar dataKey="possiveisVendasPerdidas" fill={C(4)} isAnimationActive={false} />
              <Bar dataKey="trocas" fill={C(5)} isAnimationActive={false} />
              <Bar dataKey="outros" fill={C(2)} isAnimationActive={false} />
            </BarChart>
          </ChartCard>
        </div>

        <SectionBand title="3. Fluxo de Pessoas por Semana" />
        <TableSectionFluxoSemana data={data} />
        <ChartCard
          title="Fluxo de pessoas por semana"
          chartId="chart-fluxo-semana"
        >
          <BarChart data={fluxoSemanaChart}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="semana" />
            <YAxis />
            <Tooltip />
            <Legend />
            {DIAS.map((dia, i) => (
              <Bar key={dia} dataKey={dia} fill={C((i % 5) + 1)} isAnimationActive={false} />
            ))}
          </BarChart>
        </ChartCard>

        <SectionBand title="4. Vendas Perdidas" />
        <TableSectionPerdas data={data} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 grid-print-2">
          <ChartCard
            title="Vendas perdidas por grupo"
            chartId="chart-perdas-grupo"
          >
            <PieChart>
              <Pie data={perdasPie} dataKey="value" nameKey="name" outerRadius={100} label isAnimationActive={false}>
                {perdasPie.map((_, i) => (
                  <Cell key={i} fill={C((i % 5) + 1)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartCard>
          <ChartCard
            title="Vendas perdidas por dia da semana"
            chartId="chart-perdas-dia"
          >
            <BarChart data={perdasDiaChart}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="preco" fill={C(1)} isAnimationActive={false} />
              <Bar dataKey="faltaMercadoria" fill={C(2)} isAnimationActive={false} />
              <Bar dataKey="modCorTamanho" fill={C(3)} isAnimationActive={false} />
              <Bar dataKey="formaPagamento" fill={C(4)} isAnimationActive={false} />
              <Bar dataKey="atendimento" fill={C(5)} isAnimationActive={false} />
              <Bar dataKey="outros" fill={C(2)} isAnimationActive={false} />
            </BarChart>
          </ChartCard>
        </div>

        <SectionBand title="5. Aproveitamento das Vendas - Fluxo de Pessoas x Numero de Vendas Realizadas" />
        <TableSectionAproveitamento data={data} />
        <ChartCard
          title="Fluxo de pessoas x vendas realizadas"
          chartId="chart-aproveitamento"
        >
          <BarChart data={aproveitamentoChart}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="fluxoPessoas" fill={C(1)} isAnimationActive={false} />
            <Bar dataKey="numeroVendas" fill={C(3)} isAnimationActive={false} />
          </BarChart>
        </ChartCard>
      </CardContent>
    </Card>
  );
}

function SectionBand({ title }: { title: string }) {
  return (
    <div className="aud-band">
      <span className="aud-band__title">{title}</span>
    </div>
  );
}

function ChartCard({
  title,
  children,
  chartId,
}: {
  title: string;
  children: React.ReactNode;
  chartId?: string;
}) {
  return (
    <Card className="chart-box" id={chartId}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="chart-card-content h-[340px]">
        <div className="chart-capture-area h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSectionPerfil({
  perfil,
}: {
  perfil: {
    rowsByDay: Record<DiaSemana, PerfilRow>;
    totalGeral: PerfilRow;
    participacaoPct?: {
      masculino: number;
      feminino: number;
      crianca: number;
      jovem: number;
      adulto: number;
      idoso: number;
      total: number;
    };
  };
}) {
  return (
    <div className="aud-table-wrap overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia da semana</TableHead>
            <TableHead>Masculino</TableHead>
            <TableHead>Feminino</TableHead>
            <TableHead>Crianca</TableHead>
            <TableHead>Jovem</TableHead>
            <TableHead>Adulto</TableHead>
            <TableHead>Idoso</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DIAS.map((dia) => {
            const row = perfil.rowsByDay[dia];
            return (
              <TableRow key={dia}>
                <TableCell>{dia}</TableCell>
                <TableCell>{n(row?.masculino)}</TableCell>
                <TableCell>{n(row?.feminino)}</TableCell>
                <TableCell>{n(row?.crianca)}</TableCell>
                <TableCell>{n(row?.jovem)}</TableCell>
                <TableCell>{n(row?.adulto)}</TableCell>
                <TableCell>{n(row?.idoso)}</TableCell>
                <TableCell>{n(row?.total)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell>{n(perfil.totalGeral.masculino)}</TableCell>
            <TableCell>{n(perfil.totalGeral.feminino)}</TableCell>
            <TableCell>{n(perfil.totalGeral.crianca)}</TableCell>
            <TableCell>{n(perfil.totalGeral.jovem)}</TableCell>
            <TableCell>{n(perfil.totalGeral.adulto)}</TableCell>
            <TableCell>{n(perfil.totalGeral.idoso)}</TableCell>
            <TableCell>{n(perfil.totalGeral.total)}</TableCell>
          </TableRow>
          {perfil.participacaoPct ? (
            <TableRow className="bg-muted/50">
              <TableCell>Participacao %</TableCell>
              <TableCell>{n(perfil.participacaoPct.masculino)}%</TableCell>
              <TableCell>{n(perfil.participacaoPct.feminino)}%</TableCell>
              <TableCell>{n(perfil.participacaoPct.crianca)}%</TableCell>
              <TableCell>{n(perfil.participacaoPct.jovem)}%</TableCell>
              <TableCell>{n(perfil.participacaoPct.adulto)}%</TableCell>
              <TableCell>{n(perfil.participacaoPct.idoso)}%</TableCell>
              <TableCell>{n(perfil.participacaoPct.total)}%</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSectionFluxoDia({ data }: { data: RelatorioMensalData }) {
  return (
    <div className="aud-table-wrap overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia da semana</TableHead>
            <TableHead>Vendas realizadas</TableHead>
            <TableHead>Acompanhantes</TableHead>
            <TableHead>Vendas perdidas identificadas</TableHead>
            <TableHead>Possiveis vendas perdidas</TableHead>
            <TableHead>Trocas</TableHead>
            <TableHead>Outros</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DIAS.map((dia) => {
            const row = data.fluxoPessoasPorDiaSemana.rows[dia];
            return (
              <TableRow key={dia}>
                <TableCell>{dia}</TableCell>
                <TableCell>{n(row?.vendasRealizadas)}</TableCell>
                <TableCell>{n(row?.acompanhantes)}</TableCell>
                <TableCell>{n(row?.vendasPerdidasIdentificadas)}</TableCell>
                <TableCell>{n(row?.possiveisVendasPerdidas)}</TableCell>
                <TableCell>{n(row?.trocas)}</TableCell>
                <TableCell>{n(row?.outros)}</TableCell>
                <TableCell>{n(row?.total)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasRealizadas)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.acompanhantes)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasPerdidasIdentificadas)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.possiveisVendasPerdidas)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.trocas)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.outros)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorDiaSemana.totalGeral.total)}</TableCell>
          </TableRow>
          {data.fluxoPessoasPorDiaSemana.participacaoPct ? (
            <TableRow className="bg-muted/50">
              <TableCell>Participacao %</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.vendasRealizadas)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.acompanhantes)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.vendasPerdidasIdentificadas)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.possiveisVendasPerdidas)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.trocas)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.outros)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorDiaSemana.participacaoPct.total)}%</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSectionFluxoSemana({ data }: { data: RelatorioMensalData }) {
  return (
    <div className="aud-table-wrap overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia da semana</TableHead>
            <TableHead>1a semana</TableHead>
            <TableHead>2a semana</TableHead>
            <TableHead>3a semana</TableHead>
            <TableHead>4a semana</TableHead>
            <TableHead>5a semana</TableHead>
            <TableHead>6a semana</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DIAS.map((dia) => {
            const row = data.fluxoPessoasPorSemana.rows[dia];
            return (
              <TableRow key={dia}>
                <TableCell>{dia}</TableCell>
                <TableCell>{n(row?.w1)}</TableCell>
                <TableCell>{n(row?.w2)}</TableCell>
                <TableCell>{n(row?.w3)}</TableCell>
                <TableCell>{n(row?.w4)}</TableCell>
                <TableCell>{n(row?.w5)}</TableCell>
                <TableCell>{n(row?.w6)}</TableCell>
                <TableCell>{n(row?.total)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.w1)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.w2)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.w3)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.w4)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.w5)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.w6)}</TableCell>
            <TableCell>{n(data.fluxoPessoasPorSemana.totalGeral.total)}</TableCell>
          </TableRow>
          {data.fluxoPessoasPorSemana.participacaoPct ? (
            <TableRow className="bg-muted/50">
              <TableCell>Participacao %</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.w1)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.w2)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.w3)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.w4)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.w5)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.w6)}%</TableCell>
              <TableCell>{n(data.fluxoPessoasPorSemana.participacaoPct.total)}%</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSectionPerdas({ data }: { data: RelatorioMensalData }) {
  return (
    <div className="aud-table-wrap overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia da semana</TableHead>
            <TableHead>Preco</TableHead>
            <TableHead>Falta de mercadoria</TableHead>
            <TableHead>Mod/cor/tamanho</TableHead>
            <TableHead>Forma de pagamento</TableHead>
            <TableHead>Atendimento</TableHead>
            <TableHead>Outros</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DIAS.map((dia) => {
            const row = data.vendasPerdidasPorDiaSemana.rows[dia];
            return (
              <TableRow key={dia}>
                <TableCell>{dia}</TableCell>
                <TableCell>{n(row?.preco)}</TableCell>
                <TableCell>{n(row?.faltaMercadoria)}</TableCell>
                <TableCell>{n(row?.modCorTamanho)}</TableCell>
                <TableCell>{n(row?.formaPagamento)}</TableCell>
                <TableCell>{n(row?.atendimento)}</TableCell>
                <TableCell>{n(row?.outros)}</TableCell>
                <TableCell>{n(row?.total)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.preco)}</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.faltaMercadoria)}</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.modCorTamanho)}</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.formaPagamento)}</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.atendimento)}</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.outros)}</TableCell>
            <TableCell>{n(data.vendasPerdidasPorDiaSemana.totalGeral.total)}</TableCell>
          </TableRow>
          {data.vendasPerdidasPorDiaSemana.participacaoPct ? (
            <TableRow className="bg-muted/50">
              <TableCell>Participacao %</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.preco)}%</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.faltaMercadoria)}%</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.modCorTamanho)}%</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.formaPagamento)}%</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.atendimento)}%</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.outros)}%</TableCell>
              <TableCell>{n(data.vendasPerdidasPorDiaSemana.participacaoPct.total)}%</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSectionAproveitamento({ data }: { data: RelatorioMensalData }) {
  return (
    <div className="aud-table-wrap overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia da semana</TableHead>
            <TableHead>Fluxo de pessoas</TableHead>
            <TableHead>No de vendas realizadas</TableHead>
            <TableHead>Aproveitamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DIAS.map((dia) => {
            const row = data.aproveitamentoVendas.rows[dia];
            return (
              <TableRow key={dia}>
                <TableCell>{dia}</TableCell>
                <TableCell>{n(row?.fluxoPessoas)}</TableCell>
                <TableCell>{n(row?.numeroVendas)}</TableCell>
                <TableCell>{n(row?.aproveitamento).toFixed(2)}%</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell>{n(data.aproveitamentoVendas.totalGeral.fluxoPessoas)}</TableCell>
            <TableCell>{n(data.aproveitamentoVendas.totalGeral.numeroVendas)}</TableCell>
            <TableCell>{n(data.aproveitamentoVendas.totalGeral.aproveitamento).toFixed(2)}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

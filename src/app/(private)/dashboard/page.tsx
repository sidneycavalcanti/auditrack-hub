"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Store,
  Calendar,
  ClipboardCheck,
  Users,
  AlertTriangle,
  DollarSign,
  Award,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { relatorioAPI } from "@/services/api";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

import LojaFormDialog from "../lojas/components/LojaFormDialog";
import type { Loja } from "@/types";

import AuditoriaFormDialog from "../auditorias/components/AuditoriaFormDialog";
import type { Auditoria } from "@/types";

type DashboardScope = "mes" | "ano";

type DashboardPayload = {
  meta?: {
    scope?: DashboardScope;
    mes?: number;
    ano?: number;
    lojaId?: number;
    lojaCodigo?: number;
    lojaNome?: string;
  };
  kpis?: {
    totalAuditorias?: number;
    auditoriasPendentes?: number;
    totalVendasValor?: number;
    totalVendasCount?: number;
    pontuacaoMedia?: number;
  };
  charts?: {
    auditoriasPorMes?: Array<{ label: string; mes?: number; ano?: number; total?: number; totalAuditorias?: number }>;
    formasPagamento?: Array<{ name: string; value: number }>;
  };
};

type PieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  payload?: { name?: string };
};

const PIE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#9333ea", "#0f766e"];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, "0"),
}));

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: PieLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${payload?.name ?? ""} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const toCurrencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value || 0);

const Dashboard: React.FC = () => {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [scope, setScope] = useState<DashboardScope>("mes");
  const [selectedMes, setSelectedMes] = useState<number>(currentMonth);
  const [selectedAno, setSelectedAno] = useState<number>(currentYear);
  const [open, setOpen] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
  const yearOptions = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => currentYear - i);
  }, [currentYear]);

  const {
    data: dashboard,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["relatorio-dashboard", scope, selectedMes, selectedAno],
    enabled: true,
    queryFn: async () => {
      const params: { scope: DashboardScope; mes?: number; ano?: number } = {
        scope,
      };

      if (scope === "mes") {
        const isCurrentMonth = selectedMes === currentMonth && selectedAno === currentYear;
        if (!isCurrentMonth) {
          params.mes = selectedMes;
          params.ano = selectedAno;
        }
      } else {
        const isCurrentYear = selectedAno === currentYear;
        if (!isCurrentYear) params.ano = selectedAno;
      }

      const response = await relatorioAPI.dashboard(params);
      return (response.data ?? {}) as DashboardPayload;
    },
    staleTime: 60 * 1000,
  });

  const kpis = dashboard?.kpis ?? {};
  const auditoriasPorMes = (dashboard?.charts?.auditoriasPorMes ?? []).map((item) => ({
    name: item.label,
    value: Number(item.totalAuditorias ?? item.total) || 0,
  }));

  const formasPagamento = (dashboard?.charts?.formasPagamento ?? []).map((item, idx) => ({
    name: item.name,
    value: Number(item.value) || 0,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  const handleCreate = () => {
    setSelectedAuditoria(null);
    setOpen(true);
  };

  const loadingDashboard = isLoading || isFetching;

  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visao geral das auditorias e indicadores de performance</p>
          {dashboard?.meta?.lojaNome ? (
            <p className="text-xs text-muted-foreground mt-1">
              Loja: {dashboard.meta.lojaNome} (ID {dashboard.meta.lojaId})
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Escopo: geral (sem filtro de loja)</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-3">
            <Button
              variant={scope === "mes" ? "premium" : "outline"}
              onClick={() => setScope("mes")}
              disabled={loadingDashboard}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mes
            </Button>
            <Button
              variant={scope === "ano" ? "premium" : "outline"}
              onClick={() => setScope("ano")}
              disabled={loadingDashboard}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Ano Completo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={String(selectedMes)}
              onValueChange={(v) => setSelectedMes(Number(v))}
              disabled={scope !== "mes" || loadingDashboard}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(selectedAno)} onValueChange={(v) => setSelectedAno(Number(v))} disabled={loadingDashboard}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="bg-gradient-card shadow-card border-destructive/50">
          <CardContent className="py-6 text-sm text-destructive">
            Erro ao carregar dashboard de relatorio.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Auditorias"
          value={kpis.totalAuditorias ?? 0}
          description="Auditorias realizadas"
          icon={ClipboardCheck}
          loading={loadingDashboard}
        />
        <StatsCard
          title="Auditorias Pendentes"
          value={kpis.auditoriasPendentes ?? 0}
          description="Aguardando execucao"
          icon={AlertTriangle}
          loading={loadingDashboard}
        />
        <StatsCard
          title="Total de Vendas"
          value={toCurrencyBRL(kpis.totalVendasValor ?? 0)}
          description={`Quantidade de vendas: ${kpis.totalVendasCount ?? 0}`}
          icon={DollarSign}
          loading={loadingDashboard}
        />
        <StatsCard
          title="Pontuacao Media"
          value={Number(kpis.pontuacaoMedia ?? 0).toFixed(1)}
          description="Score de conformidade"
          icon={Award}
          loading={loadingDashboard}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Auditorias por Mes
            </CardTitle>
            <CardDescription>Evolucao mensal das auditorias realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ReBarChart data={auditoriasPorMes}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Formas de Pagamento
            </CardTitle>
            <CardDescription>Distribuicao das vendas por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={formasPagamento}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={130}
                  dataKey="value"
                >
                  {formasPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
          <CardDescription>Acesso direto as funcionalidades mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button onClick={handleCreate} variant="outline" className="h-20 flex-col gap-2 cursor-pointer">
              <Calendar className="h-6 w-6" />
              <span>Nova Auditoria</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 cursor-pointer"
              onClick={() => {
                setSelectedLoja(null);
                setDialogOpen(true);
              }}
            >
              <Store className="h-6 w-6" />
              <span>Cadastrar Loja</span>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 cursor-pointer">
              <Link href="/usuarios">
                <Users className="h-6 w-6" />
                <span>Gerenciar Usuarios</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 cursor-pointer">
              <Link href="/relatorios/auditoria-loja">
                <TrendingUp className="h-6 w-6" />
                <span>Relatorios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AuditoriaFormDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSelectedAuditoria(null);
        }}
        initialData={selectedAuditoria}
      />

      <LojaFormDialog
        open={dialogOpen}
        onOpenChange={(openValue) => {
          setDialogOpen(openValue);
          if (!openValue) setSelectedLoja(null);
        }}
        initialData={selectedLoja}
      />
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, icon: Icon, trend, trendUp, loading }) => (
  <Card className="bg-gradient-card shadow-card transition-smooth hover:shadow-hover">
    <CardContent className="px-6 py-0">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {trend ? <span className={`text-sm font-medium ${trendUp ? "text-success" : "text-destructive"}`}>{trend}</span> : null}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{loading ? "..." : value}</h3>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;

"use client";

import Link from "next/link";
import React, { useState } from "react";
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
  LineChart as ReLineChart,
  Line,
} from "recharts";


import LojaFormDialog from "../lojas/components/LojaFormDialog";
import type { Loja } from "@/types";


import AuditoriaFormDialog from "../auditorias/components/AuditoriaFormDialog";
import type { Auditoria } from "@/types";

// mocks (ok)
const mockStats = {
  totalAuditorias: 142,
  auditoriasPendentes: 8,
  auditoriasFinalizadas: 134,
  totalLojas: 25,
  totalVendas: 450000,
  totalPerdas: 12500,
  mediaPontuacao: 8.7,
};

const mockChartData = {
  auditoriasPorMes: [
    { name: "Jan", value: 65 },
    { name: "Fev", value: 59 },
    { name: "Mar", value: 80 },
    { name: "Abr", value: 81 },
    { name: "Mai", value: 56 },
    { name: "Jun", value: 55 },
  ],
  formasPagamento: [
    { name: "Dinheiro", value: 35, color: "#2563eb" },
    { name: "Cartão Débito", value: 30, color: "#16a34a" },
    { name: "Cartão Crédito", value: 25, color: "#dc2626" },
    { name: "Pix", value: 10, color: "#f59e0b" },
  ],
  pontuacaoTendencia: [
    { name: "Sem 1", value: 8.2 },
    { name: "Sem 2", value: 8.5 },
    { name: "Sem 3", value: 8.1 },
    { name: "Sem 4", value: 8.7 },
    { name: "Sem 5", value: 8.9 },
    { name: "Sem 6", value: 8.7 },
  ],
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${payload?.name ?? ""} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Dashboard: React.FC = () => {
  // ✅ hooks dentro do componente
  const [open, setOpen] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);


  const handleCreate = () => {
    setSelectedAuditoria(null);
    setOpen(true);
  };
  

  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das auditorias e indicadores de performance</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Este Mês
          </Button>
          <Button variant="premium">
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatório Completo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total de Auditorias" value={mockStats.totalAuditorias} description="Auditorias realizadas" icon={ClipboardCheck} trend="+12%" trendUp />
        <StatsCard title="Auditorias Pendentes" value={mockStats.auditoriasPendentes} description="Aguardando execução" icon={AlertTriangle} trend="-5%" trendUp={false} />
        <StatsCard title="Total de Vendas" value={`R$ ${(mockStats.totalVendas / 1000).toFixed(0)}k`} description="Vendas auditadas" icon={DollarSign} trend="+18%" trendUp />
        <StatsCard title="Pontuação Média" value={mockStats.mediaPontuacao.toFixed(1)} description="Score de conformidade" icon={Award} trend="+2.3%" trendUp />
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Auditorias por Mês
            </CardTitle>
            <CardDescription>Evolução mensal das auditorias realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ReBarChart data={mockChartData.auditoriasPorMes}>
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
            <CardDescription>Distribuição das vendas por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={mockChartData.formasPagamento}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={130}
                  dataKey="value"
                >
                  {mockChartData.formasPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso direto às funcionalidades mais utilizadas</CardDescription>
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
                    }}>
              <Store className="h-6 w-6" />
              <span>Cadastrar Loja</span>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 cursor-pointer">
              <Link href="/usuarios">
                <Users className="h-6 w-6" />
                <span>Gerenciar Usuários</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 cursor-pointer">
              <Link href="/relatorios/auditoria-loja">
                <TrendingUp className="h-6 w-6" />
                <span>Relatórios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Modal Auditoria */}
      <AuditoriaFormDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSelectedAuditoria(null);
        }}
        initialData={selectedAuditoria}
      />

      {/* ✅ Modal Loja */}
      <LojaFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedLoja(null);
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
  icon: React.ComponentType<any>;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, icon: Icon, trend, trendUp }) => (
  <Card className="bg-gradient-card shadow-card transition-smooth hover:shadow-hover">
    <CardContent className="px-6 py-0">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {trend && <span className={`text-sm font-medium ${trendUp ? "text-success" : "text-destructive"}`}>{trend}</span>}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;

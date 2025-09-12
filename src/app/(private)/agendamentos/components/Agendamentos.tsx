"use client"
import React, { useState } from 'react';
import { Calendar, Plus, Search, Edit, Trash2, Clock, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos, useDeleteAgendamento } from '../hooks/useAgendamentos';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Agendamento } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Agendamentos: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

    const { data: agendamentos, isLoading } = useAgendamentos({ search: searchTerm });
    const { mutate: deleteAgendamento } = useDeleteAgendamento();

    const handleEdit = (agendamento: Agendamento) => {
        setSelectedAgendamento(agendamento);
        // TODO: Abrir modal de edição
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
            deleteAgendamento(id);
        }
    };

    const getStatusVariant = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'agendado':
                return 'default';
            case 'em_andamento':
                return 'warning';
            case 'concluido':
                return 'success';
            case 'cancelado':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'agendado':
                return 'text-primary';
            case 'em_andamento':
                return 'text-warning';
            case 'concluido':
                return 'text-success';
            case 'cancelado':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        try {
            return format(parseISO(`2024-01-01T${timeString}`), 'HH:mm');
        } catch {
            return timeString;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" text="Carregando agendamentos..." />
            </div>
        );
    }

    const filteredAgendamentos = agendamentos?.filter((agendamento: Agendamento) =>
        agendamento.loja?.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agendamento.usuario?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agendamento.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Calendar className="h-8 w-8" />
                        Agendamentos
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie os agendamentos de auditoria
                    </p>
                </div>

                <Button variant="premium" size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                </Button>
            </div>

            {/* Filtros */}
            <Card className="bg-gradient-card shadow-card">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por loja, usuário ou observações..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline">
                            Filtros Avançados
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Agendamentos */}
            {filteredAgendamentos.length === 0 ? (
                <EmptyState
                    icon="calendar"
                    title="Nenhum agendamento encontrado"
                    description={searchTerm ?
                        "Não encontramos agendamentos com os filtros aplicados." :
                        "Ainda não há agendamentos cadastrados. Clique em 'Novo Agendamento' para começar."
                    }
                    action={{
                        label: 'Novo Agendamento',
                        onClick: () => console.log('Novo agendamento'),
                    }}
                />
            ) : (
                <div className="grid gap-6">
                    {filteredAgendamentos.map((agendamento: Agendamento) => (
                        <Card key={agendamento.id} className="bg-gradient-card shadow-card transition-smooth hover:shadow-hover">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            Auditoria #{agendamento.id}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(agendamento.data)} às {formatTime(agendamento.hora)}
                                            </div>
                                            {agendamento.loja && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {agendamento.loja.descricao}
                                                </div>
                                            )}
                                            {agendamento.usuario && (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    {agendamento.usuario.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Badge
                                        variant={getStatusVariant(agendamento.status)}
                                        className="capitalize"
                                    >
                                        {agendamento.status?.replace('_', ' ') || 'Agendado'}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-4">
                                    {agendamento.observacoes && (
                                        <div>
                                            <h4 className="text-sm font-medium text-foreground mb-2">
                                                Observações
                                            </h4>
                                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                                {agendamento.observacoes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(agendamento)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            disabled={agendamento.status === 'concluido'}
                                        >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Iniciar Auditoria
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(agendamento.id)}
                                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {filteredAgendamentos.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-warning/10 rounded-lg">
                                <Clock className="h-6 w-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {filteredAgendamentos.filter((a: Agendamento) => a.status === 'agendado').length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Agendados
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-success/10 rounded-lg">
                                <Calendar className="h-6 w-6 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {filteredAgendamentos.filter((a: Agendamento) => a.status === 'concluido').length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Concluídos
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <Calendar className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {filteredAgendamentos.filter((a: Agendamento) => a.status === 'cancelado').length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Cancelados
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Agendamentos;
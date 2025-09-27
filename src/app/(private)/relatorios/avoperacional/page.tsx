// src/app/(private)/relatorios/avoperacional/page.tsx
"use client";
import * as React from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AvOperacionalTable from "./components/AvOperacionalTable";
import {
    useAvaliacoesOperacional,
    applyAvOpFilters,
    type AvOperacionalFilters,
} from "./hooks/useAvOperacional";

import { MessageSquareWarning } from "lucide-react"

// filtros para os gráficos
import AvOpChartsFilters from "./components/ChartsFilters";

// gráficos já componentizados
import ChartEvolucaoDia from "./components/charts/ChartEvolucaoDia";
import ChartDistribuicaoNotas from "./components/charts/ChartDistribuicaoNotas";
import ChartMediaPorLoja from "./components/charts/ChartMediaPorLoja";
import ChartMediaPorQuestao from "./components/charts/ChartMediaPorQuestao";
import ChartRadarComparativo from "./components/charts/ChartRadarComparativo";

export default function ClientRelatorioAvOperacional() {
    // estado dos filtros (compartilhado pelos gráficos)
    const [filters, setFilters] = React.useState<AvOperacionalFilters>({
        page: 1,
        limit: 200,
    });

    // busca do backend já recebendo os filtros (se a API suportar)
    const { data, isLoading } = useAvaliacoesOperacional(filters);
    const items = data?.data ?? [];

    // fallback/local: aplica novamente os filtros no client (seguro e idempotente)
    const filtered = React.useMemo(
        () => applyAvOpFilters(items, filters),
        [items, filters]
    );

    const onChangeFilters = (patch: Partial<AvOperacionalFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch, page: 1 }));

    const clearFilters = () => setFilters({ page: 1, limit: 200 });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner
                    size="lg"
                    text="Carregando relatórios de avaliação operacional..."
                />
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-2">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                        Avaliação Operacional
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie relatório de avaliação operacional
                    </p>
                </div>
            </div>

            {/* Tabela (mantém filtros próprios e paginação local) */}
            <AvOperacionalTable items={items} />

            {/* Filtros que controlam os gráficos */}
            <AvOpChartsFilters
                items={items}        // usado para popular selects (auditor/loja/questão/item)
                value={filters}
                onChange={onChangeFilters}
                onClear={clearFilters}
            />

            {/* Gráficos recebem o array já filtrado */}
            <div className="grid gap-3 lg:grid-cols-3">
                <ChartEvolucaoDia items={filtered} />
                <ChartRadarComparativo items={filtered} />
                <ChartMediaPorLoja items={filtered} />
                <ChartMediaPorQuestao items={filtered} />
                <ChartDistribuicaoNotas items={filtered} />
            </div>
        </div>
    );
}

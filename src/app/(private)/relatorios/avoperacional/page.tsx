// src/app/(private)/relatorios/avoperacional/page.tsx
"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { AvOperacionalChartsPreview } from "./components/AvOperacionalCharts";
import { useAvaliacoesOperacional } from "./hooks/useAvOperacional";
import AvOperacionalTable from "./components/AvOperacionalTable";

export default function ClientRelatorioAvOperacional() {
    const { data, isLoading } = useAvaliacoesOperacional({ page: 1, limit: 200 });

    const items = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando relatórios de avaliação operacional..." />
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-2">
            <AvOperacionalTable items={items} />
            <AvOperacionalChartsPreview items={items} />
        </div>
    );
}
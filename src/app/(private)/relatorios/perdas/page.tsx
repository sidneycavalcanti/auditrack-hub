// src/app/(private)/relatorios/perdas/page.tsx
"use client";

import TablePerdaVendas from "./components/TablePerdaVendas";

export default function RelatorioPerdasVendaPage() {
    return (
        <div className="space-y-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold text-foreground">Relatório de Perdas</h1>
            </div>

            <TablePerdaVendas />
        </div>
    );
}
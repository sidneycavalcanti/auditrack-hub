// src/app/(private)/relatorios/pausas/page.tsx
"use client";

import TablePausas from "./components/TablePausas";

export default function RelatorioPausasPage() {
  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-foreground">Relatório de Pausas</h1>
      </div>

      <TablePausas />
    </div>
  );
}
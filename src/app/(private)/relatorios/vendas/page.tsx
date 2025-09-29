"use client";
import TabelaResumoVendas from "./components/TabelaResumoVendas";

export default function RelatorioVendas() {
  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  {/* <ClipboardList className="h-8 w-8" /> */}
                  Relatórios de vendas
              </h1>
          </div>
      </div>
      <TabelaResumoVendas />
    </div>
  );
}
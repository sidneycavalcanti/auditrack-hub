// FILE: src/app/(private)/relatorios/auditoria-loja/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelatorioAuditoria from "../auditoria-loja/components/RelatorioAuditoria";
import type { AudReportData } from "./types/auditoria";

const data: AudReportData = {
    meta: { loja: "LA CAMICERIA", muc: "005/6", mes: "Junho", ano: 2022 },
    perfilFrequentador: { feminino: 51.3, masculino: 48.7, turnos: { manha: 23.5, tarde: 43.2, noite: 33.3 } },
    perfilComprador: { feminino: 49.0, masculino: 51.0, turnos: { manha: 26.0, tarde: 43.3, noite: 30.7 } },
    montanteGenero: { masculino: 77439.28, feminino: 52686.93 },
    clientesCompraram: { fem: 177, masc: 184, total: 361 },
    clientesCompraramVsNao: { compraram: 553, naoCompraram: 361, total: 914 },
    conversaoGeral: { totalFluxo: 914, totalVendas: 346, aproveitamento: 0.3786 },
    conversaoPorDia: [
        { dia: "Segunda-feira", fluxo: 146, vendas: 53, aproveitamento: 0.3630 },
        // ...preencher os demais dias como no modelo
    ],
    ticketMedioGeral: 365.07,
    ticketMedioPorTurno: [
        { turno: "Manhã", valor: 371.66 }, { turno: "Tarde", valor: 340.81 }, { turno: "Noite", valor: 365.07 },
    ],
    ticketMedioPorDia: [
        { dia: "Domingo", valor: 210.91 }, /* ... */
    ],
    intervalos: [
        { faixa: "09/10h", valores: { "Domingo": "-", "Segunda-feira": "-", "Terça-feira": "-", "Quarta-feira": "-", "Quinta-feira": "-", "Sexta-feira": "-", "Sábado": "-" }, total: 0, pct: 0 },
        // ...demais faixas com total e pct calculados
    ],
    motivosPerda: [
        { motivo: "Modelo", pct: 10 }, { motivo: "Tamanho", pct: 20 }, /* ... */
    ],
    avaliacaoOperacional: { /* opcional: texto estruturado */ }
};

export default function Page() {
    return (
        <div className="space-y-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden">
                <h1 className="text-3xl font-bold text-foreground">Relatório de Auditoria do Lojista</h1>
            </div>
            <Tabs defaultValue="relatorio-loja" className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex print:hidden bg-gradient-card h-auto shadow-card">
                    <TabsTrigger className="cursor-pointer" value="relatorio-loja">Relatorio de loja</TabsTrigger>
                </TabsList>
                <TabsContent value="relatorio-loja">
                    <RelatorioAuditoria data={data} />
                </TabsContent>
            </Tabs>

        </div>

    );
}
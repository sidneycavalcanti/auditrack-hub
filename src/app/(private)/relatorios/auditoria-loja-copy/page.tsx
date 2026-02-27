import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelatorioAuditoriaSearch from "./components/RelatorioAuditoriaSearch";

export default function Page() {
  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h1 className="text-3xl font-bold text-foreground">
          Relatório de Auditoria do Lojista
        </h1>
      </div>

      <Tabs defaultValue="relatorio-loja" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:inline-flex print:hidden bg-gradient-card h-auto shadow-card">
          <TabsTrigger value="relatorio-loja">
            Relatório de loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio-loja">
          <RelatorioAuditoriaSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
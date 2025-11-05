// FILE: src/app/(private)/relatorios/fluxos/page.tsx
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PerfilClientes from "./components/PerfilClientes";
import FluxoPorDia from "./components/FluxoPorDia";
import FluxoPorSemana from "./components/FluxoPorSemana";

export default function RelatoriosFluxoPage() {
    return (
        <div className="space-y-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden">
                <h1 className="text-3xl font-bold text-foreground">Relatórios de Fluxo</h1>
            </div>

            <Tabs defaultValue="perfil" className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex print:hidden bg-gradient-card h-auto shadow-card">
                    <TabsTrigger className="cursor-pointer" value="perfil">Perfil de Clientes</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="por-dia">Fluxo por Dia</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="por-semana">Fluxo por Semana</TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" >
                    <PerfilClientes />
                </TabsContent>

                <TabsContent value="por-dia" >
                    <FluxoPorDia />
                </TabsContent>

                <TabsContent value="por-semana" >
                    <FluxoPorSemana />
                </TabsContent>
            </Tabs>
        </div>
    );
}
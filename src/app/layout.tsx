import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layouts/providers";

export const metadata: Metadata = {
  title: "Sistema de Auditoria - Gestão Completa",
  description:
    "Sistema completo para gestão de auditorias de lojas - Controle de agendamentos, relatórios e indicadores de performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="dark">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

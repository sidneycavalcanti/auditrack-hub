import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/layouts/providers";

export const metadata: Metadata = {
  title: "Sistema de Auditoria",
  description:
    "Sistema completo para gestao de auditorias de lojas - Controle de agendamentos, relatorios e indicadores de performance",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="dark scrollbar-custom">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


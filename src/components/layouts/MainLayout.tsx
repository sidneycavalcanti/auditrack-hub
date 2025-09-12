"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Layout principal para páginas privadas.
 * Sugestão de uso (App Router):
 * 
 * // src/app/(private)/layout.tsx
 * export default function PrivateLayout({ children }: { children: React.ReactNode }) {
 *   return <MainLayout>{children}</MainLayout>;
 * }
 */
interface Props {
    children: React.ReactNode;
    className?: string;
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children, className, header, sidebar }) => {
    return (
        <div className={cn("min-h-dvh bg-background text-foreground", className)}>
            {/* Header (opcional) */}
            {header ?? (
                <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
                    <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
                        <div className="text-sm font-medium">Auditrack Hub</div>
                    </div>
                </header>
            )}

            {/* Shell */}
            <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 gap-0 px-4 md:grid-cols-[240px_1fr] md:gap-6 md:px-6 py-4">
                {/* Sidebar (opcional) */}
                {sidebar ? (
                    <aside className="hidden md:block">
                        {sidebar}
                    </aside>
                ) : (
                    <aside className="hidden md:block rounded-lg border bg-card p-4">
                        <div className="text-sm text-muted-foreground">Sidebar</div>
                    </aside>
                )}

                {/* Main */}
                <main className="min-h-[70dvh]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
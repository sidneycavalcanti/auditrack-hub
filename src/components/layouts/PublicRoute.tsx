// src/components/layouts/PublicRoute.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface PublicRouteProps {
    children: React.ReactNode;
}

/**
 * Exemplo de uso (p.ex. em /login/page.tsx):
 * export default function Page() {
 *   return (
 *     <PublicRoute>
 *       <LoginForm />
 *     </PublicRoute>
 *   )
 * }
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    // Já autenticado? vai para dashboard ("/")
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
                <LoadingSpinner size="lg" text="Carregando..." />
            </div>
        );
    }

    // Enquanto redireciona, evita piscar conteúdo
    if (isAuthenticated) return null;

    return <>{children}</>;
};

export default PublicRoute;
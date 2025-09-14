// src/components/layouts/ProtectedRoute.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import MainLayout from "@/components/layouts/MainLayout";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Uso (App Router):
 *   export default function Page() {
 *     return (
 *       <ProtectedRoute>
 *         <MinhaPaginaPrivada />
 *       </ProtectedRoute>
 *     )
 *   }
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, user } = useAuth();

    // Redireciona no client quando terminar o carregamento e não estiver autenticado
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const from = pathname ? `?from=${encodeURIComponent(pathname)}` : "";
            router.replace(`/login${from}`);
        }
    }, [isLoading, isAuthenticated, pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard">
                <LoadingSpinner size="lg" text="Carregando..." />
            </div>
        );
    }

    // Enquanto redireciona, não renderiza nada
    if (!isAuthenticated) return null;

    return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;
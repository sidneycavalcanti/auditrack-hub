"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Props {
    children: React.ReactNode;
}

/**
 * Uso no App Router:
 * export default function Page() {
 *   return (
 *     <ProtectedRoute>
 *       <SuaPaginaPrivada />
 *     </ProtectedRoute>
 *   )
 * }
 */
const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <LoadingSpinner label="Checando autenticação..." />;
    if (!isAuthenticated) return null;

    return <>{children}</>;
};

export default ProtectedRoute;
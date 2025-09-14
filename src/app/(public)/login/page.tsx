// src/app/(public)/login/page.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next"; // <- importa o tipo Route
import { ClipboardCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PublicRoute from "@/components/layouts/PublicRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, isLoading } = useAuth();

    const [showPassword, setShowPassword] = React.useState(false);
    const [credentials, setCredentials] = React.useState({ name: "", senha: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credentials.name || !credentials.senha) return;

        const ok = await signIn(credentials);
        if (ok) {
            // se vier de rota protegida, volta pra ela; senão vai pro dashboard
            const from = searchParams.get("from");
            const safeDest =
                from && from.startsWith("/") ? (from as Route) : ("/" as Route);
            router.replace(safeDest);
        }
    };

    const handleInputChange =
        (field: "name" | "senha") =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setCredentials((prev) => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <PublicRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard p-4">
            <div className="w-full max-w-md">
                <Card className="bg-gradient-card shadow-hover border-0">
                    <CardHeader className="text-center pb-8">
                        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 shadow-primary">
                            <ClipboardCheck className="h-8 w-8 text-primary-foreground" />
                        </div>

                        <CardTitle className="text-2xl font-bold">
                            Sistema de Auditoria
                        </CardTitle>
                        <CardDescription className="text-base">
                            Faça login para acessar o sistema
                        </CardDescription>
                    </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Usuário
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Digite seu usuário"
                                value={credentials.name}
                                onChange={handleInputChange("name")}
                                disabled={isLoading}
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="senha" className="text-sm font-medium">
                                Senha
                            </Label>
                            <div className="relative">
                                <Input
                                    id="senha"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Digite sua senha"
                                    value={credentials.senha}
                                    onChange={handleInputChange("senha")}
                                    disabled={isLoading}
                                    className="h-11 pr-10"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-11 w-10 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>

                        <CardFooter className="pt-6">
                            <Button
                                type="submit"
                                variant="premium"
                                size="lg"
                                className="w-full"
                                disabled={isLoading || !credentials.name || !credentials.senha}
                            >
                                {isLoading ? <LoadingSpinner size="lg" text="Entrando..." /> : "Entrar"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Credenciais de teste */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground mb-2">
                        Credenciais para teste:
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                            <strong>Usuário:</strong> sidney
                        </p>
                        <p>
                            <strong>Senha:</strong> 123
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </PublicRoute>
    );
}
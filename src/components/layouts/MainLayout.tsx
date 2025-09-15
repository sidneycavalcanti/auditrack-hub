// src/components/layouts/MainLayout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Store,
    Calendar,
    Users,
    Tag,
    ClipboardCheck,
    CreditCard,
    FileText,
    AlertCircle,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
    children: React.ReactNode;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Lojas", href: "/lojas", icon: Store },
    // { name: "Agendamentos", href: "/agendamentos", icon: Calendar },
    { name: "Usuários", href: "/usuarios", icon: Users },
    { name: "Categorias", href: "/categorias", icon: Tag },
    { name: "Auditorias", href: "/auditorias", icon: ClipboardCheck },
    { name: "Formas de Pagamento", href: "/formas-pagamento", icon: CreditCard },
    { name: "Avaliação Operacional", href: "/cad-av-operacional", icon: Settings },
    { name: "Cadastro de Questões", href: "/cad-questoes", icon: FileText },
    { name: "Motivo de perdas", href: "/motivo-perdas", icon: AlertCircle },
    { name: "Motivo de pausas", href: "/motivo-pausas", icon: Settings },
    { name: "Relatórios", href: "/relatorios", icon: FileText },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { user, signOut } = useAuth();

    const isActive = React.useCallback(
        (href: string) => {
            if (href === "/") return pathname === "/";
            return pathname?.startsWith(href);
        },
        [pathname]
    );

    return (
        <div className="min-h-screen bg-gradient-dashboard">
            {/* Sidebar mobile (overlay) */}
            <div
                className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}
                aria-hidden={!sidebarOpen}
            >
                <div
                    className="fixed inset-0 bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
                <div className="fixed left-0 top-0 h-full w-64 bg-card shadow-2xl">
                    <SidebarContent
                        navigation={navigation}
                        user={user}
                        signOut={signOut}
                        isActive={isActive}
                        onClose={() => setSidebarOpen(false)}
                    />
                </div>
            </div>

            {/* Sidebar desktop */}
            <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-card z-30">
                <SidebarContent
                    navigation={navigation}
                    user={user}
                    signOut={signOut}
                    isActive={isActive}
                />
            </div>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Abrir menu"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>

                            <div>
                                <h1 className="text-xl font-bold text-foreground">Sistema de Auditoria</h1>
                                <p className="text-sm text-muted-foreground">Gestão completa de auditorias</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                                <p className="text-xs text-muted-foreground">{(user as any)?.categoria}</p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={signOut}
                                className="text-muted-foreground hover:text-destructive cursor-pointer"
                                aria-label="Sair"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
};

interface SidebarContentProps {
    navigation: NavItem[];
    user: any;
    signOut: () => void;
    isActive: (href: string) => boolean;
    onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
    navigation,
    user,
    signOut,
    isActive,
    onClose,
}) => {
    return (
        <div className="flex h-full flex-col">
            {/* Logo/Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="font-bold text-foreground">Auditoria</h2>
                        <p className="text-xs text-muted-foreground">v1.0</p>
                    </div>
                </div>

                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-smooth",
                                active
                                    ? "bg-primary text-primary-foreground shadow-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="border-t border-border p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{(user as any)?.categoria}</p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="w-full justify-start gap-2 cursor-pointer"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    );
};

export default MainLayout;
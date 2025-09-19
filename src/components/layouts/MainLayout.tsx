// src/components/layouts/MainLayout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelectedLayoutSegments } from "next/navigation";
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
    children: React.ReactNode;
}

type SectionId = "root" | "GESTÃO DE AUDITORIA" | "RELATÓRIOS" | "ADMINISTRAÇÃO";

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    section: SectionId;
};

type NavSection = {
    label: string;
    items: NavItem[];
};

// ✅ um único array com a propriedade `section`
const NAV_ITEMS: NavItem[] = [
    // raiz (fica acima das seções)
    { name: "Dashboard", href: "/", icon: LayoutDashboard, section: "root" },
    // gestão de auditoria
    { name: "Lojas", href: "/lojas", icon: Store, section: "GESTÃO DE AUDITORIA" },
    { name: "Categorias", href: "/categorias", icon: Tag, section: "GESTÃO DE AUDITORIA" },
    { name: "Auditorias", href: "/auditorias", icon: ClipboardCheck, section: "GESTÃO DE AUDITORIA" },
    { name: "Formas de Pagamento", href: "/formas-pagamento", icon: CreditCard, section: "GESTÃO DE AUDITORIA" },
    { name: "Avaliação Operacional", href: "/cad-av-operacional", icon: Settings, section: "GESTÃO DE AUDITORIA" },
    { name: "Cadastro de Questões", href: "/cad-questoes", icon: FileText, section: "GESTÃO DE AUDITORIA" },
    { name: "Motivo de perdas", href: "/motivo-perdas", icon: AlertCircle, section: "GESTÃO DE AUDITORIA" },
    { name: "Motivo de pausas", href: "/motivo-pausas", icon: Settings, section: "GESTÃO DE AUDITORIA" },
    // relatórios
    { name: "Relatórios", href: "/relatorios", icon: FileText, section: "RELATÓRIOS" },
    // administração
    { name: "Usuários", href: "/usuarios", icon: Users, section: "ADMINISTRAÇÃO" },
];

// 👇 altere pra `true` se quiser ver as seções dentro de Accordion
const USE_ACCORDION = true;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    // const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { user, signOut } = useAuth();

    const segments = useSelectedLayoutSegments();

    const pathname = "/" + segments.join("/");

    const normalize = (s?: string) => {
        if (!s) return "/";
        // remove query/hash e barra final (exceto na raiz)
        const path = s.split("?")[0].split("#")[0];
        return path !== "/" ? path.replace(/\/+$/, "") : "/";
    };

    const isActive = React.useCallback(
        (href: string) => {
            // raiz só é ativa quando não há segmentos
            if (href === "/") return segments.length === 0;

            // ativa quando é exatamente a rota ou um filho dela
            return pathname === href || pathname.startsWith(href + "/");
        },
        [segments, pathname]
    );

    return (
        <div className="min-h-screen bg-gradient-dashboard">
            {/* Sidebar mobile (overlay) */}
            <div className={cn(
                "fixed inset-0 z-50 lg:hidden transition-opacity duration-200",
                sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
                role="presentation"
                aria-hidden="true"
            >
                <div
                    className="fixed inset-0 bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
                <div className={cn(
                    "fixed left-0 top-0 h-full w-64 bg-card shadow-2xl transition-transform duration-200",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
                >
                    <SidebarContent
                        items={NAV_ITEMS}
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
                    items={NAV_ITEMS}
                    user={user}
                    signOut={signOut}
                    isActive={isActive}
                />
            </div>

            {/* Main content */}
            <div className="h-screen flex flex-col lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden cursor-pointer"
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
                <main className="h-full p-6">{children}</main>
            </div>
        </div>
    );
};

interface SidebarContentProps {
    items: NavItem[];                 // único array
    user: any;
    signOut: () => void;
    isActive: (href: string) => boolean;
    onClose?: () => void;
}

interface SidebarLinkProps {
    href: string;
    onClick?: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, onClick, icon: Icon, label, isActive }) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-smooth ml-4",
            isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        onClick={onClick}
    >
        <Icon className="h-5 w-5" />
        {label}
    </Link>
);

const SidebarContent: React.FC<SidebarContentProps> = ({ items, user, signOut, isActive, onClose }) => {
    // 👇 agrupa por seção usando o único array
    const grouped = React.useMemo(() => {
        const out: Record<SectionId, NavItem[]> = { root: [], "GESTÃO DE AUDITORIA": [], "RELATÓRIOS": [], "ADMINISTRAÇÃO": [] };
        for (const it of items) out[it.section].push(it);
        return out;
    }, [items]);

    const root = grouped.root;
    const sectionKeys = (Object.keys(grouped) as SectionId[]).filter((s) => s !== "root");
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
                        className="lg:hidden cursor-pointer"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-0 overflow-y-auto scrollbar-custom">
                {/* itens raiz */}
                {root.map((item) => (
                    <SidebarLink
                        key={item.name}
                        href={item.href}
                        icon={item.icon}
                        label={item.name}
                        isActive={isActive(item.href)}
                        onClick={onClose}
                    />
                ))}

                {/* seções */}
                {USE_ACCORDION ? (
                    <Accordion type="single" collapsible defaultValue="GESTÃO DE AUDITORIA" className="space-y-0">
                        {sectionKeys.map((label) => (
                            <AccordionItem key={label} value={label} className="border-none">
                                <AccordionTrigger className="px-3 text-xs font-semibold text-foreground hover:no-underline cursor-pointer">
                                    {label}
                                </AccordionTrigger>
                                <AccordionContent className="space-y-1 pb-0">
                                    {grouped[label].map((item) => (
                                        <SidebarLink
                                            key={item.name}
                                            href={item.href}
                                            icon={item.icon}
                                            label={item.name}
                                            isActive={isActive(item.href)}
                                            onClick={onClose}
                                        />
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    sectionKeys.map((label) => (
                        <div key={label} className="space-y-2 pt-2">
                            <div className="px-3 pt-0 text-xs font-semibold text-foreground">{label}</div>
                            {grouped[label].map((item) => (
                                <SidebarLink
                                    key={item.name}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.name}
                                    isActive={isActive(item.href)}
                                    onClick={onClose}
                                />
                            ))}
                        </div>
                    ))
                )}
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
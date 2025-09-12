"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    label?: string;
    className?: string;
}

const LoadingSpinner: React.FC<Props> = ({ label = "Carregando...", className }) => {
    return (
        <div className={cn("flex items-center justify-center gap-2 py-8", className)}>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    );
};

export default LoadingSpinner;
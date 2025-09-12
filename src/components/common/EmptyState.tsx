"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title?: string;
    description?: string;
    className?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = "Nada por aqui ainda",
    description = "Quando houver dados, eles aparecerão nesta área.",
    className,
    actionLabel,
    onAction,
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-center", className)}>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            {actionLabel && onAction && (
                <Button className="mt-2" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
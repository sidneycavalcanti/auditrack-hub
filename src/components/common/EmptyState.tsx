"use client";

import React from 'react';
import { FileX, Package, Users, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: 'file' | 'package' | 'users' | 'calendar' | 'alert';
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'file',
    title,
    description,
    action,
    className,
}) => {
    const icons = {
        file: FileX,
        package: Package,
        users: Users,
        calendar: Calendar,
        alert: AlertCircle,
    };

    const IconComponent = icons[icon];

    return (
        <div className={cn(
            'flex flex-col items-center justify-center p-12 text-center bg-gradient-card rounded-xl border border-border shadow-card',
            className
        )}>
            <div className="rounded-full bg-muted p-4 mb-4">
                <IconComponent className="h-8 w-8 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-muted-foreground mb-6 max-w-sm">
                    {description}
                </p>
            )}
            
            {action && (
                <Button 
                    onClick={action.onClick}
                    variant="premium"
                    size="lg"
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
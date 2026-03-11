// src/app/(private)/layout.tsx
"use client";

import React from "react";
import ProtectedRoute from "@/components/layouts/ProtectedRoute";

export default function PrivateSegmentLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}

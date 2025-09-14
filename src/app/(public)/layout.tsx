// src/app/(public)/layout.tsx
"use client";

import React from "react";
import PublicRoute from "@/components/layouts/PublicRoute";

export default function PublicSegmentLayout({ children }: { children: React.ReactNode }) {
    return <PublicRoute>{children}</PublicRoute>;
}
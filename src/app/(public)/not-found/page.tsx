// src/app/(public)/not-found/page.tsx
"use client"
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFoundPage() {
  const pathname = usePathname();

  useEffect(() => {
    // Loga apenas no client
    // (em prod, prefira enviar para uma ferramenta de observabilidade)
    console.error("404 Error: rota inexistente acessada:", pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center px-4">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Página não encontrada</p>
        <Link
          href="/"
          className="text-blue-500 underline hover:text-blue-700"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
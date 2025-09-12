// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Auditrack Hub</h1>
        <p className="text-sm text-muted-foreground">Escolha para onde deseja ir:</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="underline">Login</Link>
          <Link href="/dashboard" className="underline">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}

// src/app/(public)/login/page.tsx
export const dynamic = "force-static"; // ou "auto"; depende do seu fluxo

export default function LoginPage() {
    // Placeholder de rota pública; troco pelo seu <Login /> assim que você enviar.
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold">Login</h2>
            <p className="text-sm text-muted-foreground">A tela real será inserida aqui.</p>
        </div>
    );
}
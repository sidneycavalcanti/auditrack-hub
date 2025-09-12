// src/app/(private)/dashboard/page.tsx
// no futuro, podemos proteger este segmento com middleware
export default function DashboardPage() {
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">A UI atual será migrada para cá.</p>
        </div>
    );
}
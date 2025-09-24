// src/app/(private)/relatorios/avoperacional/useThemeColors.ts
import * as React from "react";

/** Resolve cores do tema (CSS variables do shadcn) com fallback para hex Tailwind */
function useThemeColors() {
    const normalizeVar = (v: string) => {
        const m = v.match(/^var\(([^)]+)\)$/);
        return (m ? m[1] : v).trim(); // "--primary"
    };

    const wrapColor = (raw: string) => {
        const value = raw.trim();
        // já é uma cor completa?
        if (/^#|^hsl\(|^rgb\(|^oklch\(/i.test(value)) return value;

        // heurística: HSL cru costuma ter 2 tokens com '%', OKLCH cru 1 token com '%'
        const tokens = value.split(/\s+/);
        const percCount = tokens.filter((t) => t.includes("%")).length;

        return percCount >= 2 ? `hsl(${value})` : `oklch(${value})`;
    };

    const pick = React.useCallback((cssVar: string, fallback: string) => {
        if (typeof window === "undefined") return fallback;
        const name = normalizeVar(cssVar);
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
        if (!raw) return fallback;
        return wrapColor(raw);
    }, []);

    return React.useMemo(() => {
        // pegue as tokens do seu global.css (oklch)
        const primary = pick("--primary", "oklch(61% 0.18 250)");
        const accent = pick("--accent", "oklch(70% 0.10 210)");
        const success = pick("--success", "oklch(64% 0.13 145)");
        const warning = pick("--warning", "oklch(75% 0.12 85)");
        const destructive = pick("--destructive", "oklch(62% 0.17 30)");
        const violet_500 = "oklch(60.6% 0.25 292.717)"; // extra fixo (se quiser)
        const violet_600 = "oklch(54.1% 0.281 293.009)"; // extra fixo (se quiser)
        const muted = pick("--muted-foreground", "oklch(65% 0.02 260)");
        const grid = pick("--muted", "oklch(35% 0.02 260)");

        const palette = [primary, accent, success, warning, destructive, violet_500, violet_600];
        return { primary, accent, success, warning, destructive, violet_500, violet_600, muted, grid, palette };
    }, [pick]);
}

export default useThemeColors;
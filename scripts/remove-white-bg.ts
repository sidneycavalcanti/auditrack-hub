// scripts/remove-white-bg.ts
import sharp from "sharp";
import { glob } from "glob";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Remove “quase branco” e torna transparente.
 * Ajuste a tolerância conforme necessário.
 */
const WHITE = { r: 255, g: 255, b: 255 };
const TOLERANCIA = 18; // 0–255 (↑ = mais agressivo)

function isNearWhite(r: number, g: number, b: number) {
    return (
        Math.abs(r - WHITE.r) <= TOLERANCIA &&
        Math.abs(g - WHITE.g) <= TOLERANCIA &&
        Math.abs(b - WHITE.b) <= TOLERANCIA
    );
}

async function processImage(inFile: string, outFile: string) {
    const img = sharp(inFile).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

    // data = [r,g,b,a, r,g,b,a, ...]
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // se for branco (ou quase), zera o alpha
        if (isNearWhite(r, g, b)) data[i + 3] = 0;
    }

    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()     // mantém transparência
        .toFile(outFile);
    console.log(`✔  ${path.basename(inFile)}  →  ${path.basename(outFile)}`);
}

async function main() {
    // Ajuste o globo abaixo para onde você guardou as imagens
    const files = await glob("public/auditoria/*.{png,jpg,jpeg}");
    if (files.length === 0) {
        console.log("Nenhuma imagem encontrada em public/auditoria");
        return;
    }

    const outDir = "public/auditoria/transparentes";
    await fs.mkdir(outDir, { recursive: true });

    for (const f of files) {
        const { name } = path.parse(f);
        const out = path.join(outDir, `${name}.png`);
        await processImage(f, out);
    }

    console.log("\nConcluído. Use as versões em /auditoria/transparentes/*.png");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
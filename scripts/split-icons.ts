/**
 * scripts/split-icons.ts
 * Uso:
 *   npx tsx scripts/split-icons.ts public/auditoria/icone-genero.png public/auditoria/out
 *
 * Faz:
 *  - Remove a faixa de texto inferior automaticamente (histograma horizontal)
 *  - Encontra o “vale” entre os 2 ícones e divide
 *  - Faz trim de cada lado e salva como PNG com alpha
 */

import sharp from "sharp";
import { basename, dirname, join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

type CutResult = { top: number; bottom: number };

// parâmetros finos (ajuste se precisar)
const ROW_DARK_RATIO = 0.005;   // % de pixels “escuros” pra considerar que há conteúdo
const GAP_MIN_HEIGHT = 6;       // número mínimo de linhas seguidas “claras” p/ considerar gap
const ICON_SIDE_PADDING = 6;    // margem extra nas bordas ao recortar cada ícone

async function removeBottomTextZone(img: sharp.Sharp): Promise<{ img: sharp.Sharp; crop: CutResult; meta: sharp.Metadata }> {
    const meta = await img.metadata();
    if (!meta.width || !meta.height) throw new Error("Sem metadata de width/height");
    const w = meta.width, h = meta.height;

    // pegamos em escala de cinza pra medir “escuridão”
    const gray = await img.clone().greyscale().raw().toBuffer();
    const rowCounts = new Array(h).fill(0);

    // conta quantos pixels “escuros” cada linha possui
    for (let y = 0; y < h; y++) {
        let cnt = 0;
        for (let x = 0; x < w; x++) {
            const v = gray[y * w + x]; // 0=preto, 255=branco
            if (v < 235) cnt++;        // limiar “escuro” (ajuste fino aqui se precisar)
        }
        rowCounts[y] = cnt;
    }

    // achamos o maior “gap claro” no terço inferior (ícones acima, texto abaixo)
    const startScan = Math.floor(h * 0.45);  // começar a procurar da metade pra baixo
    let bestGapStart = -1, bestGapLen = 0;

    let runStart = -1, runLen = 0;
    for (let y = startScan; y < h; y++) {
        const darkRatio = rowCounts[y] / w;
        const isClear = darkRatio < ROW_DARK_RATIO;
        if (isClear) {
            if (runStart === -1) runStart = y;
            runLen++;
        } else {
            if (runLen >= GAP_MIN_HEIGHT && runLen > bestGapLen) {
                bestGapLen = runLen;
                bestGapStart = runStart;
            }
            runStart = -1;
            runLen = 0;
        }
    }
    if (runLen >= GAP_MIN_HEIGHT && runLen > bestGapLen) {
        bestGapLen = runLen;
        bestGapStart = runStart;
    }

    // se não conseguiu detectar, recua para corte “seguro” (65% da altura)
    const cutY = bestGapStart > 0 ? bestGapStart : Math.floor(h * 0.65);

    const cropped = img.clone().extract({ left: 0, top: 0, width: w, height: Math.max(10, cutY) });
    return { img: cropped, crop: { top: 0, bottom: cutY }, meta: { width: w, height: cutY } };
}

async function splitTwoIcons(img: sharp.Sharp, meta: { width?: number; height?: number }) {
    const w = meta.width!, h = meta.height!;
    const gray = await img.clone().greyscale().raw().toBuffer();

    // projeção vertical: soma de “escuridão” por coluna
    const colCounts = new Array(w).fill(0);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const v = gray[y * w + x];
            if (v < 235) colCounts[x]++; // escuro
        }
    }

    // achamos o “vale” central (mínimo local) entre os dois picos
    const from = Math.floor(w * 0.2);
    const to = Math.floor(w * 0.8);
    let minX = from, minVal = Number.MAX_SAFE_INTEGER;
    for (let x = from; x < to; x++) {
        if (colCounts[x] < minVal) { minVal = colCounts[x]; minX = x; }
    }

    // corta em L|R usando minX
    const left = await img.clone().extract({ left: Math.max(0, minX - Math.floor(w * 0.5)), top: 0, width: minX, height: h })
        .trim().extend({ left: ICON_SIDE_PADDING, right: ICON_SIDE_PADDING, top: ICON_SIDE_PADDING, bottom: ICON_SIDE_PADDING, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

    const right = await img.clone().extract({ left: minX, top: 0, width: w - minX, height: h })
        .trim().extend({ left: ICON_SIDE_PADDING, right: ICON_SIDE_PADDING, top: ICON_SIDE_PADDING, bottom: ICON_SIDE_PADDING, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

    return { left, right };
}

async function main() {
    const src = process.argv[2];
    const outDir = process.argv[3] || dirname(src);
    if (!src) {
        console.error("Uso: npx tsx scripts/split-icons.ts <caminho/arquivo.png> [pastaSaida]");
        process.exit(1);
    }
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const base = basename(src).replace(/\.(png|jpg|jpeg)$/i, "");

    // carrega, remove fundo branco -> alpha, e processa
    const baseImg = sharp(src)
        .png()
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // garante base branca
        .removeAlpha()
        .toColourspace("rgb")
        .threshold(250, { grayscale: false }) // força quase-branco=branco
        .toColourspace("b-w"); // ajuda o trim abaixo

    // volta a RGBA e faz trim (tira sobra branca), depois detecta corte inferior
    const prepared = sharp(await baseImg.png().toBuffer())
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .trim(); // tira bordas externas

    const { img: noTextImg, meta } = await removeBottomTextZone(prepared);

    // troca o branco por alpha (fundo transparente)
    const rgba = await noTextImg
        .png()
        .toBuffer();

    const withAlpha = await sharp(rgba)
        .png()
        .joinChannel(
            await sharp(rgba).removeAlpha().greyscale().threshold(250).negate().toBuffer() // alpha = invertido do branco
        )
        .toBuffer();

    const ready = sharp(withAlpha);
    const parts = await splitTwoIcons(ready, meta);

    await sharp(parts.left).toFile(join(outDir, `${base}-left.png`));
    await sharp(parts.right).toFile(join(outDir, `${base}-right.png`));

    console.log("OK! Gerados:");
    console.log(" -", join(outDir, `${base}-left.png`));
    console.log(" -", join(outDir, `${base}-right.png`));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
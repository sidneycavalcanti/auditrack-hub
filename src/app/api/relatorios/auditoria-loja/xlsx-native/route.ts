import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";

type Payload = {
  lojaNome?: string;
  data?: {
    lojaId?: number;
    mes?: number;
    ano?: number;
  };
};

function safeName(value: string) {
  return value.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
}

function runPython(scriptPath: string, inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const pythonBin = process.env.PYTHON_BIN || "python";
    const proc = spawn(pythonBin, [scriptPath, inputPath, outputPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `Falha ao gerar XLSX (codigo ${code ?? "desconhecido"}).`));
    });
  });
}

export async function POST(req: Request) {
  const payload = (await req.json()) as Payload;
  const data = payload?.data;
  if (!data) {
    return new Response("Payload invalido: data ausente.", { status: 400 });
  }

  const root = process.cwd();
  const scriptDir = path.join(root, "scripts");
  const scriptPath = path.join(scriptDir, "export_auditoria_xlsx_native.py");
  const tempRoot = await mkdtemp(path.join(tmpdir(), "auditoria-xlsx-"));
  const inputPath = path.join(tempRoot, "input.json");
  const outputPath = path.join(tempRoot, "relatorio.xlsx");

  try {
    await mkdir(scriptDir, { recursive: true });
    await writeFile(inputPath, JSON.stringify(payload), "utf8");
    await runPython(scriptPath, inputPath, outputPath);
    const buffer = await readFile(outputPath);
    const baseName = safeName(payload.lojaNome || `loja_${data.lojaId ?? "0"}`) || "Loja";
    const fileName = `RelatorioAuditoria_${data.ano ?? "0000"}${String(data.mes ?? 0).padStart(2, "0")}_${baseName}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno ao gerar XLSX.";
    return new Response(message, { status: 500 });
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

import type { RelatorioMensalData } from "../../types/auditoria";

type ExportArgs = {
  data: RelatorioMensalData;
  lojaNome?: string;
};

function getFileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default async function exportRelatorioAuditoriaXLSX({ data, lojaNome }: ExportArgs) {
  const response = await fetch("/api/relatorios/auditoria-loja/xlsx-native", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, lojaNome }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Falha ao exportar XLSX.");
  }

  const blob = await response.blob();
  const fileName =
    getFileNameFromDisposition(response.headers.get("content-disposition")) ||
    `RelatorioAuditoria_${data.ano}${String(data.mes).padStart(2, "0")}.xlsx`;
  downloadBlob(blob, fileName);
}

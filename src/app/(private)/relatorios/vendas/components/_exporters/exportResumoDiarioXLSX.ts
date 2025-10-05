// src/app/(private)/relatorios/vendas/components/_exporters/exportResumoDiarioXLSX.ts
type Header = { title: string; loja: string; data: string };
type Row = {
  ITEM: string;
  GERAL: string | number;
  MANHA: string | number;
  PCT_MANHA: string | number;
  TARDE: string | number;
  PCT_TARDE: string | number;
  NOITE: string | number;
  PCT_NOITE: string | number;
};

const LOGO_URL = "/logo_plaza.png";

function toNumber(v: any): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  if (s.includes("%")) {
    const n = s.replace("%", "").replace(/\./g, "").replace(",", ".");
    return Number(n) / 100;
  }
  const n = s.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(n || 0);
}
const isMoney = (v: any) => String(v ?? "").includes("R$");

async function getLogoBase64() {
  try {
    const url = new URL(LOGO_URL, window.location.origin).toString();
    const res = await fetch(url);
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise<string>((ok) => {
      const fr = new FileReader();
      fr.onload = () => ok(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export default async function exportResumoDiarioXLSX(
  dataRows: Row[],
  filename: string,
  header: Header
) {
  const ExcelJS = await import("exceljs");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Resumo diário");

  ws.columns = [
    { header: "ITEM", key: "ITEM", width: 45 },
    { header: "GERAL", key: "GERAL", width: 16 },
    { header: "MANHÃ", key: "MANHA", width: 16 },
    { header: "% MANHÃ", key: "PCT_MANHA", width: 12 },
    { header: "TARDE", key: "TARDE", width: 16 },
    { header: "% TARDE", key: "PCT_TARDE", width: 12 },
    { header: "NOITE", key: "NOITE", width: 16 },
    { header: "% NOITE", key: "PCT_NOITE", width: 12 },
  ];

  ws.mergeCells("A1:H1"); ws.getCell("A1").value = header.title; ws.getCell("A1").font = { bold: true, size: 14 }; ws.getCell("A1").alignment = { horizontal: "center" };
  ws.mergeCells("A2:H2"); ws.getCell("A2").value = header.loja; ws.getCell("A2").font = { size: 10 };
  ws.mergeCells("A3:H3"); ws.getCell("A3").value = header.data; ws.getCell("A3").font = { size: 10 };
  ws.addRow([]);

  ws.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(5).alignment = { horizontal: "center" };
  ws.getRow(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF212121" } };

  const moneyFmt = '"R$"#,##0.00';

  dataRows.forEach((r) => {
    const cols = [
      r.ITEM,
      { v: toNumber(r.GERAL), money: isMoney(r.GERAL) },
      { v: toNumber(r.MANHA), money: isMoney(r.MANHA) },
      { v: toNumber(r.PCT_MANHA), pct: true },
      { v: toNumber(r.TARDE), money: isMoney(r.TARDE) },
      { v: toNumber(r.PCT_TARDE), pct: true },
      { v: toNumber(r.NOITE), money: isMoney(r.NOITE) },
      { v: toNumber(r.PCT_NOITE), pct: true },
    ];
    const row = ws.addRow(cols.map((c) => (typeof c === "object" ? (c as any).v : c)));
    [2, 3, 5, 7].forEach((i) => {
      const c: any = cols[i - 1];
      row.getCell(i).numFmt = c.money ? moneyFmt : "0";
    });
    [4, 6, 8].forEach((i) => (row.getCell(i).numFmt = "0.00%"));
  });

  ws.eachRow({ includeEmpty: false }, (row, idx) => {
    if (idx >= 5) {
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        cell.font = { size: 10 };
      });
    }
  });

  const logo = await getLogoBase64();
  if (logo) {
    const imgId = wb.addImage({ base64: logo, extension: "png" });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 90 } });
    ws.getRow(1).height = 90 * 0.75;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
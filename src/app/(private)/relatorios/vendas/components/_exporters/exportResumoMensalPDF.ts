// src/app/(private)/relatorios/vendas/components/_exporters/exportResumoMensalPDF.ts
type Header = { title: string; loja: string; periodo: string };
type Row = {
  ITEM: string;
  GERAL: string | number;
  "MANHÃ": string | number;
  "% MANHÃ": string | number;
  TARDE: string | number;
  "% TARDE": string | number;
  NOITE: string | number;
  "% NOITE": string | number;
};

const LOGO_URL = "/logo_plaza.png";

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

export default async function exportResumoMensalPDF(
  dataRows: Row[],
  filename: string,
  header: Header
) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

  const doc = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });

  try {
    const logo = await getLogoBase64();
    if (logo) doc.addImage(logo, "PNG", 20, 14, 78, 60);
  } catch {}

  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(header.title, pageW / 2, 46, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(header.loja, 20, 80);
  doc.text(header.periodo, 20, 96);

  const head = [["ITEM", "GERAL", "MANHÃ", "% MANHÃ", "TARDE", "% TARDE", "NOITE", "% NOITE"]];
  const body = dataRows.map((r) => [
    r.ITEM,
    r.GERAL,
    (r as any)["MANHÃ"],
    (r as any)["% MANHÃ"],
    r.TARDE,
    (r as any)["% TARDE"],
    r.NOITE,
    (r as any)["% NOITE"],
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 112,
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [33, 33, 33], textColor: 255 },
    columnStyles: { 0: { cellWidth: 250 } },
    margin: { left: 20, right: 20 },
  });

  doc.save(filename);
}
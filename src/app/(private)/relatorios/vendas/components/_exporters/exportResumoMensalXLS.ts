// src/app/(private)/relatorios/vendas/components/_exporters/exportResumoMensalXLS.ts
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

const moneyStyle = 'mso-number-format:"\\0022R$\\0022 #,##0.00"';
const pctStyle = 'mso-number-format:0.00%';
const intStyle = 'mso-number-format:0';

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
const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

export default async function exportResumoMensalXLS(
  dataRows: Row[],
  filename: string,
  header: Header
) {
  const logo = await getLogoBase64();

  const headRow =
    "<tr><th>ITEM</th><th>GERAL</th><th>MANHÃ</th><th>% MANHÃ</th><th>TARDE</th><th>% TARDE</th><th>NOITE</th><th>% NOITE</th></tr>";

  const bodyRows = dataRows
    .map((r) => {
      const geral = toNumber(r.GERAL);
      const manha = toNumber((r as any)["MANHÃ"]);
      const pctM = toNumber((r as any)["% MANHÃ"]);
      const tarde = toNumber(r.TARDE);
      const pctT = toNumber((r as any)["% TARDE"]);
      const noite = toNumber(r.NOITE);
      const pctN = toNumber((r as any)["% NOITE"]);
      const tdMoney = (n: number, wasMoney: boolean) =>
        `<td style="${wasMoney ? moneyStyle : intStyle}">${n}</td>`;
      const tdPct = (n: number) => `<td style="${pctStyle}">${n}</td>`;
      return `<tr>
        <td>${esc(r.ITEM)}</td>
        ${tdMoney(geral, isMoney(r.GERAL))}
        ${tdMoney(manha, isMoney((r as any)["MANHÃ"]))}
        ${tdPct(pctM)}
        ${tdMoney(tarde, isMoney(r.TARDE))}
        ${tdPct(pctT)}
        ${tdMoney(noite, isMoney(r.NOITE))}
        ${tdPct(pctN)}
      </tr>`;
    })
    .join("");

  const LOGO_H = 80;
  const LOGO_W = 64;

  const html = `<!DOCTYPE html>
<html><meta charset="utf-8">
<head>
  <title>${esc(header.title)}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #333;padding:4px 6px;font-size:12px}
    th{background:#212121;color:#fff}
    .hdr{width:100%; border-collapse:collapse; margin-bottom:8px}
    .hdr td{border:none;}
    .hdr .logo-cell{height:${LOGO_H}px; width:${LOGO_W + 8}px; vertical-align:middle}
    .hdr .title-cell{font-weight:bold; font-size:16px; text-align:center; vertical-align:middle}
    .meta{margin:6px 0 12px 0}
  </style>
</head>
<body>
  <table class="hdr">
    <tr>
      <td class="logo-cell">${logo ? `<img src="${logo}" alt="logo" style="height:${LOGO_H}px;width:auto" />` : ""}</td>
      <td class="title-cell">${esc(header.title)}</td>
    </tr>
  </table>

  <div class="meta">
    <div>${esc(header.loja)}</div>
    <div>${esc(header.periodo)}</div>
  </div>

  <table>
    <thead>${headRow}</thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
import type { DiaSemana, RelatorioMensalData } from "../../types/auditoria";

type ExportArgs = {
  data: RelatorioMensalData;
  lojaNome?: string;
  chartImages?: Record<string, string | undefined>;
};

const DIAS: DiaSemana[] = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const n = (v: unknown) => Number(v ?? 0);

type ExcelCellLike = {
  value?: unknown;
  numFmt?: string;
  font?: {
    name?: string;
    bold?: boolean;
    size?: number;
    color?: { argb: string };
  };
  alignment?: {
    horizontal?: "center" | "left" | "right";
    vertical?: "middle" | "top" | "bottom";
    wrapText?: boolean;
  };
  fill?: {
    type: "pattern";
    pattern: "solid";
    fgColor: { argb: string };
  };
  border?: {
    top: { style: "thin" };
    left: { style: "thin" };
    bottom: { style: "thin" };
    right: { style: "thin" };
  };
};

type ExcelRowLike = {
  number: number;
  eachCell: (cb: (cell: ExcelCellLike) => void) => void;
};

type ExcelWorksheetLike = {
  mergeCells: (...args: Array<string | number>) => void;
  getCell: (row: number | string, col?: number) => ExcelCellLike;
  addRow: (values: Array<string | number>) => ExcelRowLike;
  lastRow: { number: number };
};

function monthNamePt(mes: number) {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return meses[mes - 1] ?? String(mes);
}

function applyHeaderStyle(row: ExcelRowLike) {
  row.eachCell((cell: ExcelCellLike) => {
    cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF222222" } };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

function applyDataStyle(row: ExcelRowLike, isTotal = false) {
  row.eachCell((cell: ExcelCellLike) => {
    cell.font = { name: "Arial", bold: isTotal, color: { argb: "FF000000" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    if (isTotal) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
    }
  });
}

function sectionTitle(ws: ExcelWorksheetLike, rowNumber: number, title: string, colEnd = 9) {
  ws.mergeCells(rowNumber, 2, rowNumber, colEnd);
  const cell = ws.getCell(rowNumber, 2);
  cell.value = title;
  cell.font = { name: "Arial", bold: true, size: 12 };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

function finalizeDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadImageBase64(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default async function exportRelatorioAuditoriaXLSX({ data, lojaNome, chartImages }: ExportArgs) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const wbWithImages = wb as unknown as {
    addImage: (img: { base64: string; extension: "png" }) => number;
  };
  const logoBase64 = await loadImageBase64("/auditoria/logo-plaza.png");
  const logoId = logoBase64 ? wbWithImages.addImage({ base64: logoBase64, extension: "png" }) : null;

  const now = new Date();
  const dateBR = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const wsCarta = wb.addWorksheet("Carta");
  wsCarta.columns = Array.from({ length: 12 }, () => ({ width: 13 }));
  wsCarta.mergeCells("B2:J2");
  wsCarta.getCell("B2").value = `Recife, ${dateBR}`;
  wsCarta.mergeCells("B5:J5");
  wsCarta.getCell("B5").value = "Auditoria de Loja";
  wsCarta.getCell("B5").font = { name: "Arial", bold: true, size: 12 };
  wsCarta.mergeCells("B6:J6");
  wsCarta.getCell("B6").value = lojaNome || `Loja ${data.lojaId}`;
  wsCarta.getCell("B6").font = { name: "Arial", bold: true, size: 12 };
  wsCarta.mergeCells("B9:J13");
  wsCarta.getCell("B9").value =
    `Com base no trabalho realizado pela Auditoria no mes de ${monthNamePt(data.mes)} de ${data.ano}, ` +
    `demonstramos no relatorio a seguir os indicadores de desempenho da loja e oportunidades de melhoria identificadas.`;
  wsCarta.getCell("B9").alignment = { wrapText: true, vertical: "top" };
  wsCarta.mergeCells("B15:J16");
  wsCarta.getCell("B15").value =
    "Este relatorio destina-se ao uso exclusivo da respectiva loja e da Administracao do Plaza Shopping.";
  wsCarta.getCell("B15").alignment = { wrapText: true, vertical: "top" };
  wsCarta.mergeCells("B18:J20");
  wsCarta.getCell("B18").value =
    "Para informacoes adicionais, favor contatar a Coordenacao de Auditoria do Plaza Shopping.";
  wsCarta.getCell("B18").alignment = { wrapText: true, vertical: "top" };
  wsCarta.mergeCells("C24:E24");
  wsCarta.getCell("C24").value = "Diogo Lucena";
  wsCarta.getCell("C24").alignment = { horizontal: "center" };
  wsCarta.mergeCells("H24:J24");
  wsCarta.getCell("H24").value = "Zuleica Santos";
  wsCarta.getCell("H24").alignment = { horizontal: "center" };
  wsCarta.mergeCells("C25:E25");
  wsCarta.getCell("C25").value = "Coordenador de Auditoria";
  wsCarta.getCell("C25").alignment = { horizontal: "center" };
  wsCarta.mergeCells("H25:J25");
  wsCarta.getCell("H25").value = "Superintendente";
  wsCarta.getCell("H25").alignment = { horizontal: "center" };
  wsCarta.mergeCells("C26:E26");
  wsCarta.getCell("C26").value = "Plaza Shopping";
  wsCarta.getCell("C26").alignment = { horizontal: "center" };
  wsCarta.mergeCells("H26:J26");
  wsCarta.getCell("H26").value = "Plaza Shopping";
  wsCarta.getCell("H26").alignment = { horizontal: "center" };
  if (logoId) {
    (wsCarta as unknown as {
      addImage: (
        imageId: number,
        range: { tl: { col: number; row: number }; ext: { width: number; height: number } },
      ) => void;
    }).addImage(logoId, { tl: { col: 8.2, row: 1.2 }, ext: { width: 120, height: 70 } });
  }

  const wsCapa = wb.addWorksheet("Capa");
  wsCapa.columns = Array.from({ length: 10 }, () => ({ width: 20 }));
  wsCapa.mergeCells("A5:J5");
  wsCapa.getCell("A5").value = "Relatorio de Auditoria do Lojista";
  wsCapa.getCell("A5").font = { name: "Arial", bold: true, size: 20 };
  wsCapa.getCell("A5").alignment = { horizontal: "center", vertical: "middle" };
  wsCapa.mergeCells("A8:J8");
  wsCapa.getCell("A8").value = lojaNome || `Loja ${data.lojaId}`;
  wsCapa.getCell("A8").font = { name: "Arial", bold: true, size: 14 };
  wsCapa.getCell("A8").alignment = { horizontal: "center" };
  wsCapa.mergeCells("A10:J10");
  wsCapa.getCell("A10").value = `${monthNamePt(data.mes)} / ${data.ano}`;
  wsCapa.getCell("A10").font = { name: "Arial", size: 12 };
  wsCapa.getCell("A10").alignment = { horizontal: "center" };
  if (logoId) {
    (wsCapa as unknown as {
      addImage: (
        imageId: number,
        range: { tl: { col: number; row: number }; ext: { width: number; height: number } },
      ) => void;
    }).addImage(logoId, { tl: { col: 4.2, row: 0.8 }, ext: { width: 150, height: 90 } });
  }

  const wsCharts = wb.addWorksheet("Graficos");
  wsCharts.columns = Array.from({ length: 14 }, () => ({ width: 15 }));
  wsCharts.mergeCells("A1:N1");
  wsCharts.getCell("A1").value = "Graficos - Relatorio de Auditoria";
  wsCharts.getCell("A1").font = { name: "Arial", bold: true, size: 14 };
  wsCharts.getCell("A1").alignment = { horizontal: "center" };

  const ws = wb.addWorksheet("Parte 1 - Tabelas e Graficos");
  ws.columns = [
    { width: 3 },
    { width: 24 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 3 },
  ];

  ws.getCell("B1").value = "Plaza Shopping";
  ws.getCell("B2").value = "Auditoria";
  ws.getCell("B3").value = lojaNome || `Loja ${data.lojaId}`;
  ws.getCell("B5").value = "Vendas";
  ws.getCell("B6").value = "Auditadas";
  ws.getCell("C6").value = "Declaradas";
  ws.getCell("B7").value = n(data.totalAuditado);
  ws.getCell("C7").value = n(data.totalVendidoMes);
  ws.getCell("B7").numFmt = '"R$"#,##0.00';
  ws.getCell("C7").numFmt = '"R$"#,##0.00';

  let r = 10;
  sectionTitle(ws, r, "1. Perfil de Clientes (Compradores)");
  r += 2;

  const header1 = ws.addRow(["", "Dia da Semana", "Masculino", "Feminino", "Crianca", "Jovem", "Adulto", "Idoso", "Total"]);
  applyHeaderStyle(header1);

  DIAS.forEach((dia) => {
    const row = data.perfilClientesCompradores.rows[dia];
    const dataRow = ws.addRow([
      "",
      dia,
      n(row?.masculino),
      n(row?.feminino),
      n(row?.crianca),
      n(row?.jovem),
      n(row?.adulto),
      n(row?.idoso),
      n(row?.total),
    ]);
    applyDataStyle(dataRow);
  });

  const totalPerfil = ws.addRow([
    "",
    "Total",
    n(data.perfilClientesCompradores.totalGeral.masculino),
    n(data.perfilClientesCompradores.totalGeral.feminino),
    n(data.perfilClientesCompradores.totalGeral.crianca),
    n(data.perfilClientesCompradores.totalGeral.jovem),
    n(data.perfilClientesCompradores.totalGeral.adulto),
    n(data.perfilClientesCompradores.totalGeral.idoso),
    n(data.perfilClientesCompradores.totalGeral.total),
  ]);
  applyDataStyle(totalPerfil, true);

  const partPerfil = data.perfilClientesCompradores.participacaoPct;
  if (partPerfil) {
    const partRow = ws.addRow([
      "",
      "Participacao %",
      `${n(partPerfil.masculino)}%`,
      `${n(partPerfil.feminino)}%`,
      `${n(partPerfil.crianca)}%`,
      `${n(partPerfil.jovem)}%`,
      `${n(partPerfil.adulto)}%`,
      `${n(partPerfil.idoso)}%`,
      `${n(partPerfil.total)}%`,
    ]);
    applyDataStyle(partRow, true);
  }

  ws.addRow([]);
  sectionTitle(ws, ws.lastRow.number + 1, "2. Fluxo de Pessoas por Dia da Semana");
  ws.addRow([]);
  const header2 = ws.addRow([
    "",
    "Dia da Semana",
    "Vendas Realizadas",
    "Acompanhantes",
    "Vendas Perdidas Identificadas",
    "Possiveis Vendas Perdidas",
    "Trocas",
    "Outros",
    "Total",
  ]);
  applyHeaderStyle(header2);

  DIAS.forEach((dia) => {
    const row = data.fluxoPessoasPorDiaSemana.rows[dia];
    const dataRow = ws.addRow([
      "",
      dia,
      n(row?.vendasRealizadas),
      n(row?.acompanhantes),
      n(row?.vendasPerdidasIdentificadas),
      n(row?.possiveisVendasPerdidas),
      n(row?.trocas),
      n(row?.outros),
      n(row?.total),
    ]);
    applyDataStyle(dataRow);
  });

  const totalFluxoDia = ws.addRow([
    "",
    "Total",
    n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasRealizadas),
    n(data.fluxoPessoasPorDiaSemana.totalGeral.acompanhantes),
    n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasPerdidasIdentificadas),
    n(data.fluxoPessoasPorDiaSemana.totalGeral.possiveisVendasPerdidas),
    n(data.fluxoPessoasPorDiaSemana.totalGeral.trocas),
    n(data.fluxoPessoasPorDiaSemana.totalGeral.outros),
    n(data.fluxoPessoasPorDiaSemana.totalGeral.total),
  ]);
  applyDataStyle(totalFluxoDia, true);

  const partFluxo = data.fluxoPessoasPorDiaSemana.participacaoPct;
  if (partFluxo) {
    const partRow = ws.addRow([
      "",
      "Participacao %",
      `${n(partFluxo.vendasRealizadas)}%`,
      `${n(partFluxo.acompanhantes)}%`,
      `${n(partFluxo.vendasPerdidasIdentificadas)}%`,
      `${n(partFluxo.possiveisVendasPerdidas)}%`,
      `${n(partFluxo.trocas)}%`,
      `${n(partFluxo.outros)}%`,
      `${n(partFluxo.total)}%`,
    ]);
    applyDataStyle(partRow, true);
  }

  ws.addRow([]);
  sectionTitle(ws, ws.lastRow.number + 1, "3. Fluxo de Pessoas por Semana");
  ws.addRow([]);
  const header3 = ws.addRow(["", "Dia da Semana", "1a Semana", "2a Semana", "3a Semana", "4a Semana", "5a Semana", "6a Semana", "Total"]);
  applyHeaderStyle(header3);
  DIAS.forEach((dia) => {
    const row = data.fluxoPessoasPorSemana.rows[dia];
    const dataRow = ws.addRow(["", dia, n(row?.w1), n(row?.w2), n(row?.w3), n(row?.w4), n(row?.w5), n(row?.w6), n(row?.total)]);
    applyDataStyle(dataRow);
  });
  const totalSemana = ws.addRow([
    "",
    "Total",
    n(data.fluxoPessoasPorSemana.totalGeral.w1),
    n(data.fluxoPessoasPorSemana.totalGeral.w2),
    n(data.fluxoPessoasPorSemana.totalGeral.w3),
    n(data.fluxoPessoasPorSemana.totalGeral.w4),
    n(data.fluxoPessoasPorSemana.totalGeral.w5),
    n(data.fluxoPessoasPorSemana.totalGeral.w6),
    n(data.fluxoPessoasPorSemana.totalGeral.total),
  ]);
  applyDataStyle(totalSemana, true);

  const partSemana = data.fluxoPessoasPorSemana.participacaoPct;
  if (partSemana) {
    const partRow = ws.addRow([
      "",
      "Participacao %",
      `${n(partSemana.w1)}%`,
      `${n(partSemana.w2)}%`,
      `${n(partSemana.w3)}%`,
      `${n(partSemana.w4)}%`,
      `${n(partSemana.w5)}%`,
      `${n(partSemana.w6)}%`,
      `${n(partSemana.total)}%`,
    ]);
    applyDataStyle(partRow, true);
  }

  ws.addRow([]);
  sectionTitle(ws, ws.lastRow.number + 1, "4. Vendas Perdidas");
  ws.addRow([]);
  const header4 = ws.addRow([
    "",
    "Dia da Semana",
    "Preco",
    "Falta de Mercadoria",
    "Mod/Cor/Tamanho",
    "Forma de Pagamento",
    "Atendimento",
    "Outros",
    "Total",
  ]);
  applyHeaderStyle(header4);

  DIAS.forEach((dia) => {
    const row = data.vendasPerdidasPorDiaSemana.rows[dia];
    const dataRow = ws.addRow([
      "",
      dia,
      n(row?.preco),
      n(row?.faltaMercadoria),
      n(row?.modCorTamanho),
      n(row?.formaPagamento),
      n(row?.atendimento),
      n(row?.outros),
      n(row?.total),
    ]);
    applyDataStyle(dataRow);
  });

  const totalPerdas = ws.addRow([
    "",
    "Total",
    n(data.vendasPerdidasPorDiaSemana.totalGeral.preco),
    n(data.vendasPerdidasPorDiaSemana.totalGeral.faltaMercadoria),
    n(data.vendasPerdidasPorDiaSemana.totalGeral.modCorTamanho),
    n(data.vendasPerdidasPorDiaSemana.totalGeral.formaPagamento),
    n(data.vendasPerdidasPorDiaSemana.totalGeral.atendimento),
    n(data.vendasPerdidasPorDiaSemana.totalGeral.outros),
    n(data.vendasPerdidasPorDiaSemana.totalGeral.total),
  ]);
  applyDataStyle(totalPerdas, true);

  const partPerdas = data.vendasPerdidasPorDiaSemana.participacaoPct;
  if (partPerdas) {
    const partRow = ws.addRow([
      "",
      "Participacao %",
      `${n(partPerdas.preco)}%`,
      `${n(partPerdas.faltaMercadoria)}%`,
      `${n(partPerdas.modCorTamanho)}%`,
      `${n(partPerdas.formaPagamento)}%`,
      `${n(partPerdas.atendimento)}%`,
      `${n(partPerdas.outros)}%`,
      `${n(partPerdas.total)}%`,
    ]);
    applyDataStyle(partRow, true);
  }

  ws.addRow([]);
  sectionTitle(ws, ws.lastRow.number + 1, "5. Aproveitamento das Vendas - Fluxo de Pessoas x Numero de Vendas");
  ws.addRow([]);
  const header5 = ws.addRow(["", "Dia da Semana", "Fluxo de Pessoas", "Numero de Vendas", "Aproveitamento %"]);
  applyHeaderStyle(header5);

  DIAS.forEach((dia) => {
    const row = data.aproveitamentoVendas.rows[dia];
    const dataRow = ws.addRow(["", dia, n(row?.fluxoPessoas), n(row?.numeroVendas), `${n(row?.aproveitamento).toFixed(2)}%`]);
    applyDataStyle(dataRow);
  });

  const totalAproveitamento = ws.addRow([
    "",
    "Total",
    n(data.aproveitamentoVendas.totalGeral.fluxoPessoas),
    n(data.aproveitamentoVendas.totalGeral.numeroVendas),
    `${n(data.aproveitamentoVendas.totalGeral.aproveitamento).toFixed(2)}%`,
  ]);
  applyDataStyle(totalAproveitamento, true);

  const charts = chartImages ?? {};
  const chartSlots: Array<{ key: string; row: number; col: number }> = [
    { key: "chart-perfil-genero", row: 2, col: 0 },
    { key: "chart-perfil-idade", row: 2, col: 7 },
    { key: "chart-fluxo-grupo", row: 22, col: 0 },
    { key: "chart-fluxo-dia", row: 22, col: 7 },
    { key: "chart-fluxo-semana", row: 42, col: 0 },
    { key: "chart-perdas-grupo", row: 62, col: 0 },
    { key: "chart-perdas-dia", row: 62, col: 7 },
    { key: "chart-aproveitamento", row: 82, col: 0 },
  ];

  const wsChartsWithImages = wsCharts as unknown as {
    addImage: (
      imageId: number,
      range: { tl: { col: number; row: number }; ext: { width: number; height: number } },
    ) => void;
  };

  chartSlots.forEach((slot) => {
    const base64 = charts[slot.key];
    if (!base64) return;
    const imageId = wbWithImages.addImage({ base64, extension: "png" });
    wsChartsWithImages.addImage(imageId, {
      tl: { col: slot.col, row: slot.row },
      ext: { width: 520, height: 280 },
    });
  });

  if (Object.keys(charts).length > 0) {
    ws.addRow([]);
    ws.addRow(["", "Graficos"]);
    const wsMainWithImages = ws as unknown as {
      addImage: (
        imageId: number,
        range: { tl: { col: number; row: number }; ext: { width: number; height: number } },
      ) => void;
    };

    let imageRow = ws.lastRow.number + 1;
    for (const slot of chartSlots) {
      const base64 = charts[slot.key];
      if (!base64) continue;
      const imageId = wbWithImages.addImage({ base64, extension: "png" });
      wsMainWithImages.addImage(imageId, {
        tl: { col: 1, row: imageRow },
        ext: { width: 740, height: 260 },
      });
      imageRow += 14;
    }
  } else {
    wsCharts.getCell("A3").value = "Nenhum grafico capturado nesta exportacao.";
  }

  const safeStore = (lojaNome || `loja_${data.lojaId}`).replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
  const fileName = `RelatorioAuditoria_${data.ano}${String(data.mes).padStart(2, "0")}_${safeStore || "Loja"}.xlsx`;
  const buffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  finalizeDownload(buffer, fileName);
}

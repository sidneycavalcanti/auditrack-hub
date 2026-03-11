import type { DiaSemana, RelatorioMensalData } from "../../types/auditoria";

type PerfilExport = {
  rowsByDay: Record<
    DiaSemana,
    {
      masculino: number;
      feminino: number;
      crianca: number;
      jovem: number;
      adulto: number;
      idoso: number;
      total: number;
    }
  >;
  totalGeral: {
    masculino: number;
    feminino: number;
    crianca: number;
    jovem: number;
    adulto: number;
    idoso: number;
    total: number;
  };
  participacaoPct?: {
    masculino: number;
    feminino: number;
    crianca: number;
    jovem: number;
    adulto: number;
    idoso: number;
    total: number;
  };
};

type ExportArgs = {
  data: RelatorioMensalData;
  lojaNome?: string;
  chartImages?: Record<string, string | undefined>;
  perfil: PerfilExport;
  orientation?: "portrait" | "landscape";
};

const n = (v: unknown) => Number(v ?? 0);

const DIAS_SAFE: DiaSemana[] = [
  "Segunda-feira",
  "Ter\u00e7a-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "S\u00e1bado",
  "Domingo",
];

const EMPTY_PERFIL_ROW = {
  masculino: 0,
  feminino: 0,
  crianca: 0,
  jovem: 0,
  adulto: 0,
  idoso: 0,
  total: 0,
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

function currencyBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeFilePart(value: string) {
  return value.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
}

async function loadImageBase64(path: string): Promise<string> {
  try {
    const url = new URL(path, window.location.origin).toString();
    const res = await fetch(url);
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function normalizeChartImage(img: string): Promise<string> {
  if (!img.startsWith("data:image/svg+xml")) return img;

  return await new Promise<string>((resolve) => {
    let done = false;
    const finish = (value: string) => {
      if (done) return;
      done = true;
      resolve(value);
    };

    const t = window.setTimeout(() => finish(""), 1500);
    const el = new Image();
    el.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(40, el.naturalWidth || 800);
        canvas.height = Math.max(40, el.naturalHeight || 420);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          window.clearTimeout(t);
          finish("");
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        window.clearTimeout(t);
        finish(canvas.toDataURL("image/png"));
      } catch {
        window.clearTimeout(t);
        finish("");
      }
    };
    el.onerror = () => {
      window.clearTimeout(t);
      finish("");
    };
    el.src = img;
  });
}

export default async function exportRelatorioAuditoriaPDF({
  data,
  lojaNome,
  chartImages = {},
  perfil,
  orientation = "landscape",
}: ExportArgs) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = (autoTableMod as unknown as { default?: unknown; autoTable?: unknown }).default
    ? (autoTableMod as unknown as { default: (...args: unknown[]) => void }).default
    : (autoTableMod as unknown as { autoTable: (...args: unknown[]) => void }).autoTable;

  const doc = new jsPDF({ orientation: orientation === "portrait" ? "p" : "l", unit: "pt", format: "a4" });
  const logoBase64 = await loadImageBase64("/auditoria/logo-plaza.png");

  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  const lojaLabel = lojaNome || `Loja ${data.lojaId}`;
  const periodoLabel = `${monthNamePt(data.mes)} / ${data.ano}`;

  const drawHeader = () => {
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin, 10, 70, 42);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Relatorio de Auditoria", pageW / 2, 28, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Loja: ${lojaLabel}`, margin, 64);
    doc.text(`Periodo: ${periodoLabel}`, margin + 240, 64);
    doc.text(`Total vendido: ${currencyBRL(n(data.totalVendidoMes))}`, margin + 430, 64);
    doc.setDrawColor(190, 190, 190);
    doc.line(margin, 72, pageW - margin, 72);
  };

  let y = 82;
  drawHeader();

  const ensureSpace = (height: number) => {
    if (y + height <= pageH - margin) return;
    doc.addPage();
    drawHeader();
    y = 82;
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(26);
    doc.setFillColor(17, 24, 39);
    doc.rect(margin, y, contentW, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, pageW / 2, y + 11, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 22;
  };

  const addTable = (head: string[], body: Array<Array<string | number>>, firstColWidth = 120) => {
    ensureSpace(120);
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [33, 33, 33], textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: firstColWidth } },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 8;
  };

  const addCharts = async (items: Array<{ key: string; title: string }>) => {
    const available = items.filter((item) => chartImages[item.key]);
    if (!available.length) return;

    const cols = available.length > 1 ? 2 : 1;
    const gap = 10;
    const boxW = cols === 2 ? (contentW - gap) / 2 : contentW;
    const boxH = 180;
    const rows = Math.ceil(available.length / cols);

    ensureSpace(rows * (boxH + 8));
    for (let idx = 0; idx < available.length; idx += 1) {
      const item = available[idx];
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = margin + col * (boxW + gap);
      const top = y + row * (boxH + 8);
      const rawImg = chartImages[item.key];
      if (!rawImg) continue;
      const img = await normalizeChartImage(rawImg);
      if (!img) continue;

      doc.setDrawColor(210, 210, 210);
      doc.rect(x, top, boxW, boxH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(item.title, x + 8, top + 14);
      try {
        doc.addImage(img, "PNG", x + 6, top + 20, boxW - 12, boxH - 26, undefined, "FAST");
      } catch {
        // ignore malformed image
      }
    }

    y += rows * (boxH + 8) + 4;
  };

  addSectionTitle("1. PERFIL DE CLIENTES (COMPRADORES)");
  addTable(
    ["Dia da semana", "Masculino", "Feminino", "Crianca", "Jovem", "Adulto", "Idoso", "Total"],
    [
      ...DIAS_SAFE.map((dia) => {
        const row = perfil.rowsByDay[dia] ?? EMPTY_PERFIL_ROW;
        return [dia, n(row.masculino), n(row.feminino), n(row.crianca), n(row.jovem), n(row.adulto), n(row.idoso), n(row.total)];
      }),
      [
        "Total",
        n(perfil.totalGeral.masculino),
        n(perfil.totalGeral.feminino),
        n(perfil.totalGeral.crianca),
        n(perfil.totalGeral.jovem),
        n(perfil.totalGeral.adulto),
        n(perfil.totalGeral.idoso),
        n(perfil.totalGeral.total),
      ],
      ...(perfil.participacaoPct
        ? [
            [
              "Participacao %",
              `${n(perfil.participacaoPct.masculino)}%`,
              `${n(perfil.participacaoPct.feminino)}%`,
              `${n(perfil.participacaoPct.crianca)}%`,
              `${n(perfil.participacaoPct.jovem)}%`,
              `${n(perfil.participacaoPct.adulto)}%`,
              `${n(perfil.participacaoPct.idoso)}%`,
              `${n(perfil.participacaoPct.total)}%`,
            ],
          ]
        : []),
    ],
    120,
  );
  await addCharts([
    { key: "chart-perfil-genero", title: "Perfil por genero" },
    { key: "chart-perfil-idade", title: "Perfil por idade" },
  ]);

  addSectionTitle("2. FLUXO DE PESSOAS POR DIA DA SEMANA");
  addTable(
    [
      "Dia da semana",
      "Vendas realizadas",
      "Acompanhantes",
      "Vendas perdidas identificadas",
      "Possiveis vendas perdidas",
      "Trocas",
      "Outros",
      "Total",
    ],
    [
      ...DIAS_SAFE.map((dia) => {
        const row = data.fluxoPessoasPorDiaSemana.rows[dia];
        return [
          dia,
          n(row?.vendasRealizadas),
          n(row?.acompanhantes),
          n(row?.vendasPerdidasIdentificadas),
          n(row?.possiveisVendasPerdidas),
          n(row?.trocas),
          n(row?.outros),
          n(row?.total),
        ];
      }),
      [
        "Total",
        n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasRealizadas),
        n(data.fluxoPessoasPorDiaSemana.totalGeral.acompanhantes),
        n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasPerdidasIdentificadas),
        n(data.fluxoPessoasPorDiaSemana.totalGeral.possiveisVendasPerdidas),
        n(data.fluxoPessoasPorDiaSemana.totalGeral.trocas),
        n(data.fluxoPessoasPorDiaSemana.totalGeral.outros),
        n(data.fluxoPessoasPorDiaSemana.totalGeral.total),
      ],
    ],
    120,
  );
  await addCharts([
    { key: "chart-fluxo-grupo", title: "Fluxo por grupo" },
    { key: "chart-fluxo-dia", title: "Fluxo por dia da semana" },
  ]);

  addSectionTitle("3. FLUXO DE PESSOAS POR SEMANA");
  addTable(
    ["Dia da semana", "1a semana", "2a semana", "3a semana", "4a semana", "5a semana", "6a semana", "Total"],
    [
      ...DIAS_SAFE.map((dia) => {
        const row = data.fluxoPessoasPorSemana.rows[dia];
        return [dia, n(row?.w1), n(row?.w2), n(row?.w3), n(row?.w4), n(row?.w5), n(row?.w6), n(row?.total)];
      }),
      [
        "Total",
        n(data.fluxoPessoasPorSemana.totalGeral.w1),
        n(data.fluxoPessoasPorSemana.totalGeral.w2),
        n(data.fluxoPessoasPorSemana.totalGeral.w3),
        n(data.fluxoPessoasPorSemana.totalGeral.w4),
        n(data.fluxoPessoasPorSemana.totalGeral.w5),
        n(data.fluxoPessoasPorSemana.totalGeral.w6),
        n(data.fluxoPessoasPorSemana.totalGeral.total),
      ],
    ],
    120,
  );
  await addCharts([{ key: "chart-fluxo-semana", title: "Fluxo por semana" }]);

  addSectionTitle("4. VENDAS PERDIDAS");
  addTable(
    ["Dia da semana", "Preco", "Falta de mercadoria", "Mod/cor/tamanho", "Forma de pagamento", "Atendimento", "Outros", "Total"],
    [
      ...DIAS_SAFE.map((dia) => {
        const row = data.vendasPerdidasPorDiaSemana.rows[dia];
        return [
          dia,
          n(row?.preco),
          n(row?.faltaMercadoria),
          n(row?.modCorTamanho),
          n(row?.formaPagamento),
          n(row?.atendimento),
          n(row?.outros),
          n(row?.total),
        ];
      }),
      [
        "Total",
        n(data.vendasPerdidasPorDiaSemana.totalGeral.preco),
        n(data.vendasPerdidasPorDiaSemana.totalGeral.faltaMercadoria),
        n(data.vendasPerdidasPorDiaSemana.totalGeral.modCorTamanho),
        n(data.vendasPerdidasPorDiaSemana.totalGeral.formaPagamento),
        n(data.vendasPerdidasPorDiaSemana.totalGeral.atendimento),
        n(data.vendasPerdidasPorDiaSemana.totalGeral.outros),
        n(data.vendasPerdidasPorDiaSemana.totalGeral.total),
      ],
    ],
    120,
  );
  await addCharts([
    { key: "chart-perdas-grupo", title: "Vendas perdidas por grupo" },
    { key: "chart-perdas-dia", title: "Vendas perdidas por dia da semana" },
  ]);

  addSectionTitle("5. APROVEITAMENTO DAS VENDAS");
  addTable(
    ["Dia da semana", "Fluxo de pessoas", "Numero de vendas", "Aproveitamento %"],
    [
      ...DIAS_SAFE.map((dia) => {
        const row = data.aproveitamentoVendas.rows[dia];
        return [dia, n(row?.fluxoPessoas), n(row?.numeroVendas), `${n(row?.aproveitamento).toFixed(2)}%`];
      }),
      [
        "Total",
        n(data.aproveitamentoVendas.totalGeral.fluxoPessoas),
        n(data.aproveitamentoVendas.totalGeral.numeroVendas),
        `${n(data.aproveitamentoVendas.totalGeral.aproveitamento).toFixed(2)}%`,
      ],
    ],
    160,
  );
  await addCharts([{ key: "chart-aproveitamento", title: "Fluxo x vendas realizadas" }]);

  const safeStore = safeFilePart(lojaLabel) || "Loja";
  const modeLabel = orientation === "portrait" ? "RETRATO" : "PAISAGEM";
  const fileName = `RelatorioAuditoria_${data.ano}${String(data.mes).padStart(2, "0")}_${safeStore}_${modeLabel}.pdf`;
  doc.save(fileName);
}



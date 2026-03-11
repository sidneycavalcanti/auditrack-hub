import type { RelatorioMensalData } from "../../types/auditoria";
import type { DiaSemana } from "../../types/auditoria";

type ExportArgs = {
  data: RelatorioMensalData;
  lojaNome?: string;
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

function n(value: number | undefined | null) {
  return Number(value ?? 0);
}

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

async function exportFallbackClient({ data, lojaNome, fileName }: ExportArgs & { fileName: string }) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const resumo = XLSX.utils.aoa_to_sheet([
    ["Relatorio de Auditoria"],
    ["Loja", lojaNome || `Loja ${data.lojaId}`],
    ["Mes/Ano", `${String(data.mes).padStart(2, "0")}/${data.ano}`],
    ["Total Auditado", n(data.totalAuditado)],
    ["Total Vendido Mes", n(data.totalVendidoMes)],
  ]);
  XLSX.utils.book_append_sheet(wb, resumo, "Resumo");

  const perfilRows = DIAS.map((dia) => {
    const row = data.perfilClientesCompradores.rows[dia];
    return {
      dia,
      masculino: n(row?.masculino),
      feminino: n(row?.feminino),
      crianca: n(row?.crianca),
      jovem: n(row?.jovem),
      adulto: n(row?.adulto),
      idoso: n(row?.idoso),
      total: n(row?.total),
    };
  });
  perfilRows.push({
    dia: "Total",
    masculino: n(data.perfilClientesCompradores.totalGeral.masculino),
    feminino: n(data.perfilClientesCompradores.totalGeral.feminino),
    crianca: n(data.perfilClientesCompradores.totalGeral.crianca),
    jovem: n(data.perfilClientesCompradores.totalGeral.jovem),
    adulto: n(data.perfilClientesCompradores.totalGeral.adulto),
    idoso: n(data.perfilClientesCompradores.totalGeral.idoso),
    total: n(data.perfilClientesCompradores.totalGeral.total),
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perfilRows), "Perfil");

  const fluxoDiaRows = DIAS.map((dia) => {
    const row = data.fluxoPessoasPorDiaSemana.rows[dia];
    return {
      dia,
      vendasRealizadas: n(row?.vendasRealizadas),
      acompanhantes: n(row?.acompanhantes),
      vendasPerdidasIdentificadas: n(row?.vendasPerdidasIdentificadas),
      possiveisVendasPerdidas: n(row?.possiveisVendasPerdidas),
      trocas: n(row?.trocas),
      outros: n(row?.outros),
      total: n(row?.total),
    };
  });
  fluxoDiaRows.push({
    dia: "Total",
    vendasRealizadas: n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasRealizadas),
    acompanhantes: n(data.fluxoPessoasPorDiaSemana.totalGeral.acompanhantes),
    vendasPerdidasIdentificadas: n(data.fluxoPessoasPorDiaSemana.totalGeral.vendasPerdidasIdentificadas),
    possiveisVendasPerdidas: n(data.fluxoPessoasPorDiaSemana.totalGeral.possiveisVendasPerdidas),
    trocas: n(data.fluxoPessoasPorDiaSemana.totalGeral.trocas),
    outros: n(data.fluxoPessoasPorDiaSemana.totalGeral.outros),
    total: n(data.fluxoPessoasPorDiaSemana.totalGeral.total),
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fluxoDiaRows), "Fluxo Dia");

  const fluxoSemanaRows = DIAS.map((dia) => {
    const row = data.fluxoPessoasPorSemana.rows[dia];
    return {
      dia,
      w1: n(row?.w1),
      w2: n(row?.w2),
      w3: n(row?.w3),
      w4: n(row?.w4),
      w5: n(row?.w5),
      w6: n(row?.w6),
      total: n(row?.total),
    };
  });
  fluxoSemanaRows.push({
    dia: "Total",
    w1: n(data.fluxoPessoasPorSemana.totalGeral.w1),
    w2: n(data.fluxoPessoasPorSemana.totalGeral.w2),
    w3: n(data.fluxoPessoasPorSemana.totalGeral.w3),
    w4: n(data.fluxoPessoasPorSemana.totalGeral.w4),
    w5: n(data.fluxoPessoasPorSemana.totalGeral.w5),
    w6: n(data.fluxoPessoasPorSemana.totalGeral.w6),
    total: n(data.fluxoPessoasPorSemana.totalGeral.total),
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fluxoSemanaRows), "Fluxo Semana");

  const perdasRows = DIAS.map((dia) => {
    const row = data.vendasPerdidasPorDiaSemana.rows[dia];
    return {
      dia,
      preco: n(row?.preco),
      faltaMercadoria: n(row?.faltaMercadoria),
      modCorTamanho: n(row?.modCorTamanho),
      formaPagamento: n(row?.formaPagamento),
      atendimento: n(row?.atendimento),
      outros: n(row?.outros),
      total: n(row?.total),
    };
  });
  perdasRows.push({
    dia: "Total",
    preco: n(data.vendasPerdidasPorDiaSemana.totalGeral.preco),
    faltaMercadoria: n(data.vendasPerdidasPorDiaSemana.totalGeral.faltaMercadoria),
    modCorTamanho: n(data.vendasPerdidasPorDiaSemana.totalGeral.modCorTamanho),
    formaPagamento: n(data.vendasPerdidasPorDiaSemana.totalGeral.formaPagamento),
    atendimento: n(data.vendasPerdidasPorDiaSemana.totalGeral.atendimento),
    outros: n(data.vendasPerdidasPorDiaSemana.totalGeral.outros),
    total: n(data.vendasPerdidasPorDiaSemana.totalGeral.total),
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perdasRows), "Perdas");

  const apvRows = DIAS.map((dia) => {
    const row = data.aproveitamentoVendas.rows[dia];
    return {
      dia,
      fluxoPessoas: n(row?.fluxoPessoas),
      numeroVendas: n(row?.numeroVendas),
      aproveitamento: `${n(row?.aproveitamento).toFixed(2)}%`,
    };
  });
  apvRows.push({
    dia: "Total",
    fluxoPessoas: n(data.aproveitamentoVendas.totalGeral.fluxoPessoas),
    numeroVendas: n(data.aproveitamentoVendas.totalGeral.numeroVendas),
    aproveitamento: `${n(data.aproveitamentoVendas.totalGeral.aproveitamento).toFixed(2)}%`,
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(apvRows), "Aproveitamento");

  XLSX.writeFile(wb, fileName, { compression: true });
}

export default async function exportRelatorioAuditoriaXLSX({ data, lojaNome }: ExportArgs) {
  const fileName =
    `RelatorioAuditoria_${data.ano}${String(data.mes).padStart(2, "0")}.xlsx`;

  try {
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
    const serverFileName =
      getFileNameFromDisposition(response.headers.get("content-disposition")) || fileName;
    downloadBlob(blob, serverFileName);
  } catch {
    await exportFallbackClient({ data, lojaNome, fileName });
  }
}

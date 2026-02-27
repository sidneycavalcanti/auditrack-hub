// types/auditoria.ts

export type PieItem = { name: string; value: number };

export type FluxoDiaRow = {
  dia: string;
  vendas: number;
  acompanhante: number;
  especulador: number;
  outros: number;
};

export type IdadeRow = {
  dia: string;
  crianca: number;
  adulto: number;
  idoso: number;
};

export type SemanaIdadeRow = {
  semana: string;
  crianca: number;
  adulto: number;
  idoso: number;
};

// ✅ série dinâmica (sexo/gênero, motivos etc.)
export type DynamicSeriesRow = {
  label: string; // "Segunda-feira", "Terça-feira" ...
  [key: string]: string | number;
};

export type AudReportData = {
  meta: {
    loja: string;
    muc: string;
    mes: string;
    ano: number;
  };

  // ===== FLUXO (fixo 4 categorias)
  fluxoPorGrupo: PieItem[];
  fluxoPorDiaSemana: FluxoDiaRow[];

  // ===== PERFIL
  compradoresPorSexo: DynamicSeriesRow[]; // label + keys dinâmicas
  perfilPorIdade: IdadeRow[];
  fluxoPorSemanaMes: SemanaIdadeRow[];

  // ===== PERDAS (dinâmico)
  perdasPorMotivo: PieItem[];              // pizza dinâmica por motivo
  perdasPorDiaSemana: DynamicSeriesRow[];  // label + motivos dinâmicos

  // KPIs
  clientesCompraramVsNao: { compraram: number; naoCompraram: number; total: number };
  conversaoGeral: { totalFluxo: number; totalVendas: number; aproveitamento: number };
  ticketMedioGeral: number;
};
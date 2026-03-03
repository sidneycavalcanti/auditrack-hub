export type DiaSemana =
  | "Segunda-feira"
  | "Terça-feira"
  | "Quarta-feira"
  | "Quinta-feira"
  | "Sexta-feira"
  | "Sábado"
  | "Domingo";

export interface PerfilClientesRow {
  masculino: number;
  feminino: number;
  crianca: number;
  jovem: number;
  adulto: number;
  idoso: number;
  total: number;
}

export interface FluxoDiaRow {
  vendasRealizadas: number;
  acompanhantes: number;
  vendasPerdidasIdentificadas: number;
  possiveisVendasPerdidas: number;
  trocas: number;
  outros: number;
  total: number;
}

export interface FluxoSemanaRow {
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  w6: number;
  total: number;
}

export interface VendasPerdidasRow {
  preco: number;
  faltaMercadoria: number;
  modCorTamanho: number;
  formaPagamento: number;
  atendimento: number;
  outros: number;
  total: number;
}

export interface AproveitamentoRow {
  fluxoPessoas: number;
  numeroVendas: number;
  aproveitamento: number;
}

export interface SectionComParticipacao<T> {
  rows: Record<DiaSemana, T>;
  totalGeral: T;
  participacaoPct?: T;
}

export interface RelatorioMensalData {
  lojaId: number;
  mes: number;
  ano: number;
  totalAuditado: number;
  totalVendidoMes: number;
  perfilClientesCompradores: SectionComParticipacao<PerfilClientesRow>;
  fluxoPessoasPorDiaSemana: SectionComParticipacao<FluxoDiaRow>;
  fluxoPessoasPorSemana: SectionComParticipacao<FluxoSemanaRow>;
  vendasPerdidasPorDiaSemana: SectionComParticipacao<VendasPerdidasRow>;
  aproveitamentoVendas: {
    rows: Record<DiaSemana, AproveitamentoRow>;
    totalGeral: AproveitamentoRow;
  };
  meta: {
    auditorias: number;
    fluxos: number;
    vendas: number;
    perdas: number;
  };
}

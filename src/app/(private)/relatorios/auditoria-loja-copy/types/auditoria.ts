export type AudReportData = {
  meta: {
    loja: string
    muc: string
    mes: string
    ano: number
  }

  fluxoPorGrupo: {
    name: string
    value: number
  }[]

  fluxoPorDiaSemana: {
    dia: string
    vendasRealizadas: number
    acompanhantes: number
    vendasPerdidasIdentificadas: number
    possiveisVendasPerdidas: number
    outros: number
    trocas: number
  }[]

  perdasPorGrupo: {
    name: string
    value: number
  }[]

  perdasPorDiaSemana: {
    dia: string
    preco: number
    faltaMercadoria: number
    modeloCorTamanho: number
    formaPagamento: number
    atendimento: number
    outros: number
  }[]

  perfilPorIdade: {
  dia: string;
  crianca: number;
  adulto: number;
  idoso: number;
}[];

fluxoPorSemanaMes: {
  semana: string;
  crianca: number;
  adulto: number;
  idoso: number;
}[];

compradoresPorGenero: {
  dia: string;
  feminino: number;
  masculino: number;
}[];

  clientesCompraramVsNao: {
    compraram: number
    naoCompraram: number
    total: number
  }

  conversaoGeral: {
    totalFluxo: number
    totalVendas: number
    aproveitamento: number
  }

  ticketMedioGeral: number
}
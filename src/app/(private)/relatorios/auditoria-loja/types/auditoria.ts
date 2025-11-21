// FILE: src/app/(private)/relatorios/auditoria-loja/types/auditoria.ts
export type Turno = "Manhã" | "Tarde" | "Noite";
export type DiaSemana =
    | "Domingo" | "Segunda-feira" | "Terça-feira" | "Quarta-feira"
    | "Quinta-feira" | "Sexta-feira" | "Sábado";

export interface PerfilGenero {
    feminino: number; // %
    masculino: number; // %
}

export interface PerfilTurno {
    manha: number;  // %
    tarde: number;  // %
    noite: number;  // %
}

export interface MontanteGenero {
    masculino: number; // R$
    feminino: number;  // R$
}

export interface Conversao {
    totalFluxo: number;
    totalVendas: number;
    aproveitamento: number; // 0..1
}

export interface ConversaoPorDia {
    dia: DiaSemana;
    fluxo: number;
    vendas: number;
    aproveitamento: number; // 0..1
}

export interface TicketMedioPorTurno {
    turno: Turno;
    valor: number; // R$
}

export interface TicketMedioPorDia {
    dia: DiaSemana;
    valor: number; // R$
}

export interface IntervaloHorario {
    faixa: string;     // "09/10h", "10/11h", ...
    valores: Record<DiaSemana, "-" | number>; // R$ por dia
    total: number;     // soma da faixa
    pct: number;       // % s/ total
}

export interface MotivoPerda {
    motivo: string;    // Modelo, Tamanho, Cor, ...
    pct: number;       // %
}

export interface AudReportMeta {
    loja: string;      // "LA CAMICERIA"
    muc: string;       // "005/6"
    mes: string;       // "Junho"
    ano: number;       // 2022
}

export interface AudReportData {
    meta: AudReportMeta;

    perfilFrequentador: PerfilGenero & { turnos: PerfilTurno };
    perfilComprador: PerfilGenero & { turnos: PerfilTurno };

    montanteGenero: MontanteGenero;

    clientesCompraram: { fem: number; masc: number; total: number };
    clientesCompraramVsNao: { compraram: number; naoCompraram: number; total: number };

    conversaoGeral: Conversao;
    conversaoPorDia: ConversaoPorDia[];

    ticketMedioGeral: number;
    ticketMedioPorTurno: TicketMedioPorTurno[];
    ticketMedioPorDia: TicketMedioPorDia[];

    intervalos: IntervaloHorario[];

    motivosPerda: MotivoPerda[];

    // texto da “Avaliação Operacional”
    avaliacaoOperacional?: {
        vendasPerdidas?: { gradeIncompleta?: string[]; faltaAtendimento?: string; naoComercializados?: string[]; };
        comentarios?: {
            caixa?: string[];
            gerente?: string[];
            equipe?: string[];
            condicoesPagamento?: string[];
            conservacao?: string[];
            divulgacao?: string[];
            layout?: string[];
            provadores?: string[];
        };
    };
}
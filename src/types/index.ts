// Tipos principais para o sistema de auditoria

export interface User {
    id: number;
    name: string;
    username: string;
    password?: string;
    categoriaId: number;
    situacao: boolean;
    categoria?: {
        id: number;
        name: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthUser {
    id: number;
    name: string;
    categoria?: string;
    token: string;
}

export interface LoginCredentials {
    name: string;
    senha: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Loja {
    id: number;
    codigo: string;
    descricao: string;
    name?: string; // Propriedade adicional vinda do backend
    luc?: string;
    piso?: string;
    ativa?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Agendamento {
    id: number;
    data: string;
    hora: string;
    lojaId: number;
    usuarioId: number;
    status?: string;
    observacoes?: string;
    loja?: Loja;
    usuario?: User;
    createdAt?: string;
    updatedAt?: string;
}

export interface FormaPagamento {
    id: number;
    name: string;
    situacao: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Auditoria {
    id: number;
    data: string;
    horaInicial?: string;
    horaFinal?: string;
    lojaId: number;
    usuarioId: number;
    criadorId?: number;
    status?: string;
    observacoes?: string;
    loja?: Loja;
    usuario?: User;
    criador?: User;
    createdAt?: string;
    updatedAt?: string;
}

export interface Venda {
    id: number;
    auditoriaId: number;
    valor: number;
    formaPagamentoId: number;
    quantidade?: number;
    // lojaId e usuarioId não expostos na UI conforme especificado
    auditoria?: Auditoria;
    formaPagamento?: FormaPagamento;
    createdAt?: string;
    updatedAt?: string;
}

export interface MotivoPerda {
    id: number;
    name: string;
    situacao?: boolean;
    obs?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Perda {
    id: number;
    auditoriaId: number;
    motivoPerdaId: number;
    valor: number;
    quantidade?: number;
    observacoes?: string;
    // usuarioId e lojaId não expostos na UI
    auditoria?: Auditoria;
    motivoPerda?: MotivoPerda;
    createdAt?: string;
    updatedAt?: string;
}

export interface MotivoDepausa {
    id: number;
    name: string;
    situacao?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Pausa {
    id: number;
    auditoriaId: number;
    motivoDePausaId: number;
    duracao: number; // em minutos
    observacoes?: string;
    // usuarioId não exposto na UI
    auditoria?: Auditoria;
    motivoDepausa?: MotivoDepausa;
    createdAt?: string;
    updatedAt?: string;
}

export interface Categoria {
    id: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface Sexo {
    id: number;
    descricao: string;
    ativo?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CadQuestao {
    id: number;
    pergunta: string;
    tipo: 'multipla' | 'aberta' | 'boolean';
    opcoes?: string[];
    ativa?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CadQuestoes {
    id: number;
    name: string;
    situacao: boolean;
    cadavoperacionalId?: number;
    cadavoperacional?: CadAvOperacional;
    createdAt?: string;
    updatedAt?: string;
}

export interface Questao {
    id: number;
    auditoriaId: number;
    cadQuestaoId: number;
    resposta: string;
    pontuacao?: number;
    // usuarioId e lojaId não expostos na UI
    auditoria?: Auditoria;
    cadQuestao?: CadQuestao;
    createdAt?: string;
    updatedAt?: string;
}

export interface CadAvOperacional {
    id: number;
    descricao: string;
    situacao: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AvOperacional {
    id: number;
    auditoriaId: number;
    cadAvOperacionalId: number;
    pontuacao: number;
    observacoes?: string;

    // 🔽 extras úteis p/ tela (já vêm do backend)
    auditoria?: Auditoria;
    cadAvOperacional?: CadAvOperacional;
    questao?: { id: number; name: string; situacao?: boolean }; // <- backend manda "cadquestoes"
    nota?: number;         // alias compatível
    resposta?: string;     // alias compatível

    createdAt?: string;
    updatedAt?: string;
}

export interface Anotacao {
    id: number;
    auditoriaId: number;
    titulo: string;
    conteudo: string;
    tipo?: 'geral' | 'observacao' | 'problema';
    // usuarioId e lojaId não expostos na UI
    auditoria?: Auditoria;
    createdAt?: string;
    updatedAt?: string;
}

// Tipos para Dashboard/KPIs
export interface DashboardStats {
    totalAuditorias: number;
    auditoriasPendentes: number;
    auditoriasFinalizadas: number;
    totalLojas: number;
    totalVendas: number;
    totalPerdas: number;
    mediaPontuacao: number;
}

export interface ChartData {
    name: string;
    value: number;
    label?: string;
}

// Filtros e Paginação
export interface FilterOptions {
    search?: string;
    name?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
    lojaId?: number;
    usuarioId?: number;
    status?: string;
}

// Estados de loading
export interface LoadingState {
    isLoading: boolean;
    error: string | null;
}
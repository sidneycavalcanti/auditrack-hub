// src/services/api.ts
import axios, {
    AxiosInstance,
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";

/**
 * Notificador seguro para SSR/Next:
 * — Só importa "sonner" no client (window definido)
 * — Suporta: 'success' | 'error' | 'info' | 'warning'
 * — Se o método específico não existir, usa toast(message) como fallback.
 */
type ToastKind = "success" | "error" | "info" | "warning";
const notify = (kind: ToastKind, message: string) => {
    if (typeof window === "undefined") return;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { toast } = require("sonner");
        const t: any = toast;
        if (t && typeof t === "function") {
            if (typeof t[kind] === "function") t[kind](message);
            else t(message);
        }
    } catch {
        // silencioso: não quebra em SSR
    }
};

// Base URL via env (Next) com fallback
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://back-auditoria.onrender.com";

// Instância principal do Axios (isomórfica)
export const api: AxiosInstance = axios.create({    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
});

// Interceptor para adicionar token automaticamente (apenas no client)
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("auth_token");
            const authHeader = localStorage.getItem("auth_header");

            if (config.headers) {
                if (authHeader) {
                    config.headers.Authorization = authHeader;
                } else if (token) {
                    const normalized = token.trim();
                    config.headers.Authorization = /^(Bearer|JWT|Token)\s+/i.test(
                        normalized
                    )
                        ? normalized
                        : `Bearer ${normalized}`;
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de response — toasts e logout apenas no client
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url ?? "";

        if (typeof window !== "undefined") {
            // 401 (token inválido/expirado) com "debounce" simples
            if (status === 401) {
                const isLoginRequest = url.includes("/auth/signIn");

                // Guarda meta temporária no window (janela 30s)
                (window as any).__auth401 = (window as any).__auth401 || {
                    last: 0,
                    count: 0,
                };
                const meta = (window as any).__auth401;
                const now = Date.now();

                if (now - meta.last > 30000) meta.count = 0; // reset após 30s
                meta.last = now;
                meta.count += 1;

                if (!isLoginRequest) {
                    if (meta.count >= 2) {
                        // logout controlado
                        localStorage.removeItem("auth_token");
                        localStorage.removeItem("user_data");
                        if (!window.location.pathname.includes("/login")) {
                            notify("error", "Sessão expirada. Faça login novamente.");
                            window.location.href = "/login";
                        }
                    } else {
                        // primeira ocorrência: notifica apenas
                        notify(
                            "error",
                            "Falha de autenticação. Tente novamente ou recarregue a página."
                        );
                    }
                }
            }

            // 5xx
            if (status && status >= 500) {
                notify("error", "Erro do servidor. Tente novamente em instantes.");
            }

            // Erro de rede/timeout
            if (
                error.code === "ECONNABORTED" ||
                (error as any).message?.includes("Network Error")
            ) {
                notify("error", "Erro de conexão. Verifique sua internet.");
            }
        }

        return Promise.reject(error);
    }
);

/* ============================
    APIs organizadas por entidade
   ============================ */

export const authAPI = {
    signIn: (credentials: { name: string; senha: string }) => {
        // A API espera: username/password
        const payload = { username: credentials.name, password: credentials.senha };
        return api.post("/auth/signIn/", payload);
    },
};

export const usuarioAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/usuarios", { params: filters }),
    getById: (id: number) => api.get(`/usuarios/${id}`),
    create: (data: any) => api.post("/usuarios", data),
    update: (id: number, data: any) => api.put(`/usuarios/${id}`, data),
    delete: (id: number) => api.delete(`/usuarios/${id}`),
};

export const categoriaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/categorias", { params: filters }),
    getById: (id: number) => api.get(`/categorias/${id}`),
    create: (data: any) => api.post("/categorias", data),
    update: (id: number, data: any) => api.put(`/categorias/${id}`, data),
    delete: (id: number) => api.delete(`/categorias/${id}`),
};

export const lojaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/loja", { params: filters }),
    getById: (id: number) => api.get(`/loja/${id}`),
    create: (data: any) => api.post("/loja", data),
    update: (id: number, data: any) => api.put(`/loja/${id}`, data),
    delete: (id: number) => api.delete(`/loja/${id}`),
};

export const agendamentoAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/auditoria/agendamento", { params: filters }),
    getById: (id: number) => api.get(`/auditoria/agendamento/${id}`),
    create: (data: any) => api.post("/auditoria/agendamento", data),
    update: (id: number, data: any) =>
        api.put(`/auditoria/agendamento/${id}`, data),
    delete: (id: number) => api.delete(`/auditoria/agendamento/${id}`),
};

export const formaPagamentoAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/formadepagamento", { params: filters }),
    getById: (id: number) => api.get(`/formadepagamento/${id}`),
    create: (data: any) => api.post("/formadepagamento", data),
    update: (id: number, data: any) =>
        api.put(`/formadepagamento/${id}`, data),
    delete: (id: number) => api.delete(`/formadepagamento/${id}`),
};

export const auditoriaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/auditoria", { params: filters }),
    getById: (id: number) => api.get(`/auditoria/${id}`),
    create: (data: any) => api.post("/auditoria", data),
    update: (id: number, data: any) => api.put(`/auditoria/${id}`, data),
    delete: (id: number) => api.delete(`/auditoria/${id}`),
};

export const vendaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/vendas", { params: filters }),
    getById: (id: number) => api.get(`/vendas/${id}`),
    create: (data: any) => api.post("/vendas", data),
    update: (id: number, data: any) => api.put(`/vendas/${id}`, data),
    delete: (id: number) => api.delete(`/vendas/${id}`),

    reports: {
        resumoMensal: (params: { lojaId: number; ano: number; mes: number }) =>
            api.get("/vendas/reports/resumo-mensal", { params }),

        resumoDiario: (params: { lojaId: number; date: string }) =>
            api.get("/vendas/reports/resumo-diario", { params }),

        porHora: (params:
            | { lojaId: number; ano: number; mes: number; semana: number }
            | { lojaId: number; dateFrom: string; dateTo: string }
        ) => api.get("/vendas/reports/por-hora", { params }),
    },
};

export const fluxoAPI = {
    getAll: (filters?: Record<string, any>) => 
        api.get("/fluxo", { params: filters }),
    getById: (id: number) => api.get(`/fluxo/${id}`),
}

export const motivoPerdaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/motivoperdas", { params: filters }),
    getById: (id: number) => api.get(`/motivoperdas/${id}`),
    create: (data: any) => api.post("/motivoperdas", data),
    update: (id: number, data: any) => api.put(`/motivoperdas/${id}`, data),
    delete: (id: number) => api.delete(`/motivoperdas/${id}`),
};

export const perdaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/perdas", { params: filters }),
    getById: (id: number) => api.get(`/perdas/${id}`),
    create: (data: any) => api.post("/perdas", data),
    update: (id: number, data: any) => api.put(`/perdas/${id}`, data),
    delete: (id: number) => api.delete(`/perdas/${id}`),
};

export const motivoDePausaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/motivodepausa", { params: filters }),
    getById: (id: number) => api.get(`/motivodepausa/${id}`),
    create: (data: any) => api.post("/motivodepausa", data),
    update: (id: number, data: any) => api.put(`/motivodepausa/${id}`, data),
    delete: (id: number) => api.delete(`/motivodepausa/${id}`),
};

export const pausaAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/pausa", { params: filters }),
    getById: (id: number) => api.get(`/pausa/${id}`),
    create: (data: any) => api.post("/pausa", data),
    update: (id: number, data: any) => api.put(`/pausa/${id}`, data),
    delete: (id: number) => api.delete(`/pausa/${id}`),
};

export const sexoAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/cadsexo", { params: filters }),
    getById: (id: number) => api.get(`/cadsexo/${id}`),
    create: (data: any) => api.post("/cadsexo", data),
    update: (id: number, data: any) => api.put(`/cadsexo/${id}`, data),
    delete: (id: number) => api.delete(`/cadsexo/${id}`),
};

export const cadQuestaoAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/cadquestoes", { params: filters }),
    getById: (id: number) => api.get(`/cadquestoes/${id}`),
    create: (data: any) => api.post("/cadquestoes", data),
    update: (id: number, data: any) => api.put(`/cadquestoes/${id}`, data),
    delete: (id: number) => api.delete(`/cadquestoes/${id}`),
};

export const cadQuestoesAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/cadquestoes", { params: filters }),
    getById: (id: number) => api.get(`/cadquestoes/${id}`),
    create: (data: any) => api.post("/cadquestoes", data),
    update: (id: number, data: any) => api.put(`/cadquestoes/${id}`, data),
    delete: (id: number) => api.delete(`/cadquestoes/${id}`),
};

export const questaoAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/questoes", { params: filters }),
    getById: (id: number) => api.get(`/questoes/${id}`),
    create: (data: any) => api.post("/questoes", data),
    update: (id: number, data: any) => api.put(`/questoes/${id}`, data),
    delete: (id: number) => api.delete(`/questoes/${id}`),
};

export const cadAvOperacionalAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/cadavoperacional", { params: filters }),
    getById: (id: number) => api.get(`/cadavoperacional/${id}`),
    create: (data: any) => api.post("/cadavoperacional", data),
    update: (id: number, data: any) =>
        api.put(`/cadavoperacional/${id}`, data),
    delete: (id: number) => api.delete(`/cadavoperacional/${id}`),
};

export const avOperacionalAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/avoperacional", { params: filters }),
    getById: (id: number) => api.get(`/avoperacional/${id}`),
    create: (data: any) => api.post("/avoperacional", data),
    update: (id: number, data: any) => api.put(`/avoperacional/${id}`, data),
    delete: (id: number) => api.delete(`/avoperacional/${id}`),
};

export const anotacaoAPI = {
    getAll: (filters?: Record<string, any>) =>
        api.get("/anotacao", { params: filters }),
    getById: (id: number) => api.get(`/anotacao/${id}`),
    create: (data: any) => api.post("/anotacao", data),
    update: (id: number, data: any) => api.put(`/anotacao/${id}`, data),
    delete: (id: number) => api.delete(`/anotacao/${id}`),
};

export const fluxoPessoaAPI = {
  getAll: (filters?: Record<string, any>) => api.get("/fluxopessoa", { params: filters }),
};

/* ============================
    Utilitário de erro
   ============================ */
export const handleApiError = (error: any): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.status === 404) return "Recurso não encontrado";
    if (error?.response?.status === 403) return "Acesso negado";
    if (error?.response?.status === 422)
        return "Dados inválidos. Verifique os campos obrigatórios.";
    return "Erro inesperado. Tente novamente.";
};

export default api;
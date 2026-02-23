# 👨‍💻 Guia Prático de Desenvolvimento - Auditrack Hub

## 📌 Índice
1. [Roteiro de Configuração Inicial](#roteiro-de-configuração-inicial)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Como Criar Novas Páginas](#como-criar-novas-páginas)
4. [Como Criar Novos Componentes](#como-criar-novos-componentes)
5. [Como Integrar com API](#como-integrar-com-api)
6. [Padrões de Código](#padrões-de-código)
7. [Debugging e Testing](#debugging-e-testing)
8. [Checklist de Qualidade](#checklist-de-qualidade)

---

## 🚀 Roteiro de Configuração Inicial

### 1️⃣ Clonar e Instalar

```bash
# Clonar o repositório
git clone <repositorio-url>
cd auditrack-hub

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=https://back-auditoria.onrender.com
NEXT_PUBLIC_APP_NAME=Auditrack Hub
EOF

# Iniciar o servidor
npm run dev
```

**URL de acesso**: http://localhost:3000

### 2️⃣ Credenciais de Teste

```
Usuário: sua_matricula
Senha: sua_senha
```

*(Coordene com a equipe de backend para obter credenciais de teste)*

---

## 📁 Estrutura do Projeto

### Convenções de Nomes

```
Arquivos e Pastas:
  ✅ PascalCase para componentes: MyComponent.tsx
  ✅ camelCase para hooks: useMyHook.ts
  ✅ kebab-case para rotas: /my-page/*
  ✅ lowercase para tipos: my-api/endpoint

Componentes:
  ✅ Nome do arquivo = Nome do componente
  ✅ Um componente por arquivo
  ✅ Exports nomeados: export const MyComponent = ...
  ✅ Adicionar "use client" no topo para client components

Rotas:
  ✅ (private) para rotas autenticadas
  ✅ (public) para rotas públicas
  ✅ Cada rota = pasta com layout.tsx e page.tsx
```

### Hierarquia de Pastas

```
src/
├── app/
│   └── (private|public)/
│       └── feature-name/
│           ├── layout.tsx     (opcional)
│           ├── page.tsx       (obrigatório)
│           └── components/    (opcional)
│
├── components/
│   ├── common/                (sempre reutilizáveis)
│   ├── layouts/               (layouts page-level)
│   └── ui/                    (shadcn/ui components)
│
├── contexts/
│   └── FeatureContext.tsx     (se houver lógica complexa)
│
├── hooks/
│   └── useFeature.ts          (lógica reutilizável)
│
├── services/
│   └── featureAPI.ts          (endpoints específicos)
│
└── types/
    └── index.ts               (interfaces globais)
```

---

## 📄 Como Criar Novas Páginas

### Tipo 1: Página Simples (sem Layout)

```bash
# Criar estrutura
mkdir -p src/app/\(private\)/minha-pagina
touch src/app/\(private\)/minha-pagina/page.tsx
```

**Arquivo: `src/app/(private)/minha-pagina/page.tsx`**

```typescript
"use client";

import React from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function MinhaPage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minha Página</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name}!
          </p>
        </div>

        {/* Seu conteúdo aqui */}
      </div>
    </MainLayout>
  );
}
```

### Tipo 2: Página com Layout Customizado

```bash
# Criar estrutura com layout
mkdir -p src/app/\(private\)/minha-feature
touch src/app/\(private\)/minha-feature/layout.tsx
touch src/app/\(private\)/minha-feature/page.tsx
```

**Arquivo: `src/app/(private)/minha-feature/layout.tsx`**

```typescript
import React from "react";
import MainLayout from "@/components/layouts/MainLayout";

interface LayoutProps {
  children: React.ReactNode;
}

export default function FeatureLayout({ children }: LayoutProps) {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Componentes compartilhados */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">Minha Feature</h1>
        </div>

        {/* Conteúdo específico da rota */}
        {children}
      </div>
    </MainLayout>
  );
}
```

**Arquivo: `src/app/(private)/minha-feature/page.tsx`**

```typescript
"use client";

export default function FeaturePage() {
  return (
    <div>
      <p>Conteúdo da página</p>
    </div>
  );
}
```

### Tipo 3: Página com Sub-rotas

```
src/app/(private)/relatorios/
├── layout.tsx
├── page.tsx           # /relatorios (visão geral)
├── vendas/
│   └── page.tsx       # /relatorios/vendas
├── fluxos/
│   └── page.tsx       # /relatorios/fluxos
└── ...
```

---

## 🧩 Como Criar Novos Componentes

### Padrão: Componente Reutilizável

**Arquivo: `src/components/common/MyCard.tsx`**

```typescript
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MyCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export const MyCard: React.FC<MyCardProps> = ({
  title,
  description,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
```

### Uso do Componente

```typescript
import { MyCard } from "@/components/common/MyCard";

export default function Page() {
  return (
    <MyCard title="Título" description="Descrição">
      <p>Conteúdo do card</p>
    </MyCard>
  );
}
```

### Padrão: Componente de Formulário

**Arquivo: `src/components/forms/LoginForm.tsx`**

```typescript
"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    senha: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await signIn(formData);
      if (success) {
        toast.success("Login realizado com sucesso!");
        onSuccess?.();
      } else {
        toast.error("Credenciais inválidas");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("Erro ao fazer login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Usuário</label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Seu usuário"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <Input
          type="password"
          name="senha"
          value={formData.senha}
          onChange={handleChange}
          placeholder="Sua senha"
          required
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};
```

---

## 🔌 Como Integrar com API

### Passo 1: Criar Serviço de API

**Arquivo: `src/services/relatorioAPI.ts`**

```typescript
import { api } from "./api";
import { ApiResponse, PaginatedResponse } from "@/types";

export interface Relatorio {
  id: number;
  titulo: string;
  descricao: string;
  dataGeracao: string;
  // ... outros campos
}

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  loja?: number;
  page?: number;
  limit?: number;
}

export const relatorioAPI = {
  // Listar relatórios
  list: (filtros?: FiltrosRelatorio) =>
    api.get<PaginatedResponse<Relatorio>>("/relatorios", {
      params: filtros,
    }),

  // Obter um relatório
  getOne: (id: number) =>
    api.get<ApiResponse<Relatorio>>(`/relatorios/${id}`),

  // Criar relatório
  create: (data: Partial<Relatorio>) =>
    api.post<ApiResponse<Relatorio>>("/relatorios", data),

  // Atualizar relatório
  update: (id: number, data: Partial<Relatorio>) =>
    api.put<ApiResponse<Relatorio>>(`/relatorios/${id}`, data),

  // Deletar relatório
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/relatorios/${id}`),

  // Exportar para Excel
  exportExcel: (filtros?: FiltrosRelatorio) =>
    api.get("/relatorios/export/excel", {
      params: filtros,
      responseType: "blob",
    }),

  // Exportar para PDF
  exportPDF: (filtros?: FiltrosRelatorio) =>
    api.get("/relatorios/export/pdf", {
      params: filtros,
      responseType: "blob",
    }),
};
```

### Passo 2: Usar em Componente

```typescript
"use client";

import { useEffect, useState } from "react";
import { relatorioAPI, Relatorio } from "@/services/relatorioAPI";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";

export default function RelatoriosPage() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatorios = async () => {
      try {
        const { data } = await relatorioAPI.list({ limit: 20 });
        setRelatorios(data.data);
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
        toast.error("Erro ao carregar relatórios");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatorios();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar?")) return;

    try {
      await relatorioAPI.delete(id);
      setRelatorios(prev => prev.filter(r => r.id !== id));
      toast.success("Relatório deletado");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao deletar relatório");
    }
  };

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      const response = await relatorioAPI.exportExcel();
      // URL para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorios.${format}`);
      document.body.appendChild(link);
      link.click();
      toast.success(`Exportado para ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar");
    }
  };

  if (loading) return <LoadingSpinner message="Carregando relatórios..." />;

  if (relatorios.length === 0) {
    return (
      <EmptyState
        title="Nenhum relatório"
        description="Comece criando um novo relatório"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="space-x-2">
          <button 
            onClick={() => handleExport("excel")}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Exportar Excel
          </button>
          <button 
            onClick={() => handleExport("pdf")}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Título</th>
            <th className="p-2 text-left">Data</th>
            <th className="p-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {relatorios.map(r => (
            <tr key={r.id} className="border-t hover:bg-muted/50">
              <td className="p-2">{r.titulo}</td>
              <td className="p-2">{new Date(r.dataGeracao).toLocaleDateString('pt-BR')}</td>
              <td className="p-2 text-right space-x-2">
                <button 
                  onClick={() => handleDelete(r.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                >
                  Deletar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 💡 Padrões de Código

### Cliente Seguro para SSR

```typescript
// ✅ CORRETO: Verifica window
if (typeof window !== "undefined") {
  const token = localStorage.getItem("auth_token");
}

// ❌ INCORRETO: Falha em SSR
const token = localStorage.getItem("auth_token");
```

### Componente com Efeito

```typescript
"use client";

import { useEffect, useState } from "react";

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Este código roda APENAS no cliente
    setMounted(true);
  }, []);

  // Evitar hydration mismatch: não renderizar conteúdo client até mounted
  if (!mounted) return <div>Carregando...</div>;

  return <div>{data}</div>;
}
```

### Error Handling Pattern

```typescript
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    const response = await api.post("/endpoint", { data });
    
    if (!response.data) {
      toast.error("Resposta vazia do servidor");
      return;
    }

    setData(response.data);
    toast.success("Operação realizada!");
  } catch (error) {
    console.error("Erro:", error);
    
    // Tratamento específico por tipo de erro
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        // Não autenticado
      } else if (error.response?.status === 403) {
        // Sem permissão
      }
    }
    
    toast.error("Erro ao executar operação");
  } finally {
    setLoading(false);
  }
};
```

### Type-Safe Props

```typescript
interface MyComponentProps {
  // Obrigatórios
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
  
  // Opcionais com defaults
  variant?: "primary" | "secondary";
  disabled?: boolean;
  
  // Eventos
  onClick?: () => void;
  onError?: (error: Error) => void;
  
  // Children
  children?: React.ReactNode;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  variant = "primary",
  disabled = false,
  children,
  ...props
}) => {
  return <div>{/* ... */}</div>;
};
```

---

## 🐛 Debugging e Testing

### Debugging no VS Code

1. **Criar `.vscode/launch.json`:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "command": "npm run dev",
      "name": "Next.js",
      "request": "launch",
      "type": "node-terminal"
    }
  ]
}
```

2. **Colocar breakpoints** e usar DevTools do navegador

### Verificar Erros de Build

```bash
# Verificar tipos
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

### Console Logging Útil

```typescript
// Debugar contexto de autenticação
const AuthContext.useAuth();
console.log("User:", user, "Token:", token);

// Debugar estado
console.log("Loading:", loading, "Data:", data);

// Debugar requisições
api.interceptors.response.use(
  response => {
    console.log("✅ Response:", response.config.url, response.status);
    return response;
  },
  error => {
    console.log("❌ Error:", error.config?.url, error.response?.status);
    return Promise.reject(error);
  }
);
```

---

## ✅ Checklist de Qualidade

Antes de commitar código:

```
☐ TypeScript compila sem erros
  npm run build

☐ ESLint passa
  npm run lint

☐ Componentes usam "use client" quando necessário

☐ Componentes reutilizáveis estão em common/
  
☐ Componentes page-specific estão em components/ ou app/
  
☐ Serviços de API estão em services/

☐ Tipos estão export em types/index.ts

☐ Rotas protegidas estão em (private)

☐ Rotas públicas estão em (public)

☐ SSR-safety verificado (typeof window !== "undefined")

☐ Tratamento de erros em try/catch

☐ Notificações ao usuário (toast)

☐ Responsividade testada (mobile, tablet, desktop)

☐ Performance: sem console.log em produção

☐ Acessibilidade: alt text em imagens, labels em inputs

☐ Documentação de API adicionada em services/

☐ Componentes com PropTypes ou TypeScript props
```

---

## 🎓 Exemplos de Fluxos Completos

### Fluxo 1: Criar Nova Entidade

```
1. Criar serviço API em src/services/minhaFeatureAPI.ts
2. Criar tipo em src/types/index.ts
3. Criar rota em src/app/(private)/minha-feature/crear/
4. Criar formulário em src/components/forms/MinhaFeatureForm.tsx
5. Usar em page.tsx com handleSubmit -> API -> toast -> redirect
```

### Fluxo 2: Exibir e Filtrar Lista

```
1. Criar serviço com list(filtros) em src/services/minhaFeatureAPI.ts
2. Criar estado local: data, filtros, loading, erro
3. useEffect para carregar dados ao montar
4. Renderizar tabela com dados
5. Adicionar inputs de filtro que acionam novo fetch
6. Adicionar paginação se necessário
```

### Fluxo 3: Editar Entidade

```
1. Criar rota dinâmica: src/app/(private)/minha-feature/[id]/edit/page.tsx
2. useSearchParams para obter ID
3. useEffect para carregar dados específicos
4. Montar formulário com valores prefenchidos
5. handleSubmit chama API update()
6. Redirecionar para lista após sucesso
```

---

## 🔗 Git Workflow

```bash
# Feature nova
git checkout -b feature/nova-feature

# Desenvolvimento
# ... editar arquivos ...
git add .
git commit -m "feat: descrever mudança"

# Pull request
git push origin feature/nova-feature
# Abrir PR no GitHub

# Merge
# Após review e aprovação
git checkout main
git pull origin main
git merge feature/nova-feature
git push origin main
```

---

## 📖 Referência Rápida de Componentes

```typescript
// Button
import { Button } from "@/components/ui/button";
<Button variant="primary">Clique</Button>

// Input
import { Input } from "@/components/ui/input";
<Input placeholder="Digite..." />

// Select
import { Select } from "@/components/ui/select";
// Use <select> HTML ou Radix Select

// Accordion
import { Accordion } from "@/components/ui/accordion";
// Para seções expansíveis

// Toast
import { toast } from "sonner";
toast.success("Sucesso!");

// Loading
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
<LoadingSpinner message="Carregando..." />

// Empty State
import { EmptyState } from "@/components/common/EmptyState";
<EmptyState title="Vazio" description="Sem dados" />
```

---

**Última atualização**: 22 de fevereiro de 2026

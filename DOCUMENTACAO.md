# 📋 Documentação - Auditrack Hub

## 📑 Sumário
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Projeto](#arquitetura-do-projeto)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Configuração e Instalação](#configuração-e-instalação)
6. [Componentes Principais](#componentes-principais)
7. [Contextos e Hooks](#contextos-e-hooks)
8. [Serviços e APIs](#serviços-e-apis)
9. [Tipos e Interfaces](#tipos-e-interfaces)
10. [Navegação e Rotas](#navegação-e-rotas)
11. [Guia de Uso](#guia-de-uso)

---

## 🎯 Visão Geral

**Auditrack Hub** é um sistema web moderno de gerenciamento de auditorias empresariais desenvolvido em **Next.js 15+**. A aplicação fornece uma interface completa para:

- ✅ Gestão de auditorias
- ✅ Relatórios detalhados
- ✅ Controle de lojas e categorias
- ✅ Administração de usuários
- ✅ Análise de vendas, fluxos e perdas
- ✅ Avaliação operacional
- ✅ Gestão de pausas e motivos de perdas

O sistema utiliza uma **arquitetura client-server** com autenticação baseada em tokens, comunicando-se com um backend Node.js através de APIs REST.

---

## 🏗️ Arquitetura do Projeto

```
┌─────────────────────────────────────────────────────────────┐
│                    Auditrack Hub                             │
│                   (Frontend - Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            UI Components (React)                      │   │
│  │  ├─ Layouts (MainLayout, PrivateLayout)             │   │
│  │  ├─ Common (EmptyState, LoadingSpinner)             │   │
│  │  └─ UI (Buttons, Forms, Tables, etc.)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↑                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Contexts & Hooks (State Management)          │   │
│  │  ├─ AuthContext (Autenticação)                       │   │
│  │  └─ Custom Hooks (useAuth, etc.)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↑                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Services Layer (API Integration)             │   │
│  │  ├─ api.ts (Axios instance com interceptors)         │   │
│  │  ├─ authAPI (Endpoints de autenticação)              │   │
│  │  └─ Outras APIs (auditorias, relatórios, etc.)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                  │
├─────────────────────────────────────────────────────────────┤
│           🔌 Back-Auditoria (Backend - Node.js)             │
│    (https://back-auditoria.onrender.com)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
auditrack-hub/
├── public/
│   └── auditoria/           # Assets públicos (ícones, imagens)
│
├── scripts/
│   ├── remove-white-bg.ts   # Script para processar imagens
│   └── split-icons.ts       # Script para dividir ícones
│
├── src/
│   ├── app/
│   │   ├── (private)/       # Rotas privadas (autenticadas)
│   │   │   └── [page]/layout.tsx, page.tsx
│   │   ├── (public)/        # Rotas públicas (login, etc)
│   │   │   └── login/page.tsx
│   │   ├── layout.tsx       # Layout root
│   │   ├── page.tsx         # Home (redireciona para dashboard)
│   │   ├── globals.css      # Estilos globais
│   │   └── styles/          # Estilos específicos
│   │
│   ├── components/
│   │   ├── common/          # Componentes reutilizáveis
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── layouts/         # Layouts principais
│   │   │   ├── MainLayout.tsx    # Layout com sidebar e header
│   │   │   └── PrivateLayout.tsx
│   │   └── ui/              # Componentes UI (shadcn/ui)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── accordion.tsx
│   │       └── ...
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx  # Context de autenticação
│   │
│   ├── hooks/
│   │   ├── use-mobile.ts    # Hook para detectar mobile
│   │   └── useAuth.ts       # Hook customizado para auth
│   │
│   ├── lib/
│   │   └── utils.ts         # Funções utilitárias (cn, etc)
│   │
│   ├── services/
│   │   └── api.ts           # Configuração Axios e endpoints
│   │
│   └── types/
│       ├── index.ts         # Tipos principais da aplicação
│       └── canvg.d.ts       # Tipos para biblioteca external
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── components.json          # Configuração shadcn/ui
```

---

## 🛠️ Tecnologias Utilizadas

### Framework & Build
- **Next.js 15+** - Framework React com renderização híbrida (SSR/SSG)
- **React 19+** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Utilitários CSS

### UI Components
- **shadcn/ui** - Componentes acessíveis e customizáveis
- **Lucide React** - Ícones SVG
- **Radix UI** - Primitivos UI (accordions, dialogs, etc)

### State & API
- **Axios** - HTTP client
- **TanStack Query (React Query)** - Gerenciamento de estado servidor
- **Sonner** - Toast notifications

### Data & Relatórios
- **ExcelJS** - Geração de planilhas Excel
- **html2canvas** - Captura de elementos HTML
- **Canvg** - Renderização de SVG para canvas
- **date-fns** - Manipulação de datas

### Formulários
- **React Hook Form** - Gerenciamento eficiente de formulários
- **@hookform/resolvers** - Validação com Zod/Yup

### Validação
- **Zod** - Schema validation
- **Class Validator** - Validação de classes

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Backend (back-auditoria) rodando

### Instalação

```bash
# 1. Clonar o repositório ou navegar para o projeto
cd auditrack-hub

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Criar arquivo .env.local na raiz do projeto
echo "NEXT_PUBLIC_API_BASE_URL=https://back-auditoria.onrender.com" > .env.local

# 4. Iniciar servidor de desenvolvimento
npm run dev

# 5. Abrir no navegador
# http://localhost:3000
```

### Scripts Disponíveis

```bash
npm run dev         # Inicia servidor de desenvolvimento (porta 3000)
npm run build       # Cria build para produção
npm start           # Inicia servidor de produção
npm run lint        # ESLint para checar código
npm run images:alpha # Remove background branco de imagens
```

---

## 🧩 Componentes Principais

### MainLayout.tsx

O layout principal da aplicação com navegação sidebar e header.

**Localização:** [src/components/layouts/MainLayout.tsx](src/components/layouts/MainLayout.tsx)

**Responsabilidades:**
- Exibir navegação sidebar (responsiva - desktop/mobile)
- Renderizar header com informações do usuário
- Organizar e exibir itens de navegação por seções
- Gerenciar abertura/fechamento da sidebar em mobile

**Estrutura de Navegação:**

```jsx
NAV_ITEMS = [
  // Root (sempre visível)
  { name: "Dashboard", href: "/dashboard", section: "root" },
  
  // Gestão de Auditoria
  { name: "Gênero", href: "/genero", section: "GESTÃO DE AUDITORIA" },
  { name: "Lojas", href: "/lojas", section: "GESTÃO DE AUDITORIA" },
  { name: "Categorias", href: "/categorias", section: "GESTÃO DE AUDITORIA" },
  { name: "Auditorias", href: "/auditorias", section: "GESTÃO DE AUDITORIA" },
  { name: "Formas de Pagamento", href: "/formas-pagamento" },
  { name: "Avaliação Operacional", href: "/cad-av-operacional" },
  { name: "Cadastro de Questões", href: "/cad-questoes" },
  { name: "Motivo de perdas", href: "/motivo-perdas" },
  { name: "Motivo de pausas", href: "/motivo-pausas" },
  
  // Relatórios
  { name: "Rel. Vendas", href: "/relatorios/vendas", section: "RELATÓRIOS" },
  { name: "Rel. Fluxos", href: "/relatorios/fluxos", section: "RELATÓRIOS" },
  { name: "Rel. Perdas", href: "/relatorios/perdas", section: "RELATÓRIOS" },
  { name: "Rel. Pausas", href: "/relatorios/pausas", section: "RELATÓRIOS" },
  { name: "Rel. Av. Oper.", href: "/relatorios/avoperacional" },
  { name: "Rel. Auditoria", href: "/relatorios/auditoria-loja" },
  
  // Administração
  { name: "Usuários", href: "/usuarios", section: "ADMINISTRAÇÃO" }
]
```

**Props:**
- `children: React.ReactNode` - Conteúdo da página

**Componentes Filhos:**
- `SidebarContent` - Renderiza o conteúdo da sidebar
- `SidebarLink` - Link individual de navegação

**Estados:**
- `sidebarOpen` - Controla visibilidade da sidebar em mobile
- `user` - Usuário autenticado (via AuthContext)

---

### EmptyState.tsx

Componente para exibir estado vazio de listas/tabelas.

**Localização:** [src/components/common/EmptyState.tsx](src/components/common/EmptyState.tsx)

**Uso:**
```tsx
<EmptyState 
  icon={BoxIcon}
  title="Nenhum item encontrado"
  description="Não há dados para exibir"
/>
```

---

### LoadingSpinner.tsx

Componente de carregamento com spinner animado.

**Localização:** [src/components/common/LoadingSpinner.tsx](src/components/common/LoadingSpinner.tsx)

**Uso:**
```tsx
<LoadingSpinner message="Carregando dados..." />
```

---

## 🎣 Contextos e Hooks

### AuthContext

Gerencia o estado de autenticação global da aplicação.

**Localização:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

**Interface:**
```typescript
interface AuthContextType {
  user: AuthUser | null;           // Usuário autenticado
  isLoading: boolean;              // Carregamento
  isAuthenticated: boolean;        // Status de autenticação
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  signOut: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
}

interface AuthUser {
  id: number;
  name: string;
  categoria?: string;
  token: string;
}

interface LoginCredentials {
  name: string;
  senha: string;
}
```

**Fluxo de Autenticação:**

1. **Inicialização**: Ao montar o provider, verifica localStorage por token/dados
2. **Login**: Envia credenciais para backend, recebe token e dados do usuário
3. **Armazenamento**: Salva token e dados no localStorage
4. **Logout**: Remove dados do localStorage e redireciona para login

**Uso:**
```tsx
// Dentro de um componente client
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  
  return (
    <>
      {isAuthenticated && <p>Olá, {user?.name}</p>}
      <button onClick={() => signOut()}>Sair</button>
    </>
  );
}
```

**Persistência:**
- Token armazenado em: `localStorage.getItem("auth_token")`
- Dados do usuário em: `localStorage.getItem("user_data")`
- Header de autenticação em: `localStorage.getItem("auth_header")`

---

### useAuth Hook

Hook customizado para acessar o contexto de autenticação.

```tsx
const { user, isAuthenticated, signIn, signOut } = useAuth();
```

---

### use-mobile Hook

Detecta se a aplicação está sendo acessada em um dispositivo móvel.

```tsx
const isMobile = useMobile();
```

---

## 🔌 Serviços e APIs

### API Service (api.ts)

Configuração centralizada do Axios com interceptores para autenticação.

**Localização:** [src/services/api.ts](src/services/api.ts)

**Configuração:**
```typescript
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  "https://back-auditoria.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});
```

**Interceptadores:**

1. **Request Interceptor**
   - Adiciona token de autenticação automaticamente
   - Define header personalizado (auth_header)
   - Apenas no lado cliente (window definido)

2. **Response Interceptor**
   - Trata erros padrão (400, 401, 403, 500, etc)
   - Mostra notificações com Sonner Toast
   - Redireciona para login em caso de 401 (token inválido)

**Funções Principais:**

```typescript
// Notificações seguras para SSR
notify(kind: 'success' | 'error' | 'info' | 'warning', message: string)

// Tratamento de erros
handleApiError(error: AxiosError): ApiErrorResponse

// Criar instância com config customizado
createApiInstance(config?: AxiosRequestConfig)
```

**Endpoints de Autenticação:**

```typescript
export const authAPI = {
  // POST /auth/login
  signIn: (credentials: LoginCredentials) => 
    api.post<{token, user}>('/auth/login', credentials),
  
  // POST /auth/logout  
  signOut: () => 
    api.post('/auth/logout'),
};
```

**Exemplos de Uso:**

```typescript
import { api, authAPI } from '@/services/api';

// Fazer login
const { data } = await authAPI.signIn({
  name: 'usuario',
  senha: 'senha123'
});

// Requisição GET
const response = await api.get('/auditorias');

// Requisição POST
const response = await api.post('/auditorias', { data });

// Requisição com header customizado
const response = await api.get('/usuarios', {
  headers: { 'X-Custom': 'value' }
});
```

---

## 📝 Tipos e Interfaces

### Tipos Principais

**Localização:** [src/types/index.ts](src/types/index.ts)

```typescript
// Usuário
export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  categoriaId: number;
  situacao: boolean;
  categoria?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  categoria?: string;
  token: string;
}

// Autenticação
export interface LoginCredentials {
  name: string;
  senha: string;
}

// Respostas de API
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

// Entidades de Negócio
export interface Loja {
  id: number;
  codigo: string;
  descricao: string;
  name?: string;
  luc?: string;
  piso?: string;
  [key: string]: any;
}

// ... outros tipos (Auditoria, Categoria, Relatório, etc)
```

---

## 🗺️ Navegação e Rotas

### Estrutura de Rotas (Next.js App Router)

```
/
├── (public)
│   ├── login/                    # Página de login
│   └── ...
│
└── (private)                      # Rotas protegidas por autenticação
    ├── dashboard/                 # Dashboard principal
    ├── auditorias/                # Gestão de auditorias
    ├── lojas/                     # Gestão de lojas
    ├── categorias/                # Gestão de categorias
    ├── usuarios/                  # Gestão de usuários
    ├── genero/                    # Gestão de gênero
    ├── formas-pagamento/          # Formas de pagamento
    ├── cad-av-operacional/        # Avaliação operacional
    ├── cad-questoes/              # Cadastro de questões
    ├── motivo-perdas/             # Motivos de perdas
    ├── motivo-pausas/             # Motivos de pausas
    │
    └── relatorios/
        ├── vendas/                # Relatório de vendas
        ├── fluxos/                # Relatório de fluxos
        ├── perdas/                # Relatório de perdas
        ├── pausas/                # Relatório de pausas
        ├── avoperacional/         # Relatório de av. operacional
        └── auditoria-loja/        # Relatório por loja
```

### Proteção de Rotas

Rotas privadas são acessíveis apenas com token válido. O middleware de autenticação:

1. Verifica se usuário está autenticado
2. Valida token no localStorage
3. Redireciona para login se não autenticado

---

## 📱 Guia de Uso

### Para Desenvolvedores

#### 1. Acessar Dados Autenticados

```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function MyPage() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <h1>Bem-vindo, {user?.name}!</h1>
      ) : (
        <p>Você não está autenticado</p>
      )}
    </div>
  );
}
```

#### 2. Fazer Requisições à API

```tsx
import { api } from "@/services/api";
import { useEffect, useState } from "react";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/usuarios");
        setUsers(data);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

#### 3. Usar Componentes UI

```tsx
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

export default function MyComponent() {
  return (
    <div>
      <Button>Clique aqui</Button>
      
      <Accordion>
        <AccordionItem value="item-1">
          <h3>Seção 1</h3>
          <p>Conteúdo 1</p>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

#### 4. Adicionar Notificações

```tsx
import { toast } from "sonner";

// Sucesso
toast.success("Operação realizada com sucesso!");

// Erro
toast.error("Ocorreu um erro!");

// Info
toast.info("Informação importante");

// Warning
toast.warning("Aviso");
```

---

### Para Administradores

#### Estrutura de Usuários
- Usuário padrão com categoria associada
- Categorias definem permissões
- Login com username e senha

#### Acessar Funcionalidades

**Dashboard** → Visualizar resumo de auditorias

**Gestão de Auditorias** → Gerenciar:
- Gênero
- Lojas
- Categorias
- Auditorias
- Formas de pagamento
- Avaliação operacional
- Questões
- Motivos de perdas/pausas

**Relatórios** → Gerar:
- Vendas
- Fluxos
- Perdas
- Pausas
- Avaliação operacional
- Auditoria por loja

**Administração** → Gerenciar usuários

---

## 🔐 Segurança

### Boas Práticas Implementadas

1. ✅ **Token-based Authentication**
   - JWT ou similar via backend
   - Armazenado em localStorage

2. ✅ **Requisições Autenticadas**
   - Interceptor adiciona token automaticamente
   - Header customizado (auth_header)

3. ✅ **Tratamento de Erros**
   - 401: Redireciona para login
   - 403: Acesso negado
   - 500: Erro servidor

4. ✅ **SSR-Safe**
   - Verificação de `window` antes de acessar localStorage
   - Carregamento seguro de bibliotecas client-side

---

## 📊 Tipos de Dados Principais

### Auditoria
Entidade principal do sistema com dados de avaliação, vendas, fluxos, etc.

### Loja
Unidade de negócio onde ocorrem as auditorias.

### Categoria
Classificação de auditoria ou usuário.

### Relatórios
Consolidação de dados em formato tabular ou gráfico.

---

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# 1. Push código para GitHub
git push origin main

# 2. Conectar no Vercel
# https://vercel.com/new

# 3. Configurar variáveis de ambiente
NEXT_PUBLIC_API_BASE_URL=https://back-auditoria.onrender.com

# 4. Deploy automático!
```

### Outras Plataformas
- Netlify, Railway, ou Docker

---

## 🐛 Troubleshooting

### Problema: "useAuth deve ser usado dentro de um AuthProvider"
**Solução**: Certifique-se que o componente está envolvido por `AuthProvider` no layout root.

### Problema: Token inválido (401)
**Solução**: Limpe localStorage e faça login novamente.
```javascript
localStorage.removeItem("auth_token");
localStorage.removeItem("user_data");
```

### Problema: CORS error
**Solução**: Verifique se a URL da API está correta em `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://back-auditoria.onrender.com
```

---

## 📚 Recursos Adicionais

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [TanStack Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com)

---

## 📝 Notas Gerais

- **Responsividade**: Aplicação totalmente responsiva (mobile, tablet, desktop)
- **Temas**: Sistema de design com Tailwind CSS (cores, espaçamento, tipografia)
- **Performance**: Otimizações de Next.js (code splitting, lazy loading)
- **Type Safety**: TypeScript em 100% do código
- **Acessibilidade**: Componentes Radix UI com suporte a ARIA

---

## ✍️ Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 0.1.0 | 2026-02-22 | Versão inicial com dashboard, gestão de auditorias e relatórios |

---

**Última atualização**: 22 de fevereiro de 2026

**Desenvolvedor(es)**: Equipe de Desenvolvimento

**Contato**: [email@example.com](mailto:email@example.com)

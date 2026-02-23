# 📚 Referência de Componentes e Endpoints - Auditrack Hub

## 📑 Índice
1. [Componentes UI](#componentes-ui)
2. [Componentes Comuns](#componentes-comuns)
3. [Componentes de Layout](#componentes-de-layout)
4. [Hooks Customizados](#hooks-customizados)
5. [Endpoints da API](#endpoints-da-api)
6. [Tipos Globais](#tipos-globais)

---

## 🎨 Componentes UI

### Button

Componente de botão versátil com várias variantes.

```typescript
import { Button } from "@/components/ui/button";

// Variantes
<Button>Primary (padrão)</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="md">Medium (padrão)</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// Estados
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>

// Combinações
<Button variant="ghost" size="icon" className="rounded-full">
  X
</Button>
```

### Input

Campo de entrada de texto.

```typescript
import { Input } from "@/components/ui/input";

// Básico
<Input placeholder="Escreva aqui..." />

// Com label
<div>
  <label className="block text-sm mb-1">Nome</label>
  <Input type="text" placeholder="Seu nome" />
</div>

// Tipos
<Input type="email" />
<Input type="password" />
<Input type="number" />
<Input type="date" />

// Estados
<Input disabled />
<Input readOnly value="Somente leitura" />
```

### Label

Rótulo para inputs.

```typescript
import { Label } from "@/components/ui/label";

<Label htmlFor="input-id">Seu label</Label>
<Input id="input-id" />
```

### Select

Seletor dropdown.

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={selected} onValueChange={setSelected}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcao1">Opção 1</SelectItem>
    <SelectItem value="opcao2">Opção 2</SelectItem>
    <SelectItem value="opcao3">Opção 3</SelectItem>
  </SelectContent>
</Select>
```

### Checkbox

Caixa de seleção.

```typescript
import { Checkbox } from "@/components/ui/checkbox";

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Aceito os termos</Label>
</div>
```

### RadioGroup

Grupo de botões de rádio.

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

<RadioGroup value={selected} onValueChange={setSelected}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="opcao1" id="r1" />
    <Label htmlFor="r1">Opção 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="opcao2" id="r2" />
    <Label htmlFor="r2">Opção 2</Label>
  </div>
</RadioGroup>
```

### Accordion

Seções expansíveis.

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Seção 1</AccordionTrigger>
    <AccordionContent>Conteúdo 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Seção 2</AccordionTrigger>
    <AccordionContent>Conteúdo 2</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Dialog

Modal/diálogo.

```typescript
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
      <DialogDescription>Descrição ou instrução</DialogDescription>
    </DialogHeader>
    <div>Conteúdo aqui</div>
  </DialogContent>
</Dialog>
```

### Table

Tabela de dados.

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Coluna 1</TableHead>
      <TableHead>Coluna 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Dado 1</TableCell>
      <TableCell>Dado 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Card

Cartão/container.

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo aqui</CardContent>
</Card>
```

### Tabs

Abas navegáveis.

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Aba 1</TabsTrigger>
    <TabsTrigger value="tab2">Aba 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Conteúdo aba 1</TabsContent>
  <TabsContent value="tab2">Conteúdo aba 2</TabsContent>
</Tabs>
```

### Alert

Alertas/notificações.

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>Ocorreu um erro</AlertDescription>
</Alert>
```

### Badge

Etiquetas/tags.

```typescript
import { Badge } from "@/components/ui/badge";

<Badge>Padrão</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destruir</Badge>
```

### Spinner/Loading

Indicador de carregamento.

```typescript
import { Loader } from "lucide-react";

<div className="flex items-center gap-2">
  <Loader className="h-4 w-4 animate-spin" />
  <span>Carregando...</span>
</div>
```

---

## 🔄 Componentes Comuns

### EmptyState

Exibe quando não há dados.

```typescript
import { EmptyState } from "@/components/common/EmptyState";

<EmptyState 
  icon={BoxIcon}
  title="Nenhum item encontrado"
  description="Não há dados para exibir no momento"
/>
```

### LoadingSpinner

Tela de carregamento.

```typescript
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

<LoadingSpinner message="Carregando dados..." />
```

---

## 🎯 Componentes de Layout

### MainLayout

Layout principal com sidebar e header.

```typescript
import MainLayout from "@/components/layouts/MainLayout";

export default function Page() {
  return (
    <MainLayout>
      {/* Seu conteúdo aqui */}
    </MainLayout>
  );
}
```

**Features:**
- Sidebar responsiva (desktop/mobile)
- Header com informações do usuário
- Navegação por seções
- Menu mobile com overlay

---

## 🎣 Hooks Customizados

### useAuth

Acessa contexto de autenticação.

```typescript
import { useAuth } from "@/contexts/AuthContext";

const { 
  user,                    // AuthUser | null
  isAuthenticated,         // boolean
  isLoading,              // boolean
  signIn,                 // (credentials) => Promise<boolean>
  signOut,                // () => void
  updateUser              // (data) => void
} = useAuth();
```

### use-mobile

Detecta se está em viewport mobile.

```typescript
import { useMobile } from "@/hooks/use-mobile";

const isMobile = useMobile();

return isMobile ? <MobileView /> : <DesktopView />;
```

---

## 🔌 Endpoints da API

### Autenticação

```typescript
// Login
POST /auth/login
Body: { name: string, senha: string }
Response: { token: string, user: User }

// Logout
POST /auth/logout
Headers: { Authorization: "Bearer <token>" }

// Refresh Token (se implementado)
POST /auth/refresh
Headers: { Authorization: "Bearer <token>" }
```

### Usuários

```typescript
// Listar usuários
GET /usuarios?page=1&limit=20
Response: { data: User[], total, page, limit, totalPages }

// Obter um usuário
GET /usuarios/:id
Response: { data: User }

// Criar usuário
POST /usuarios
Body: { name, username, password, categoriaId }
Response: { data: User }

// Atualizar usuário
PUT /usuarios/:id
Body: { name?, username?, password?, categoriaId? }
Response: { data: User }

// Deletar usuário
DELETE /usuarios/:id
Response: { success: true }
```

### Lojas

```typescript
// Listar lojas
GET /lojas?page=1&limit=20
Response: { data: Loja[], total, page, limit, totalPages }

// Obter loja
GET /lojas/:id
Response: { data: Loja }

// Criar loja
POST /lojas
Body: { codigo, descricao, luc?, piso? }
Response: { data: Loja }

// Atualizar loja
PUT /lojas/:id
Body: { codigo?, descricao?, luc?, piso? }
Response: { data: Loja }

// Deletar loja
DELETE /lojas/:id
Response: { success: true }
```

### Categorias

```typescript
// Listar categorias
GET /categorias
Response: { data: Categoria[] }

// Criar categoria
POST /categorias
Body: { name, descricao? }
Response: { data: Categoria }

// Atualizar categoria
PUT /categorias/:id
Body: { name?, descricao? }
Response: { data: Categoria }

// Deletar categoria
DELETE /categorias/:id
Response: { success: true }
```

### Auditorias

```typescript
// Listar auditorias
GET /auditorias?lojaId=1&dataInicio=2024-01-01&page=1
Response: { data: Auditoria[], total, page, limit, totalPages }

// Obter auditoria
GET /auditorias/:id
Response: { data: Auditoria }

// Criar auditoria
POST /auditorias
Body: { 
  lojaId, 
  dataAuditoria,
  usuarioId,
  dados: { vendas, fluxo, pausa, perdas, avOperacional }
}
Response: { data: Auditoria }

// Atualizar auditoria
PUT /auditorias/:id
Body: { ...dados }
Response: { data: Auditoria }

// Deletar auditoria
DELETE /auditorias/:id
Response: { success: true }
```

### Relatórios

```typescript
// Vendas
GET /relatorios/vendas?dataInicio=2024-01-01&dataFim=2024-01-31&lojaId=1
Response: { data: RelatorioVendas[] }

// Fluxos
GET /relatorios/fluxos?dataInicio=2024-01-01&dataFim=2024-01-31
Response: { data: RelatorioFluxo[] }

// Perdas
GET /relatorios/perdas?lojaId=1&motivo=1
Response: { data: RelatorioPerda[] }

// Pausas
GET /relatorios/pausas?lojaId=1&dataInicio=2024-01-01
Response: { data: RelatorioPausa[] }

// Avaliação Operacional
GET /relatorios/avoperacional?lojaId=1&dataInicio=2024-01-01
Response: { data: RelatorioAvoperacional[] }

// Auditoria por Loja
GET /relatorios/auditoria-loja?lojaId=1&mes=2024-01
Response: { data: RelatorioAuditoria[] }

// Exportar para Excel
GET /relatorios/:tipo/export/excel?filtros...
Response: Arquivo Excel (blob)

// Exportar para PDF
GET /relatorios/:tipo/export/pdf?filtros...
Response: Arquivo PDF (blob)
```

### Questões

```typescript
// Listar questões
GET /questoes
Response: { data: Questao[] }

// Obter questão
GET /questoes/:id
Response: { data: Questao }

// Criar questão
POST /questoes
Body: { descricao, categoria?, tipo? }
Response: { data: Questao }

// Atualizar questão
PUT /questoes/:id
Body: { descricao?, categoria?, tipo? }
Response: { data: Questao }

// Deletar questão
DELETE /questoes/:id
Response: { success: true }
```

### Motivo de Pausas

```typescript
// Listar motivos
GET /motivo-pausas
Response: { data: MotivoPausa[] }

// Criar motivo
POST /motivo-pausas
Body: { descricao }
Response: { data: MotivoPausa }

// Atualizar motivo
PUT /motivo-pausas/:id
Body: { descricao }
Response: { data: MotivoPausa }

// Deletar motivo
DELETE /motivo-pausas/:id
Response: { success: true }
```

### Motivo de Perdas

```typescript
// Listar motivos
GET /motivo-perdas
Response: { data: MotivoPerdas[] }

// Criar motivo
POST /motivo-perdas
Body: { descricao }
Response: { data: MotivoPerdas }

// Atualizar motivo
PUT /motivo-perdas/:id
Body: { descricao }
Response: { data: MotivoPerdas }

// Deletar motivo
DELETE /motivo-perdas/:id
Response: { success: true }
```

### Gênero

```typescript
// Listar gêneros
GET /genero
Response: { data: Genero[] }

// Criar gênero
POST /genero
Body: { descricao }
Response: { data: Genero }

// Atualizar gênero
PUT /genero/:id
Body: { descricao }
Response: { data: Genero }

// Deletar gênero
DELETE /genero/:id
Response: { success: true }
```

### Formas de Pagamento

```typescript
// Listar formas
GET /formas-pagamento
Response: { data: FormaPagamento[] }

// Criar forma
POST /formas-pagamento
Body: { descricao }
Response: { data: FormaPagamento }

// Atualizar forma
PUT /formas-pagamento/:id
Body: { descricao }
Response: { data: FormaPagamento }

// Deletar forma
DELETE /formas-pagamento/:id
Response: { success: true }
```

### Avaliação Operacional

```typescript
// Listar itens
GET /avaliacoes-operacionais
Response: { data: AvaliacaoOperacional[] }

// Criar item
POST /avaliacoes-operacionais
Body: { descricao, peso? }
Response: { data: AvaliacaoOperacional }

// Atualizar item
PUT /avaliacoes-operacionais/:id
Body: { descricao?, peso? }
Response: { data: AvaliacaoOperacional }

// Deletar item
DELETE /avaliacoes-operacionais/:id
Response: { success: true }
```

---

## 📦 Tipos Globais

### Entidades

```typescript
// Usuário
export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  categoriaId: number;
  situacao: boolean;
  categoria?: Categoria;
  createdAt?: string;
  updatedAt?: string;
}

// Usuário autenticado
export interface AuthUser {
  id: number;
  name: string;
  categoria?: string;
  token: string;
}

// Loja
export interface Loja {
  id: number;
  codigo: string;
  descricao: string;
  luc?: string;
  piso?: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Categoria
export interface Categoria {
  id: number;
  name: string;
  descricao?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auditoria
export interface Auditoria {
  id: number;
  lojaId: number;
  usuarioId: number;
  dataAuditoria: string;
  vendas?: number;
  fluxo?: number;
  pausa?: number;
  perdas?: number;
  avOperacional?: number;
  observacoes?: string;
  loja?: Loja;
  usuario?: User;
  createdAt?: string;
  updatedAt?: string;
}

// Questão
export interface Questao {
  id: number;
  descricao: string;
  categoria?: string;
  tipo?: string;
  obrigatoria?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Motivo de Pausa
export interface MotivoPausa {
  id: number;
  descricao: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Motivo de Perda
export interface MotivoPerdas {
  id: number;
  descricao: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Gênero
export interface Genero {
  id: number;
  descricao: string;
  createdAt?: string;
  updatedAt?: string;
}

// Forma de Pagamento
export interface FormaPagamento {
  id: number;
  descricao: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Avaliação Operacional
export interface AvaliacaoOperacional {
  id: number;
  descricao: string;
  peso?: number;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### Respostas e Utilitários

```typescript
// Resposta de API genérica
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Credenciais de login
export interface LoginCredentials {
  name: string;
  senha: string;
}

// Erro de API
export interface ApiErrorResponse {
  message: string;
  code?: string;
  status: number;
  details?: any;
}
```

---

## 🎨 Utilidades Tailwind

### Cores do Sistema

```css
/* Primárias */
.bg-primary, .text-primary, .border-primary
.bg-primary-foreground, .text-primary-foreground

/* Secundárias */
.bg-secondary, .text-secondary
.bg-secondary-foreground, .text-secondary-foreground

/* Neutras */
.bg-foreground, .text-foreground
.bg-background, .text-background
.bg-card, .bg-muted, .text-muted-foreground
.bg-border, .border-border

/* Estados */
.bg-destructive, .text-destructive
.bg-success, .text-success
.bg-warning, .text-warning
.bg-info, .text-info
```

### Utilitários Comuns

```typescript
import { cn } from "@/lib/utils";

// Combinar classes condicionalmente
const className = cn(
  "base-class",
  isActive && "bg-primary",
  variant === "large" && "text-lg"
);

// Exemplo com componente
const Button = ({ isLoading, className }) => (
  <button 
    className={cn(
      "px-4 py-2 rounded",
      isLoading && "opacity-50 cursor-not-allowed",
      className
    )}
  >
    ...
  </button>
);
```

---

**Última atualização**: 22 de fevereiro de 2026

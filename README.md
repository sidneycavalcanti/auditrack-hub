# Auditrack Hub

Sistema web para gestao de auditorias de lojas, com modulos de cadastro, operacao e relatorios (vendas, fluxos, perdas, pausas, avaliacao operacional e auditoria por loja).

## Sumario
1. Visao geral
2. Stack tecnica
3. Estrutura do projeto
4. Modulos funcionais
5. Requisitos
6. Configuracao local
7. Scripts disponiveis
8. Padroes de desenvolvimento
9. Relatorios e exportacoes
10. Integracao com backend
11. Troubleshooting
12. Documentacao complementar

## 1. Visao geral
- Frontend em `Next.js` (App Router) com `React` e `TypeScript`.
- Rotas organizadas em grupos:
  - `src/app/(public)` para autenticacao/acesso publico.
  - `src/app/(private)` para telas autenticadas.
- Comunicacao com backend via `Axios` centralizado em `src/services/api.ts`.
- Foco forte em operacao de auditoria e consolidacao de dados em relatorios exportaveis.

## 2. Stack tecnica
- Framework: `Next.js 15`
- UI: `React 19`, `Tailwind CSS`, `Radix UI`, `shadcn/ui`
- Estado de servidor: `@tanstack/react-query`
- HTTP: `axios`
- Formularios: `react-hook-form`, `zod`
- Graficos: `recharts`
- Exportacao: `exceljs`, `xlsx`, `jspdf`, `jspdf-autotable`, `html-to-image`, `html2canvas`
- Utilitarios: `date-fns`, `lucide-react`, `sonner`

## 3. Estrutura do projeto
```text
auditrack-hub/
|- src/
|  |- app/
|  |  |- (public)/
|  |  |- (private)/
|  |  |  |- auditorias/
|  |  |  |- dashboard/
|  |  |  |- lojas/
|  |  |  |- usuarios/
|  |  |  |- relatorios/
|  |  |  |  |- vendas/
|  |  |  |  |- fluxos/
|  |  |  |  |- perdas/
|  |  |  |  |- pausas/
|  |  |  |  |- avoperacional/
|  |  |  |  |- auditoria-loja/
|  |  |  |  |- components/ (reuso entre relatorios)
|  |- components/
|  |  |- ui/
|  |  |- common/
|  |  |- layouts/
|  |- contexts/
|  |- services/
|  |- types/
|- public/
|- scripts/
```

## 4. Modulos funcionais
### Cadastros e operacao
- Auditorias
- Lojas
- Categorias
- Genero
- Formas de pagamento
- Cadastro de questoes
- Cadastro de avaliacao operacional
- Motivos de perdas e pausas
- Usuarios

### Relatorios
- Relatorio de vendas
- Relatorio de fluxos
- Relatorio de perdas
- Relatorio de pausas
- Relatorio de avaliacao operacional
- Relatorio de auditoria por loja

## 5. Requisitos
- Node.js 18+ (recomendado 20+)
- npm 9+
- Backend disponivel (API `back-auditoria`)

## 6. Configuracao local
### 1) Instalar dependencias
```bash
npm install
```

### 2) Configurar variaveis de ambiente
Crie o arquivo `.env.local` na raiz:
```bash
NEXT_PUBLIC_API_BASE_URL=https://back-auditoria.onrender.com
```

### 3) Rodar em desenvolvimento
```bash
npm run dev
```

Aplicacao: `http://localhost:3000`

## 7. Scripts disponiveis
No `package.json`:
- `npm run dev`: sobe ambiente de desenvolvimento
- `npm run build`: gera build de producao
- `npm run start`: inicia build em producao
- `npm run lint`: executa eslint
- `npm run images:alpha`: processa imagens (`scripts/remove-white-bg.ts`)

## 8. Padroes de desenvolvimento
### Organizacao
- Componentes de interface base em `src/components/ui`.
- Componentes compartilhados de dominio em `src/app/(private)/.../components`.
- Servicos de API centralizados em `src/services/api.ts`.

### UI/UX
- Manter padrao de botoes e variacoes (`Button` do design system).
- Evitar criar estilos isolados quando ha componente padrao existente.
- Em relatorios, manter consistencia visual entre filtros, tabelas e exportacoes.

### Filtros de loja
- Em relatorios, usar combobox pesquisavel e ordenacao alfabetica.
- Componente padrao: `src/app/(private)/relatorios/components/LojaFilterCombobox.tsx`.

### Qualidade
- Rodar `npm run lint` antes de abrir PR.
- Evitar `any` quando houver tipo conhecido.
- Tratar erros de API com mensagens claras para o usuario.

## 9. Relatorios e exportacoes
- Os relatorios consolidam dados de API para tabelas e graficos.
- Exportacoes suportadas por modulo:
  - XLSX/XLS (dependendo do relatorio)
  - PDF
- No modulo `auditoria-loja`, existem exporters dedicados em:
  - `src/app/(private)/relatorios/auditoria-loja/components/_exporters/exportRelatorioAuditoriaXLSX.ts`
  - `src/app/(private)/relatorios/auditoria-loja/components/_exporters/exportRelatorioAuditoriaPDF.ts`

## 10. Integracao com backend
Arquivo principal: `src/services/api.ts`

### O que ja vem configurado
- `baseURL` via `NEXT_PUBLIC_API_BASE_URL`
- timeout padrao
- interceptor de request para token de autenticacao
- interceptor de response para tratamento de erros comuns

### APIs organizadas por entidade
Exemplos:
- `authAPI`
- `usuarioAPI`
- `lojaAPI`
- `auditoriaAPI`
- `vendaAPI`
- `relatorioAPI`
- `perdaAPI`, `pausaAPI`, etc.

## 11. Troubleshooting
### Erro de autenticacao (401)
- Verifique token salvo no navegador.
- Refaça login.

### Falha de conexao com API
- Confirme `.env.local` com `NEXT_PUBLIC_API_BASE_URL`.
- Confirme backend online.

### Erros de build/lint
```bash
npm run lint
npm run build
```

### Erro ao exportar relatorios
- Verifique se os dados obrigatorios dos filtros foram informados.
- Verifique console do navegador e logs da API.

## 12. Documentacao complementar
- [DOCUMENTACAO.md](./DOCUMENTACAO.md)
- [GUIA_DESENVOLVIMENTO.md](./GUIA_DESENVOLVIMENTO.md)
- [README_DOCUMENTACAO.md](./README_DOCUMENTACAO.md)
- [REFERENCIA_COMPONENTES.md](./REFERENCIA_COMPONENTES.md)
- [TREINAMENTO_AUDITRACK_HUB.md](./TREINAMENTO_AUDITRACK_HUB.md)

---
Ultima atualizacao: 2026-03-05

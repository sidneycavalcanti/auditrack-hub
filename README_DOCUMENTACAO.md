# 📚 Documentação - Auditrack Hub

> **Sistema web moderno de gerenciamento de auditorias empresariais desenvolvido em Next.js**

---

## 🗂️ Documentos Disponíveis

### 📖 [DOCUMENTACAO.md](./DOCUMENTACAO.md) - Documentação Principal

Documentação completa do projeto com visão geral e arquitetura.

**Seções:**
- ✅ Visão Geral do Projeto
- ✅ Arquitetura do Sistema
- ✅ Estrutura de Pastas
- ✅ Tecnologias Utilizadas
- ✅ Configuração e Instalação
- ✅ Componentes Principais (MainLayout, EmptyState, etc)
- ✅ Contextos de Autenticação
- ✅ Serviços e APIs
- ✅ Tipos e Interfaces
- ✅ Navegação e Rotas
- ✅ Boas Práticas de Segurança
- ✅ Troubleshooting

**Ideal para:** Entender a estrutura geral do projeto, como tudo está organizado e fluxos principais.

---

### 👨‍💻 [GUIA_DESENVOLVIMENTO.md](./GUIA_DESENVOLVIMENTO.md) - Guia Prático

Guia hands-on para desenvolvedores com exemplos práticos de código.

**Seções:**
- ✅ Roteiro de Configuração Inicial
- ✅ Convenções de Nomes e Estrutura
- ✅ Como Criar Novas Páginas
- ✅ Como Criar Novos Componentes
- ✅ Como Integrar com API
- ✅ Padrões de Código Recomendados
- ✅ Debugging e Testing
- ✅ Checklist de Qualidade
- ✅ Git Workflow
- ✅ Exemplos de Fluxos Completos

**Ideal para:** Desenvolvedores que querem começar a contribuir no projeto. Contém exemplos reais de código prontos para copiar e adaptar.

---

### 📚 [REFERENCIA_COMPONENTES.md](./REFERENCIA_COMPONENTES.md) - Referência Técnica

Referência completa de componentes, hooks e endpoints da API.

**Seções:**
- ✅ Componentes UI (Button, Input, Select, etc)
- ✅ Componentes Comuns (EmptyState, LoadingSpinner)
- ✅ Componentes de Layout
- ✅ Hooks Customizados (useAuth, use-mobile)
- ✅ Endpoints da API (Auth, Usuários, Lojas, Auditorias, Relatórios, etc)
- ✅ Tipos Globais (Interfaces de dados)
- ✅ Utilidades Tailwind

**Ideal para:** Referência rápida ao trabalhar no código. Use quando precisar saber como usar um componente específico ou qual é o endpoint certo.

---

## 🚀 Quick Start

### 1. Instalação

```bash
cd auditrack-hub
npm install
echo "NEXT_PUBLIC_API_BASE_URL=https://back-auditoria.onrender.com" > .env.local
npm run dev
```

Acesse: http://localhost:3000

### 2. Login

```
Usuário: sua_matricula
Senha: sua_senha
```

### 3. Explorar

- **Dashboard** → Visualizar resumo
- **Gestão de Auditorias** → Gerenciar dados
- **Relatórios** → Ver análises
- **Administração** → Gerenciar usuários

---

## 📋 Primeira Contribuição

Siga este roteiro para sua primeira contribuição:

### Passo 1: Setup do Projeto
Leia a seção "Roteiro de Configuração Inicial" em [GUIA_DESENVOLVIMENTO.md](./GUIA_DESENVOLVIMENTO.md)

### Passo 2: Escolher Tarefa
- Bugfix: encontre um bug em um componente existente
- Feature: implemente uma nova página listando dados da API
- Refactor: melhore um componente existente

### Passo 3: Desenvolver
Use [GUIA_DESENVOLVIMENTO.md](./GUIA_DESENVOLVIMENTO.md) como referência

### Passo 4: Testar
Consulte a seção "Checklist de Qualidade"

### Passo 5: Submit
Crie um pull request com sua mudança

---

## 🔍 Como Encontrar Informações

### "Como criar um novo componente?"
→ Leia [GUIA_DESENVOLVIMENTO.md - Como Criar Novos Componentes](./GUIA_DESENVOLVIMENTO.md#-como-criar-novos-componentes)

### "Qual é a URL do endpoint de auditorias?"
→ Procure em [REFERENCIA_COMPONENTES.md - Endpoints da API](./REFERENCIA_COMPONENTES.md#-endpoints-da-api)

### "Qual é a estrutura de pastas?"
→ Veja [DOCUMENTACAO.md - Estrutura de Pastas](./DOCUMENTACAO.md#-estrutura-de-pastas)

### "Como usar o componente Button?"
→ Consulte [REFERENCIA_COMPONENTES.md - Button](./REFERENCIA_COMPONENTES.md#button)

### "Qual arquivo criar para integrar com API?"
→ Siga o padrão em [GUIA_DESENVOLVIMENTO.md - Como Integrar com API](./GUIA_DESENVOLVIMENTO.md#-como-integrar-com-api)

### "O código não compila - o que fazer?"
→ Veja [DOCUMENTACAO.md - Troubleshooting](./DOCUMENTACAO.md#-troubleshooting)

---

## 🏗️ Arquitetura em 30 Segundos

```
┌─── Frontend (Next.js 15+) ─────────────────┐
│                                             │
│  Páginas (app/*)                          │
│      ↓                                      │
│  Componentes (components/*)               │
│      ↓                                      │
│  Contextos & Hooks (contexts/, hooks/)    │
│      ↓                                      │
│  Serviços API (services/api.ts)           │
│                                             │
└──────────────────────────────────────────── ┘
                    ↓ Axios
        ┌─── Backend (Node.js) ───┐
        │  back-auditoria          │
        │  (onrender.com)          │
        └──────────────────────────┘
```

---

## 📊 Stack Técnico

| Componente | Tecnologia |
|-----------|-----------|
| **Framework** | Next.js 15+ |
| **Linguagem** | TypeScript |
| **UI** | React 19+, Tailwind CSS |
| **Componentes** | shadcn/ui, Radix UI |
| **Ícones** | Lucide React |
| **HTTP** | Axios |
| **Estado** | Context API, React Query |
| **Formulários** | React Hook Form |
| **Notificações** | Sonner (Toast) |
| **Exportação** | ExcelJS, html2canvas |
| **Datas** | date-fns |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL/MySQL |

---

## 🎯 Funcionalidades Principais

### ✅ Gestão de Auditorias
- Criar, editar, deletar auditorias
- Associar auditorias a lojas
- Registrar scores de vendas, fluxo, pausa, perdas

### ✅ Relatórios
- Vendas
- Fluxos
- Perdas
- Pausas
- Avaliação Operacional
- Auditoria por Loja
- Exportar para Excel/PDF

### ✅ Administração
- Gerenciar usuários
- Categorias
- Lojas
- Formas de pagamento
- Questões
- Motivos de pausas/perdas

### ✅ Autenticação
- Login com usuário/senha
- Token-based auth
- Persistência em localStorage
- Proteção de rotas

---

## 🔐 Segurança

- ✅ Autenticação baseada em JWT tokens
- ✅ Requisições com token automático (interceptor)
- ✅ Redirecional para login em 401
- ✅ SSR-safe (verificação de `window`)
- ✅ TypeScript para type-safety
- ✅ ESLint para code quality

---

## 📱 Responsividade

- ✅ Mobile-first design
- ✅ Sidebar responsiva
- ✅ Tailwind CSS breakpoints
- ✅ Touch-friendly em mobile

---

## 🚀 Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor (localhost:3000)

# Build & Production
npm run build            # Cria build otimizado
npm start                # Roda servidor de produção

# Qualidade
npm run lint             # Verifica ESLint
npx tsc --noEmit        # Verifica TypeScript

# Utilitários
npm run images:alpha    # Remove background de imagens
```

---

## 📞 Contato e Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-repo/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-repo/discussions)
- **Email**: dev@exemple.com

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -am 'feat: Adicionar MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

Veja [GUIA_DESENVOLVIMENTO.md - Git Workflow](./GUIA_DESENVOLVIMENTO.md#-git-workflow) para detalhes.

---

## 📝 Changelog

### v0.1.0 (22/02/2026)
- ✨ Dashboard inicial
- ✨ Gestão de auditorias
- ✨ Relatórios
- ✨ Autenticação
- ✨ Administração de usuários

---

## 📖 Recursos Adicionais

### Documentação Oficial
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript](https://www.typescriptlang.org)

### Ferramentas Recomendadas
- [VS Code](https://code.visualstudio.com)
- [ES7+ React Snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [Prettier](https://prettier.io)
- [Thunder Client](https://www.thunderclient.com) (API testing)

---

## 💡 Dicas Úteis

1. **Sempre use TypeScript**: Defina tipos para tudo
2. **Componentes pequenos**: Cada componente = 1 responsabilidade
3. **Reutilização**: Se usa 2x, coloca em `common/`
4. **Testes**: Escreva testes para lógica crítica
5. **Performance**: Use `React.memo` para componentes custosos
6. **Acessibilidade**: Use atributos ARIA e labels

---

## ✅ Checklist Antes de Commitar

- [ ] TypeScript compila (`npm run build`)
- [ ] ESLint passa (`npm run lint`)
- [ ] Testado em mobile
- [ ] Sem console.log em produção
- [ ] Nomes de variáveis claros
- [ ] Componentes documentados
- [ ] SSR-safe quando necessário
- [ ] Tratamento de erros implementado

---

## 🎓 Próximos Passos

1. Leia [DOCUMENTACAO.md](./DOCUMENTACAO.md) para entender a arquitetura
2. Siga o [GUIA_DESENVOLVIMENTO.md](./GUIA_DESENVOLVIMENTO.md) para começar a contribuir
3. Use [REFERENCIA_COMPONENTES.md](./REFERENCIA_COMPONENTES.md) como referência rápida

---

**Versão da Documentação**: 1.0.0  
**Data de Atualização**: 22 de fevereiro de 2026  
**Status**: ✅ Completo

---

<div align="center">

### 🎉 Bem-vindo ao Auditrack Hub!

**Comece a contribuir agora →** [GUIA_DESENVOLVIMENTO.md](./GUIA_DESENVOLVIMENTO.md)

</div>

# Treinamento Interno - Auditrack Hub

## 1. Objetivo
Capacitar o time para manter e evoluir o sistema `auditrack-hub` com padrao unico de UI, filtros, relatorios e exportacoes.

## 2. Publico-alvo
- Desenvolvedores iniciantes e plenos no projeto.
- Pessoas que vao atuar em relatorios, filtros, componentes e integracoes de API.

## 3. Visao geral do projeto
- Stack principal: `Next.js` + `React` + `TypeScript`.
- Estrutura relevante:
  - `src/app/(private)/relatorios`: telas e componentes de relatorios.
  - `src/components/ui`: componentes base de interface.
  - `src/services`: camada de servicos e chamadas de API.
  - `scripts`: automacoes, inclusive exportacoes nativas.

## 4. Padrao de interface (obrigatorio)
- Botaoes devem seguir o padrao dos componentes de `@/components/ui/button`.
- Filtros de loja:
  - Devem usar componente pesquisavel.
  - Devem exibir lojas em ordem alfabetica (`pt-BR`).
  - Devem manter comportamento consistente de placeholder e estado "Todas".
- Evitar estilos isolados quando ja existe padrao no sistema.

## 5. Fluxo de relatorios
- Entradas:
  - Filtros (loja, mes, ano, periodo e outros por modulo).
- Processamento:
  - Dados vindos de hooks/API.
  - Transformacao para tabelas e graficos.
- Saidas:
  - Visualizacao na tela.
  - Exportacao em `PDF` e `XLSX`.

## 6. Relatorio de Auditoria (base de estudo)
Arquivos principais:
- `src/app/(private)/relatorios/auditoria-loja/components/RelatorioAuditoria.tsx`
- `src/app/(private)/relatorios/auditoria-loja/components/_exporters/exportRelatorioAuditoriaXLSX.ts`
- `src/app/(private)/relatorios/auditoria-loja/components/_exporters/exportRelatorioAuditoriaPDF.ts`

Pontos-chave:
- Tabelas e graficos compartilham a mesma fonte de dados (`data` e agregacoes locais).
- Exportacao deve preservar coerencia com o que o usuario ve na tela.
- Qualquer ajuste de formato deve manter padrao visual dos outros relatorios.

## 7. Padrao de filtros de loja (status atual)
Implementado com combobox pesquisavel reutilizavel:
- `src/app/(private)/relatorios/components/LojaFilterCombobox.tsx`

Regras:
- Ordenar alfabeticamente por `descricao/name`.
- Permitir busca incremental ("digita e filtra").
- Manter opcao de todas as lojas quando aplicavel.

## 8. Boas praticas para evolucao
- Reutilizar componentes antes de criar novos.
- Evitar duplicar regras de ordenacao/filtro.
- Sempre validar lint apos mudancas.
- Manter nomes e labels consistentes em todos os modulos.
- Em alteracoes de exportacao, validar arquivo final gerado.

## 9. Checklist de entrega
- [ ] UI segue padrao de botoes e filtros.
- [ ] Filtros de loja com busca e ordem alfabetica.
- [ ] Tabela e grafico com dados consistentes.
- [ ] Exportacao PDF/XLSX funcionando.
- [ ] Lint sem novos erros introduzidos.
- [ ] Ajuste documentado no PR/changelog interno.

## 10. Exercicio pratico sugerido
1. Escolher um relatorio.
2. Revisar filtros existentes.
3. Aplicar padrao de filtro pesquisavel de loja.
4. Validar exibicao, busca, ordenacao e exportacao.
5. Rodar lint e registrar evidencias.

## 11. Resultado esperado
Ao final do treinamento, o time deve conseguir:
- Criar/ajustar relatorios seguindo o padrao do projeto.
- Implementar filtros de loja consistentes.
- Manter exportacoes confiaveis.
- Evoluir o codigo com menor retrabalho.

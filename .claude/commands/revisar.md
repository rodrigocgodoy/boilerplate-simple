---
description: Revisa as mudanças pendentes (git diff) com o checklist do projeto
argument-hint: [arquivo ou pasta, opcional]
---

Revise as mudanças pendentes deste projeto usando o checklist oficial em @docs/checklist-revisao.md.

## Como revisar

1. Rode `git diff $ARGUMENTS` (e `git status`) para ver exatamente o que mudou. Se não houver nada no diff, revise as mudanças já preparadas com `git diff --cached $ARGUMENTS`.
2. Passe pelos **cinco eixos do checklist, na ordem**, um por um. Para cada eixo, responda: **OK**, **ATENÇÃO** ou **PROBLEMA**, com o arquivo e a linha.
3. Procure o que mudou **além** do que foi pedido, e arquivos tocados que não deveriam ter sido tocados (principalmente `packages/api-client/gen`, que é gerado).
4. Seja duro. Uma revisão que só elogia não serve para nada.

## Formato da resposta

- Uma seção por eixo, com o veredito e as evidências.
- No final, uma lista **"O que precisa mudar antes do commit"**, do mais grave para o menos grave.
- Não altere nenhum arquivo. Só revise.

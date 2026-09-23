# Checklist de revisão do projeto

Cinco eixos. Passe por todos, na ordem, antes de aprovar qualquer mudança — sua ou da IA.

## 1. Funciona?

- O que foi pedido está feito por completo, sem "parte 2 fica para depois"?
- O caminho feliz e pelo menos um caminho de erro foram pensados?
- Se mudou a API (rota, schema, resposta), o OpenAPI e o client foram regenerados? (`pnpm openapi && pnpm api-client`)

## 2. Está seguro?

- Rota nova checa a sessão do mesmo jeito que `modules/me/route.ts`?
- É uma funcionalidade que somente admin pode ver?
- É uma resposta que algum usuário com má intenção conseguiria fazer alguma coisa com outros usuários ou até mesmo mexer em outros lugares do software?
- Devolve só os campos que o cliente precisa? (e-mail, senha, token e id de terceiros não vazam)
- Nenhum segredo entrou no código ou no commit? (`.env`, chaves, connection string)

## 3. Está claro?

- Nomes dizem o que a coisa é, sem comentário para explicar?
- Um colega entende a mudança lendo só o diff?

## 4. Está no padrão?

- Segue `schemas.ts` → `service.ts` → `route.ts` dentro do módulo criado (se foi preciso criar um modulo novo modules/_/_.ts), registrado em `routes.ts` e `services.ts`?
- Imports com alias `@/` e extensão `.js`; formatação do Biome; nada em `packages/api-client/gen` ou em `packages/database/generated` editado na mão?
- Não instalou dependência nova sem motivo?

## 5. Está testado?

- `pnpm lint` e `pnpm typecheck` passam?
- O comportamento foi verificado (rodando, ou por leitura cuidadosa quando não dá para rodar)?

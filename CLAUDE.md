# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A full-stack course boilerplate (pt-BR codebase/docs). The core idea: the API
describes its routes with Zod, that becomes an OpenAPI spec, and Kubb
generates typed TanStack Query hooks from it — the frontend never hand-writes
`fetch` calls or request/response types.

```
Zod schema (apps/api)  →  OpenAPI (@fastify/swagger)  →  Kubb  →  TanStack Query hooks  →  apps/app
```

Stack: pnpm workspaces + Turborepo, Biome (lint/format), Fastify 5 +
`fastify-type-provider-zod` + Better Auth (`apps/api`), React + Vite +
TanStack Router/Query + Tailwind (`apps/app`), Prisma 7 with the `pg` driver
adapter against Postgres/Neon, no Docker (`packages/database`), Kubb-generated
client (`packages/api-client`), shared design system (`packages/ui`).

## Commands

```bash
pnpm setup          # git hooks + install + prisma generate + openapi + api-client (run once, and after pulling schema changes)
pnpm dev             # API (3333) + front (5173) via turbo, watch mode
pnpm build           # production build (turbo)
pnpm typecheck       # tsc --noEmit across the monorepo
pnpm lint            # biome check .
pnpm lint:fix        # biome check . --write
pnpm openapi         # regenerate apps/api/openapi.yaml
pnpm api-client      # regenerate packages/api-client/gen (Kubb) from openapi.yaml
pnpm db:migrate      # prisma migrate dev
pnpm db:deploy       # prisma migrate deploy
pnpm db:studio       # Prisma Studio
pnpm db:reset        # prisma migrate reset --force
pnpm auth:generate   # derive schema.prisma from the Better Auth config
```

**Whenever a route/schema/response changes, regenerate the client:**
`pnpm openapi && pnpm api-client` (or `pnpm --filter @repo/api-client dev` to
watch). There is no per-file test runner in this repo — verification is
`pnpm lint` + `pnpm typecheck` + manually exercising the route/UI.

A pre-commit hook (`.githooks/pre-commit`, wired via
`git config core.hooksPath .githooks`, which `pnpm setup` does automatically)
blocks any commit where `pnpm lint` or `pnpm typecheck` fails, or where a
`.env*` file (other than `.env.example`) is staged. It does **not** check
whether generated files were hand-edited — that's caught in review (see
"Review checklist" below), not enforced by tooling.

## Architecture

### API module pattern (`apps/api/src/modules/<name>/`)

The standard shape, shown by `modules/me/`:

- `schemas.ts` — Zod schemas; the single source of truth for both runtime
  validation and the generated client types.
- `service.ts` — a `<Name>Service` class; talks to Prisma, holds business
  logic. No Fastify/HTTP concerns here.
- `route.ts` — wraps a plugin with `tp()` (see `utils/fastify.ts`), declares
  the Fastify route with a `schema` (`tags`, `response` keyed by status code),
  checks the session, calls the service, and shapes the reply. Routes only
  orchestrate — they don't contain the rule.

New modules must be registered in **both** `apps/api/src/routes.ts` (the
route plugin) and, if they add a service, `apps/api/src/services.ts` (which
decorates `app.services` and is what gives routes typed access to
`scope.services.<name>`).

`modules/users/route.ts` is a deliberate exception (inline schema + Prisma
call, no `service.ts`) — don't treat it as the pattern to copy; `modules/me/`
is.

Auth check inside a protected route:

```ts
const session = await scope.services.auth.auth.api.getSession({
  headers: toHeaders(request),
})
if (!session?.user) return reply.status(401).send({ error: 'Não autenticado' })
```

`tp()` (`apps/api/src/utils/fastify.ts`) wraps `fastify-plugin` with the
`ZodTypeProvider` types so `scope.get/post/...` infers request/response types
from the Zod schemas — always wrap new route/service plugins with it instead
of a bare Fastify plugin.

### Request flow

`apps/api/src/index.ts` boots Fastify and registers `backendPlugin`
(`apps/api/src/plugin.ts`), which: sets the Zod validator/serializer, registers
`@fastify/swagger` (dynamic mode — the OpenAPI doc is built from the route
schemas) and, in development only, Scalar docs at `/reference` plus a hook
that writes `apps/api/openapi.yaml` on every boot. Then it registers cookies,
CORS (credentialed, restricted to `env.APP_URL`), `servicePlugin`, and
`routesPlugin`.

Better Auth is mounted by hand at `/api/auth/*`
(`modules/better-auth/route.ts`) by bridging Fastify's request into a
standard `Request`/`Response` and calling `auth.handler`. Those routes are
`hide: true` in the OpenAPI schema — the frontend talks to them through the
Better Auth client, not the generated hooks. `modules/better-auth/configs.ts`
is where Better Auth is configured (plugins, model names, trusted origins);
after editing it, run `pnpm auth:generate` (regenerates
`packages/database/prisma/schema.prisma` from the Better Auth config, not the
other way around) then `pnpm db:migrate`.

### Environment

`apps/api/src/utils/environment.ts` loads and Zod-validates env vars from the
**monorepo root** `.env` (not `apps/api/.env`) — `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL`, `PORT`, `ENV`.
`packages/database/src/client.ts` also falls back to loading the root `.env`
when `DATABASE_URL` isn't already in the environment (for CLI/migration
contexts). There is a single `.env` for the whole monorepo; see
`.env.example`.

### Generated code — never hand-edit

- `packages/api-client/gen/` — Kubb output (`models/`, `hooks/` grouped by
  OpenAPI tag). Regenerate with `pnpm api-client`.
- `packages/database/generated/` — Prisma client. Regenerate with
  `pnpm db:generate`.
- `apps/api/openapi.yaml` — written by the dev server on boot / by
  `pnpm openapi`.

There is no tooling that blocks edits to these paths — treat this as a hard
rule enforced by code review (checklist axis 4, below), not by a hook. If you
need different generated output, change the Zod schema/route or the Kubb
config and regenerate; never patch the generated files directly.

### Frontend (`apps/app`)

- `src/router.tsx` — TanStack Router routes with `beforeLoad` guards that call
  `authClient.getSession()` to redirect authed users away from
  `/login`/`/register` and unauthed users away from `/`.
- `src/lib/auth-client.ts` — Better Auth React client, pointed at
  `VITE_API_URL`.
- `main.tsx` calls `setupApiClient(VITE_API_URL)`
  (`packages/api-client/src/setup.ts`) before rendering, which points the
  Kubb-generated hooks' shared axios instance at the API and sets
  `withCredentials: true` so the Better Auth session cookie is sent.
- Generated hooks are imported per-tag, e.g.
  `import { useGetMe } from '@repo/api-client/hooks'`.
- `packages/ui` exports raw components (`Button`, `Input`, `Label`, `Card*`)
  plus a Tailwind preset (`@repo/ui/tailwind-preset`) consumed by
  `apps/app/tailwind.config.ts`.

### Imports and module resolution

- API code uses the `@/` alias for `apps/api/src` and **must** include the
  `.js` extension on relative/alias imports (ESM + `isolatedModules`), e.g.
  `import { tp } from '@/utils/fastify.js'`.
- Prisma is consumed as `import { prisma } from '@repo/database'`, never by
  importing `packages/database/generated/` directly.

## Review checklist

`docs/checklist-revisao.md` (also runnable as the `/revisar` slash command)
is the project's standing review checklist — five axes, in order: it works
end-to-end (client regenerated if the API changed), it's secure (session
checked like `modules/me/route.ts`, no over-fetching of fields, no secrets
committed), it's readable, it follows the module pattern and import
conventions above — including that nothing in `packages/api-client/gen` or
`packages/database/generated` was hand-edited, and `pnpm lint`/`pnpm typecheck`
pass. Apply the same bar before calling a change done.

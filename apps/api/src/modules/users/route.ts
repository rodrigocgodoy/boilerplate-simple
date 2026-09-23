import { prisma } from '@repo/database'
import { z } from 'zod'
import { toHeaders } from '@/utils/auth.js'
import { tp } from '@/utils/fastify.js'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

const usersResponseSchema = z.array(userSchema)

const usersErrorSchema = z.object({
  error: z.string(),
})

/**
 * GET /users — lista id, name e email de todos os usuários.
 * Fora do padrão schemas/service/route de `modules/me` por pedido explícito:
 * tudo (schema + acesso ao Prisma) fica inline aqui.
 * Exige apenas sessão autenticada — não há conceito de admin/role no boilerplate ainda.
 */
export const usersRoute = tp(async (scope) => {
  scope.get(
    '/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'Lista todos os usuários',
        response: {
          200: usersResponseSchema,
          401: usersErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const session = await scope.services.auth.auth.api.getSession({
        headers: toHeaders(request),
      })

      if (!session?.user) {
        return reply.status(401).send({ error: 'Não autenticado' })
      }

      const users = await prisma.users.findMany({
        select: { id: true, name: true, email: true },
      })

      return reply.status(200).send(users)
    },
  )
})

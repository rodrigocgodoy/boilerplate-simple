import { z } from 'zod'

/** Resposta 200 de GET /me — vira o tipo `GetMe200` gerado pelo Kubb. */
export const meResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string(),
  updatedAt: z.string(),
})

/** Resposta de erro (401). */
export const meErrorSchema = z.object({
  error: z.string(),
})

export type Me = z.infer<typeof meResponseSchema>

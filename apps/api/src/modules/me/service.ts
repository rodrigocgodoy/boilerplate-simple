import { prisma } from '@repo/database'
import type { Me } from './schemas.js'

/**
 * Camada de serviço do módulo `me`: fala com o banco (Prisma) e devolve o
 * shape público do usuário. Separar `service` da `route` é o padrão que o
 * curso ensina — a rota só orquestra (auth + resposta), a regra fica aqui.
 */
export class MeService {
  async getProfile(userId: string): Promise<Me | null> {
    const user = await prisma.users.findUnique({ where: { id: userId } })
    if (!user) return null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      ...(user.image ? { image: user.image } : {}),
      updatedAt: user.updatedAt.toISOString(),
    }
  }
}

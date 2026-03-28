import { prisma } from './prisma'

/**
 * Check if a user has free account status.
 * Used by subscribe routes to bypass MercadoPago payment.
 */
export async function isUserFreeAccount(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFreeAccount: true },
  })
  return user?.isFreeAccount === true
}

import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TurnosBookingClient from './TurnosBookingClient'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sub = await prisma.turnosSubscription.findUnique({ where: { slug } })
  if (!sub || sub.status !== 'active') return { title: 'Pagina no encontrada' }
  return {
    title: `Turnos — ${sub.businessName}`,
    description: `Reserva tu turno online en ${sub.businessName}. Facil, rapido y sin necesidad de llamar.`,
    openGraph: {
      title: `Turnos — ${sub.businessName}`,
      description: `Reserva tu turno online en ${sub.businessName}.`,
    },
  }
}

export default async function TurnosPublicPage({ params }: Props) {
  const { slug } = await params
  const sub = await prisma.turnosSubscription.findUnique({ where: { slug } })
  if (!sub || sub.status !== 'active') notFound()

  const config = {
    slug: sub.slug,
    businessName: sub.businessName,
    businessType: sub.businessType,
    colorPrimary: sub.colorPrimary,
    colorAccent: sub.colorAccent,
    practiceAreas: JSON.parse(sub.practiceAreas || '[]') as string[],
    scheduleDays: JSON.parse(sub.scheduleDays || '[]') as number[],
    slotDuration: sub.slotDuration,
    phone: sub.phone,
    address: sub.address,
    logoUrl: sub.logoUrl,
  }

  return <TurnosBookingClient config={config} />
}

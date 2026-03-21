import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import * as XLSX from 'xlsx'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Fetch all users with their subscriptions and coupon data
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      createdAt: true,
      monitoringSubscriptions: {
        select: {
          id: true,
          status: true,
          plan: true,
          portal: true,
          cuil: true,
          notificationEmail: true,
          payerEmail: true,
          discountApplied: true,
          preapprovalId: true,
          n8nTenantId: true,
          provisionedAt: true,
          createdAt: true,
          coupon: {
            select: { code: true, discount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch all coupons for summary sheet
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // --- Sheet 1: Usuarios ---
  const usersData = users.map((u) => ({
    ID: u.id,
    Nombre: u.name ?? '',
    Email: u.email,
    Plan: u.plan,
    'Fecha Registro': u.createdAt.toISOString().slice(0, 10),
    'Suscripciones Activas': u.monitoringSubscriptions.filter((s) => s.status === 'active').length,
    'Suscripciones Total': u.monitoringSubscriptions.length,
  }))

  // --- Sheet 2: Suscripciones ---
  const subsData = users.flatMap((u) =>
    u.monitoringSubscriptions.map((s) => ({
      'Usuario': u.name ?? u.email,
      'Email Usuario': u.email,
      'ID Suscripcion': s.id,
      'Estado': s.status,
      'Plan': s.plan,
      'Portal': s.portal,
      'CUIT': s.cuil,
      'Email Notificaciones': s.notificationEmail,
      'Email Facturacion': s.payerEmail,
      'Cupon Usado': s.coupon?.code ?? '-',
      'Descuento (%)': s.discountApplied,
      'Preapproval MP': s.preapprovalId ?? '-',
      'Tenant n8n': s.n8nTenantId ?? '-',
      'Provisionado': s.provisionedAt ? s.provisionedAt.toISOString().slice(0, 10) : '-',
      'Fecha Creacion': s.createdAt.toISOString().slice(0, 10),
    }))
  )

  // --- Sheet 3: Cupones ---
  const couponsData = coupons.map((c) => ({
    Codigo: c.code,
    'Descuento (%)': c.discount,
    'Usos Maximos': c.maxUses,
    'Usos Actuales': c.usedCount,
    Activo: c.active ? 'Si' : 'No',
    'Valido Desde': c.validFrom.toISOString().slice(0, 10),
    'Valido Hasta': c.validUntil.toISOString().slice(0, 10),
    'Creado': c.createdAt.toISOString().slice(0, 10),
  }))

  // Build workbook
  const wb = XLSX.utils.book_new()

  const wsUsers = XLSX.utils.json_to_sheet(usersData.length ? usersData : [{ Info: 'Sin usuarios registrados' }])
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Usuarios')

  const wsSubs = XLSX.utils.json_to_sheet(subsData.length ? subsData : [{ Info: 'Sin suscripciones' }])
  XLSX.utils.book_append_sheet(wb, wsSubs, 'Suscripciones')

  const wsCoupons = XLSX.utils.json_to_sheet(couponsData.length ? couponsData : [{ Info: 'Sin cupones' }])
  XLSX.utils.book_append_sheet(wb, wsCoupons, 'Cupones')

  // Set column widths
  const setWidths = (ws: XLSX.WorkSheet, widths: number[]) => {
    ws['!cols'] = widths.map((w) => ({ wch: w }))
  }
  setWidths(wsUsers, [28, 25, 30, 10, 14, 20, 18])
  setWidths(wsSubs, [25, 30, 28, 16, 14, 10, 14, 30, 30, 14, 12, 20, 20, 14, 14])
  setWidths(wsCoupons, [16, 12, 14, 14, 8, 14, 14, 14])

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="automaticia-usuarios-${date}.xlsx"`,
    },
  })
}

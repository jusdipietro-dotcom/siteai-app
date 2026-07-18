import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Only identifiers are read from the URL. The subscription status is always
  // resolved against the MercadoPago API — never taken from query params, which
  // the user fully controls.
  const preapprovalId = req.nextUrl.searchParams.get('preapproval_id')
  const paymentId = req.nextUrl.searchParams.get('payment_id')

  // ── Caso 1: retorno desde preapproval (suscripción real) ──────────────────
  if (preapprovalId) {
    try {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[MP] check-preapproval error:', data)
        return NextResponse.json({ error: 'Error consultando suscripción' }, { status: res.status })
      }

      return NextResponse.json({
        status: data.status === 'authorized' ? 'authorized' : data.status,
        external_reference: data.external_reference, // formato: "projectId:plan"
        preapproval_id: data.id,
      })
    } catch (err) {
      console.error('[MP] check-preapproval exception:', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  }

  // ── Caso 2: retorno con payment_id (Checkout Pro legacy) ──────────────────
  if (paymentId) {
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[MP] check-payment error:', data)
        return NextResponse.json({ error: 'Error consultando pago' }, { status: res.status })
      }

      return NextResponse.json({
        status: data.status === 'approved' ? 'authorized' : data.status,
        external_reference: data.external_reference,
        payment_id: data.id,
      })
    } catch (err) {
      console.error('[MP] check-payment exception:', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 })
}

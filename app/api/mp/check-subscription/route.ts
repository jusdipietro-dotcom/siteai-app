import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function GET(req: NextRequest) {
  const preapprovalId = req.nextUrl.searchParams.get('preapproval_id')
  const paymentId = req.nextUrl.searchParams.get('payment_id')
  const status = req.nextUrl.searchParams.get('status')
  const externalReference = req.nextUrl.searchParams.get('external_reference')

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

  // ── Caso 2: retorno con external_reference + status en URL (fallback) ──────
  if (status && externalReference) {
    return NextResponse.json({
      status: status === 'approved' ? 'authorized' : status,
      external_reference: externalReference,
      payment_id: paymentId,
    })
  }

  // ── Caso 3: retorno con payment_id (Checkout Pro legacy) ──────────────────
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

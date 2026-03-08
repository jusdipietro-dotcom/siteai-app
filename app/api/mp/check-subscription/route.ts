import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('payment_id')
  const status = req.nextUrl.searchParams.get('status')
  const externalReference = req.nextUrl.searchParams.get('external_reference')

  // Si MP devuelve status=approved directamente en la URL, lo usamos sin llamar a la API
  if (status && externalReference) {
    return NextResponse.json({
      status: status === 'approved' ? 'authorized' : status,
      external_reference: externalReference,
      payment_id: paymentId,
    })
  }

  // Si tenemos payment_id, verificamos con la API de pagos
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

      // status_detail posibles: 'accredited', 'pending_waiting_payment', etc.
      const approved = data.status === 'approved'
      return NextResponse.json({
        status: approved ? 'authorized' : data.status,
        external_reference: data.external_reference, // formato: "projectId:plan"
        payment_id: data.id,
      })
    } catch (err) {
      console.error('[MP] check-payment exception:', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 })
}

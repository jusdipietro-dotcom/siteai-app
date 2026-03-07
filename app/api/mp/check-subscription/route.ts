import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing preapproval id' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[MP] check-subscription error:', data)
      return NextResponse.json({ error: 'Error consultando MP' }, { status: res.status })
    }

    // Posibles valores de status: 'authorized' | 'paused' | 'cancelled' | 'pending'
    return NextResponse.json({
      status: data.status,
      external_reference: data.external_reference, // formato: "projectId:plan"
      preapproval_id: data.id,
    })
  } catch (err) {
    console.error('[MP] check-subscription exception:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

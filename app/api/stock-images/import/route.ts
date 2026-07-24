import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateId } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { parseStockImageUrl } from '@/lib/stock-images'

/*
  Import a stock photo into the owner's own media library.

  We copy the file instead of linking to it. A published site that hotlinks a
  third party would break the day that host changes anything, and the owner is
  paying for a site that keeps working. Once imported it lives in our uploads
  volume like any upload, and the rest of the app treats it identically.

  Downloading server-side is also what makes this possible at all: the CSP's
  `connect-src` does not include Pexels, so the browser could not fetch the file
  to re-upload it.
*/

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB — same ceiling as /api/media

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let rawUrl = ''
  let photographer = ''
  let category = 'misc'
  try {
    const body = await req.json()
    rawUrl = String(body?.url ?? '')
    photographer = String(body?.photographer ?? '').slice(0, 80)
    if (typeof body?.category === 'string' && /^[a-z]+$/.test(body.category)) {
      category = body.category
    }
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Guarded in lib/stock-images.ts — see the SSRF note there before relaxing it.
  const parsed = parseStockImageUrl(rawUrl)
  if (!parsed) {
    return NextResponse.json({ error: 'Origen de imagen no permitido' }, { status: 400 })
  }

  try {
    const res = await fetch(parsed.toString(), { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) {
      return NextResponse.json({ error: 'No se pudo descargar la imagen' }, { status: 502 })
    }

    const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    const ext = EXT_BY_TYPE[contentType]
    if (!ext) {
      return NextResponse.json({ error: 'El archivo no es una imagen válida' }, { status: 400 })
    }

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0) {
      return NextResponse.json({ error: 'La imagen llegó vacía' }, { status: 502 })
    }
    if (buf.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen supera los 5 MB' }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })
    const filename = `${generateId()}.${ext}`
    await writeFile(join(UPLOAD_DIR, filename), buf)

    const url = `/api/uploads/${filename}`
    // Credit rides along in the name. The Pexels license does not require
    // attribution, but keeping the author on the record costs nothing and the
    // owner can see where the photo came from.
    const media = await prisma.media.create({
      data: {
        userId: session.user.id,
        name: photographer ? `Pexels — ${photographer}` : 'Banco de imágenes',
        url,
        thumbnailUrl: url,
        size: buf.byteLength,
        category,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (err) {
    console.error('[stock-images import]', err)
    return NextResponse.json({ error: 'No se pudo importar la imagen' }, { status: 502 })
  }
}

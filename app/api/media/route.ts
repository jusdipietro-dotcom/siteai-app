import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateId } from '@/lib/utils'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera los 5 MB' }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${generateId()}.${ext}`
    const bytes = await file.arrayBuffer()
    await writeFile(join(UPLOAD_DIR, filename), Buffer.from(bytes))

    const url = `/uploads/${filename}`
    return NextResponse.json({ url, filename }, { status: 201 })
  } catch (err) {
    console.error('[media upload]', err)
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}

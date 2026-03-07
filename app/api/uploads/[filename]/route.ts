import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params

  // Prevenir path traversal
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return new NextResponse(null, { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', 'uploads', filename)

  if (!existsSync(filePath)) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const buffer = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
    const contentType = MIME[ext] ?? 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}

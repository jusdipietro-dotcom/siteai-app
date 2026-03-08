import { NextRequest, NextResponse } from 'next/server'

// Proxy for Pollinations.ai — avoids browser-side CORS/CSP restrictions
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt')
  const seed = req.nextUrl.searchParams.get('seed') ?? '0'
  const w = req.nextUrl.searchParams.get('w') ?? '1280'
  const h = req.nextUrl.searchParams.get('h') ?? '720'

  if (!prompt) return new NextResponse(null, { status: 400 })

  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}&private=false`

  const MAX_RETRIES = 4
  let lastError = ''

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Variar seed en cada reintento para evitar combinaciones (prompt, seed) que Pollinations rechaza
    const currentSeed = parseInt(seed) + (attempt - 1) * 1000
    const urlForAttempt =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${w}&height=${h}&nologo=true&model=flux&seed=${currentSeed}&private=false`

    try {
      const res = await fetch(urlForAttempt, {
        signal: AbortSignal.timeout(60_000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (!res.ok) {
        lastError = `Pollinations HTTP ${res.status}`
        console.warn(`[ai-image] attempt ${attempt} — ${lastError}`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }

      const contentType = res.headers.get('Content-Type') ?? ''
      if (!contentType.startsWith('image/')) {
        lastError = `Non-image content-type: ${contentType}`
        console.warn(`[ai-image] attempt ${attempt} — ${lastError}`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }

      const buffer = await res.arrayBuffer()
      if (buffer.byteLength === 0) {
        lastError = 'Empty body'
        console.warn(`[ai-image] attempt ${attempt} — ${lastError}`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }

      console.log(`[ai-image] OK on attempt ${attempt}`)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      })
    } catch (err) {
      lastError = String(err)
      console.warn(`[ai-image] attempt ${attempt} — fetch error:`, err)
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  console.error('[ai-image] All retries failed:', lastError)
  return new NextResponse(null, { status: 502 })
}

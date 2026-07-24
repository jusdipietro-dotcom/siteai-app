import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateId } from '@/lib/utils'
import { generateSiteContent } from '@/lib/ai-site-generator'
import { contentForBusinessType, type TemplateContent } from '@/data/templateContent'
import { businessTypes } from '@/data/mockBusinessTypes'

// The cascade can take a while (several providers, 30s timeout each in the worst
// case), so opt out of caching and give the route room to run.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/*
  "Generá mi sitio con IA" — the HTTP half.

  Takes { name, businessType (rubro id), description } and returns site content
  ready for the wizard to drop into its form. It ALWAYS returns usable content:
  the AI cascade first, and the per-rubro starter set (data/templateContent.ts)
  when no provider is configured or all of them fail. `source` tells the client
  which one it got, so the UI can be honest about it.

  Ids are assigned here, never asked of the model — the model only writes copy.
*/

type Loose = {
  tagline: string
  description: string
  services: { name: string; description: string; emoji?: string }[]
  testimonials: { author: string; role?: string; content: string; rating: number }[]
  faqs: { question: string; answer: string }[]
  stats: { number: string; label: string }[]
}

function withIds(c: Loose | TemplateContent) {
  return {
    tagline: c.tagline,
    description: c.description,
    services: c.services.map((s) => ({
      id: generateId(),
      name: s.name,
      description: s.description,
      emoji: s.emoji ?? '',
      price: '',
    })),
    testimonials: c.testimonials.map((t) => ({
      id: generateId(),
      author: t.author,
      role: t.role ?? '',
      content: t.content,
      rating: t.rating,
    })),
    faqs: c.faqs.map((f) => ({ id: generateId(), question: f.question, answer: f.answer })),
    stats: c.stats.map((s) => ({ id: generateId(), number: s.number, label: s.label })),
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let name = ''
  let businessTypeId = ''
  let description = ''
  try {
    const body = await req.json()
    name = String(body?.name ?? '').slice(0, 120)
    businessTypeId = String(body?.businessType ?? '').slice(0, 40)
    description = String(body?.description ?? '').slice(0, 600)
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (!name.trim()) {
    return NextResponse.json({ error: 'Necesito al menos el nombre del negocio' }, { status: 400 })
  }

  // id → human label for the prompt; the id is what the fallback needs.
  const rubro = businessTypes.find((b) => b.id === businessTypeId)
  const label = rubro?.name ?? businessTypeId

  const result = await generateSiteContent({ name, businessType: label, description })
  if (result) {
    return NextResponse.json({ source: 'ai', provider: result.provider, content: withIds(result.content) })
  }

  // No provider available or all failed — never leave the user empty-handed.
  return NextResponse.json({ source: 'starter', content: withIds(contentForBusinessType(businessTypeId)) })
}

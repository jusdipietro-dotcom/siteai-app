import { describe, it, expect } from 'vitest'
import {
  GeneratedContentSchema,
  extractJson,
  buildPrompt,
  activeProviders,
} from '@/lib/ai-site-generator'

const goodContent = {
  tagline: 'Sabores que se disfrutan',
  description: 'Cocina fresca hecha con pasión, para compartir buenos momentos.',
  services: [
    { name: 'Menú del día', description: 'Platos frescos que cambian a diario.', emoji: '🍽️' },
    { name: 'Delivery', description: 'Llevá nuestra cocina a tu casa.', emoji: '🛵' },
  ],
  testimonials: [{ author: 'Lucía P.', role: 'Comensal', content: 'Riquísimo todo.', rating: 5 }],
  faqs: [
    { question: '¿Hacen reservas?', answer: 'Sí, por WhatsApp.' },
    { question: '¿Tienen delivery?', answer: 'Sí, en la zona.' },
  ],
  stats: [
    { number: '+50', label: 'Platos en carta' },
    { number: '4.8★', label: 'En reseñas' },
  ],
}

describe('extractJson — tolerates how models actually reply', () => {
  it('parses a clean JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 })
  })

  it('parses JSON wrapped in a ```json fence', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('parses JSON with a stray sentence around it', () => {
    expect(extractJson('Claro, acá tenés:\n{"a":1}\nEspero que sirva.')).toEqual({ a: 1 })
  })

  it('returns null for prose with no object', () => {
    expect(extractJson('No puedo ayudarte con eso.')).toBeNull()
  })

  it('returns null for empty/garbage', () => {
    expect(extractJson('')).toBeNull()
    expect(extractJson('{ not json')).toBeNull()
  })
})

describe('GeneratedContentSchema', () => {
  it('accepts well-formed content', () => {
    expect(GeneratedContentSchema.safeParse(goodContent).success).toBe(true)
  })

  it('rejects content with too few services', () => {
    const bad = { ...goodContent, services: [goodContent.services[0]] }
    expect(GeneratedContentSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects empty required strings', () => {
    const bad = { ...goodContent, tagline: '   ' }
    expect(GeneratedContentSchema.safeParse(bad).success).toBe(false)
  })

  it('coerces a string rating and clamps a wild one to 5', () => {
    const parsed = GeneratedContentSchema.safeParse({
      ...goodContent,
      testimonials: [
        { author: 'A', content: 'ok', rating: '5' },
        { author: 'B', content: 'ok', rating: 99 },
      ],
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.testimonials[0].rating).toBe(5)
      expect(parsed.data.testimonials[1].rating).toBe(5)
      // role is optional and defaults to empty string
      expect(parsed.data.testimonials[0].role).toBe('')
    }
  })

  it('tolerates an unparseable rating by defaulting to 5 instead of dropping the copy', () => {
    // Deliberate: a garbage rating should not throw away an otherwise good site.
    // These testimonials are always 5★ anyway, so we coerce rather than reject.
    const parsed = GeneratedContentSchema.safeParse({
      ...goodContent,
      testimonials: [{ author: 'A', content: 'ok', rating: 'cinco' }],
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.testimonials[0].rating).toBe(5)
  })
})

describe('buildPrompt', () => {
  it('includes the name, rubro and the owner sentence', () => {
    const p = buildPrompt({ name: 'La Romana', businessType: 'Restaurante', description: 'pizzería a la piedra' })
    expect(p).toContain('La Romana')
    expect(p).toContain('Restaurante')
    expect(p).toContain('pizzería a la piedra')
  })

  it('handles a missing description without breaking', () => {
    const p = buildPrompt({ name: 'La Romana', businessType: 'Restaurante' })
    expect(p).toContain('La Romana')
    expect(p).toContain('no dio más detalles')
  })
})

describe('activeProviders — free first, paid (Claude) last', () => {
  it('is empty when no key is configured', () => {
    expect(activeProviders({} as NodeJS.ProcessEnv)).toEqual([])
  })

  it('includes only providers whose key is set', () => {
    const only = activeProviders({ GROQ_API_KEY: 'x' } as unknown as NodeJS.ProcessEnv)
    expect(only.map((p) => p.name)).toEqual(['groq'])
  })

  it('orders free models before the paid one', () => {
    const all = activeProviders({
      ANTHROPIC_API_KEY: 'x',
      GEMINI_API_KEY: 'x',
      CEREBRAS_API_KEY: 'x',
      GROQ_API_KEY: 'x',
    } as unknown as NodeJS.ProcessEnv)
    expect(all.map((p) => p.name)).toEqual(['groq', 'cerebras', 'gemini', 'claude'])
    // Claude is the only paid one, and it is last.
    expect(all.filter((p) => p.paid).map((p) => p.name)).toEqual(['claude'])
    expect(all[all.length - 1].name).toBe('claude')
  })

  it('keeps free providers usable even without the paid fallback', () => {
    const free = activeProviders({
      GROQ_API_KEY: 'x',
      CEREBRAS_API_KEY: 'x',
    } as unknown as NodeJS.ProcessEnv)
    expect(free.map((p) => p.name)).toEqual(['groq', 'cerebras'])
    expect(free.some((p) => p.paid)).toBe(false)
  })
})

import { z } from 'zod'

/*
  "Generá mi sitio con IA" — the model half.

  Turns a name + rubro + a sentence about the business into the site's copy:
  tagline, about, services, testimonials, FAQ and stats. The output has the same
  shape as the per-rubro starter content (data/templateContent.ts), so the caller
  treats an AI result and a starter set identically — and the starter set is the
  final fallback when every provider fails.

  Cascade: free models first (Groq → Cerebras → Gemini), a paid model last
  (Claude). Each provider is skipped when its key is absent, so the feature
  degrades from "best available" down to "starter content" without ever erroring
  at the user. No LLM SDK: Groq and Cerebras speak the OpenAI chat API, Gemini
  and Claude each get a small fetch wrapper.
*/

export const GeneratedContentSchema = z.object({
  tagline: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(700),
  services: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        description: z.string().trim().min(1).max(240),
        emoji: z.string().trim().max(8).optional(),
      })
    )
    .min(2)
    .max(6),
  testimonials: z
    .array(
      z.object({
        author: z.string().trim().min(1).max(60),
        role: z.string().trim().max(60).optional().default(''),
        content: z.string().trim().min(1).max(340),
        rating: z.coerce.number().int().min(1).max(5).catch(5),
      })
    )
    .min(1)
    .max(4),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(160),
        answer: z.string().trim().min(1).max(420),
      })
    )
    .min(2)
    .max(6),
  stats: z
    .array(
      z.object({
        number: z.string().trim().min(1).max(16),
        label: z.string().trim().min(1).max(40),
      })
    )
    .min(2)
    .max(4),
})

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>

export interface GenerateSiteInput {
  name: string
  /** Human-readable rubro label, e.g. "Restaurante". */
  businessType?: string
  /** The owner's own sentence about the business. May be empty. */
  description?: string
}

// ── Prompt ───────────────────────────────────────────────────────────────────

const SHAPE_EXAMPLE = JSON.stringify(
  {
    tagline: 'string',
    description: 'string',
    services: [{ name: 'string', description: 'string', emoji: 'string' }],
    testimonials: [{ author: 'string', role: 'string', content: 'string', rating: 5 }],
    faqs: [{ question: 'string', answer: 'string' }],
    stats: [{ number: 'string', label: 'string' }],
  },
  null,
  0
)

export function buildPrompt(input: GenerateSiteInput): string {
  const name = input.name?.trim() || 'el negocio'
  const rubro = input.businessType?.trim() || 'negocio general'
  const detail = input.description?.trim()

  return [
    'Sos un copywriter experto en sitios web para pymes de Argentina.',
    'Generá el contenido de un sitio web para este negocio.',
    '',
    `Nombre del negocio: ${name}`,
    `Rubro: ${rubro}`,
    detail ? `Lo que cuenta el dueño: ${detail}` : 'El dueño no dio más detalles: inferí lo típico del rubro.',
    '',
    'Devolvé ÚNICAMENTE un objeto JSON válido (sin markdown, sin texto antes ni después) con esta forma exacta:',
    SHAPE_EXAMPLE,
    '',
    'Reglas de contenido:',
    '- Español rioplatense natural, cálido y profesional. Usá voseo.',
    '- tagline: un eslogan corto (máximo ~10 palabras).',
    '- description: 2 a 3 oraciones sobre el negocio (para la sección "Nosotros").',
    '- services: 3 o 4 servicios concretos y creíbles del rubro, cada uno con un emoji apropiado.',
    '- testimonials: 2 testimonios creíbles. Usá nombre de pila + inicial (ej. "Lucía P."). rating siempre 5.',
    '- faqs: 3 preguntas frecuentes reales del rubro con respuestas útiles.',
    '- stats: 3 métricas de confianza PLAUSIBLES y genéricas (ej. "+500" clientes, "+8" años).',
    '- NO inventes datos específicos falsos: nada de premios, teléfonos, direcciones, precios ni nombres propios de la empresa.',
    '- No repitas el nombre del negocio en cada frase; que suene natural.',
  ].join('\n')
}

// ── JSON extraction ──────────────────────────────────────────────────────────

/**
 * Pull a JSON object out of a model response. Models are asked for raw JSON but
 * sometimes wrap it in ```json fences or add a stray sentence; we take the text
 * between the first `{` and the last `}`. Returns null when nothing parses,
 * which the cascade treats as a failed attempt.
 */
export function extractJson(raw: string): unknown {
  if (!raw) return null
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

// ── Providers (fetch-based, no SDK) ──────────────────────────────────────────

const TIMEOUT_MS = 30_000

async function callOpenAICompatible(base: string, key: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`${model} HTTP ${res.status}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

async function callGemini(key: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  )
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callClaude(key: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`claude HTTP ${res.status}`)
  const data = await res.json()
  return data?.content?.[0]?.text ?? ''
}

interface Provider {
  name: string
  paid: boolean
  run: (prompt: string) => Promise<string>
}

/**
 * The cascade, in order: free models first, the paid one (Claude) last. A
 * provider is included only when its key is set, so a deployment with just a
 * Groq key still works — it simply has fewer fallbacks.
 */
export function activeProviders(env: NodeJS.ProcessEnv = process.env): Provider[] {
  const list: Provider[] = []
  if (env.GROQ_API_KEY)
    list.push({ name: 'groq', paid: false, run: (p) => callOpenAICompatible('https://api.groq.com/openai/v1', env.GROQ_API_KEY!, 'llama-3.3-70b-versatile', p) })
  if (env.CEREBRAS_API_KEY)
    // gpt-oss-120b: the model this account actually serves (verified against
    // /v1/models) and the one Hermes already uses on Cerebras.
    list.push({ name: 'cerebras', paid: false, run: (p) => callOpenAICompatible('https://api.cerebras.ai/v1', env.CEREBRAS_API_KEY!, 'gpt-oss-120b', p) })
  if (env.GEMINI_API_KEY)
    list.push({ name: 'gemini', paid: false, run: (p) => callGemini(env.GEMINI_API_KEY!, p) })
  if (env.ANTHROPIC_API_KEY)
    list.push({ name: 'claude', paid: true, run: (p) => callClaude(env.ANTHROPIC_API_KEY!, p) })
  return list
}

export interface GenerateResult {
  content: GeneratedContent
  provider: string
}

/**
 * Run the cascade until one provider returns valid content. Returns null when
 * no provider is configured or all of them fail/return unparseable output — the
 * caller then falls back to the per-rubro starter content, so the user always
 * ends up with a populated site.
 */
export async function generateSiteContent(input: GenerateSiteInput): Promise<GenerateResult | null> {
  const prompt = buildPrompt(input)
  for (const provider of activeProviders()) {
    try {
      const raw = await provider.run(prompt)
      const parsed = GeneratedContentSchema.safeParse(extractJson(raw))
      if (parsed.success) return { content: parsed.data, provider: provider.name }
      console.warn(`[ai-site-generator] ${provider.name} returned invalid content, trying next`)
    } catch (err) {
      console.warn(`[ai-site-generator] ${provider.name} failed:`, (err as Error).message)
    }
  }
  return null
}

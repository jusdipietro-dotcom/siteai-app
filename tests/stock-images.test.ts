import { describe, it, expect } from 'vitest'
import { parseStockImageUrl, ALLOWED_STOCK_HOSTS } from '@/lib/stock-images'
import { STOCK_SUGGESTIONS, stockSuggestionsFor } from '@/data/stockQueries'
import { businessTypes } from '@/data/mockBusinessTypes'

/*
  /api/stock-images/import fetches the URL it is given, server-side, from the
  VPS. That makes this gate the difference between an importer and an open
  proxy into the private network, so it is tested against the shapes an attacker
  would actually try — not just the happy path.
*/
describe('parseStockImageUrl — the importer\'s SSRF gate', () => {
  it('accepts an https Pexels photo URL', () => {
    const u = parseStockImageUrl('https://images.pexels.com/photos/123/photo-123.jpeg?auto=compress&w=800')
    expect(u).not.toBeNull()
    expect(u!.hostname).toBe('images.pexels.com')
  })

  it('rejects plain http even on the allowed host', () => {
    expect(parseStockImageUrl('http://images.pexels.com/photos/1.jpg')).toBeNull()
  })

  it('rejects hosts that merely resemble the allowed one', () => {
    // Exactly what an `endsWith`/`includes` check would let through.
    expect(parseStockImageUrl('https://images.pexels.com.attacker.net/a.jpg')).toBeNull()
    expect(parseStockImageUrl('https://evil-images.pexels.com/a.jpg')).toBeNull()
    expect(parseStockImageUrl('https://pexels.com/a.jpg')).toBeNull()
    expect(parseStockImageUrl('https://attacker.net/?x=images.pexels.com')).toBeNull()
  })

  it('rejects internal addresses the VPS can reach but the internet cannot', () => {
    for (const url of [
      'https://169.254.169.254/latest/meta-data/',
      'https://localhost/admin',
      'https://127.0.0.1:3000/api/trpc',
      'https://siteai:3000/internal',
      'https://10.0.0.5/',
      'https://192.168.1.1/',
    ]) {
      expect(parseStockImageUrl(url), url).toBeNull()
    }
  })

  it('rejects non-network schemes', () => {
    for (const url of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'file:///etc/passwd']) {
      expect(parseStockImageUrl(url), url).toBeNull()
    }
  })

  it('rejects empty, malformed and non-string input', () => {
    expect(parseStockImageUrl('')).toBeNull()
    expect(parseStockImageUrl('   ')).toBeNull()
    expect(parseStockImageUrl('no-es-una-url')).toBeNull()
    expect(parseStockImageUrl(undefined)).toBeNull()
    expect(parseStockImageUrl(null)).toBeNull()
    expect(parseStockImageUrl(42)).toBeNull()
    expect(parseStockImageUrl({ url: 'https://images.pexels.com/a.jpg' })).toBeNull()
  })

  it('keeps the allow-list narrow', () => {
    expect(ALLOWED_STOCK_HOSTS).toEqual(['images.pexels.com'])
  })
})

describe('stock suggestions per rubro', () => {
  it('covers every business type the wizard offers', () => {
    const missing = businessTypes.map((bt) => bt.id).filter((id) => !STOCK_SUGGESTIONS[id])
    expect(missing).toEqual([])
  })

  it.each(Object.keys(STOCK_SUGGESTIONS))('%s offers usable, distinct searches', (rubro) => {
    const list = STOCK_SUGGESTIONS[rubro]
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) {
      expect(item.label.trim()).not.toBe('')
      expect(item.query.trim()).not.toBe('')
    }
    // Duplicate queries would render duplicate chips with the same React key.
    expect(new Set(list.map((i) => i.query)).size).toBe(list.length)
  })

  it('falls back to a generic set for unknown or missing rubros', () => {
    const generic = stockSuggestionsFor('rubro-que-no-existe')
    expect(generic.length).toBeGreaterThan(0)
    expect(stockSuggestionsFor(undefined)).toBe(generic)
    expect(stockSuggestionsFor(null)).toBe(generic)
    expect(stockSuggestionsFor('')).toBe(generic)
  })
})

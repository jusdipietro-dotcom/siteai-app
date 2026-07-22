import type { Testimonial } from '@/types'

/**
 * Published-site testimonials.
 *
 * The star row is clamped to five and rounded, and skipped entirely for a
 * missing or zero rating — an unrated review renders as a quote, never as a
 * silently zero-star card.
 */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="section-pad testi-section" id="testimonios">
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>Testimonios</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Lo que dicen nuestros clientes</h2>
        <div className="grid-3">
          {testimonials.map((t) => (
            <div key={t.id} className="card testi-card">
              {typeof t.rating === 'number' && t.rating > 0 && (
                <div className="stars">{'★'.repeat(Math.min(5, Math.round(t.rating)))}</div>
              )}
              <p className="testi-quote">"{t.content}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="testi-avatar">{t.author?.[0] ?? '?'}</div>
                <div>
                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{t.author}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

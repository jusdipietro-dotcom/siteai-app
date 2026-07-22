import type { Service } from '@/types'

/**
 * Published-site pricing table.
 *
 * `services` arrives already narrowed to the ones the owner actually priced —
 * this section never invents an em-dash placeholder price, because a made-up
 * figure on a client's live site is the business owner's problem, not ours.
 *
 * The "Popular" highlight only appears on a full row of three. With one or two
 * cards there is nothing to compare against, so singling one out would be
 * decoration pretending to be a recommendation.
 */
export function PricingSection({
  services,
  showContact,
}: {
  services: Service[]
  showContact: boolean
}) {
  const highlight = services.length === 3 ? 1 : -1
  return (
    <section className="section-pad pricing-section" id="precios">
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>Precios</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Nuestros planes</h2>
        <p className="subtext" style={{ textAlign: 'center', marginBottom: '3rem' }}>Elegí la opción que mejor se adapta a vos</p>
        <div className="pricing-grid">
          {services.map((sv, i) => (
            <div key={sv.id} className={i === highlight ? 'price-card popular' : 'price-card'}>
              {i === highlight && <span className="price-badge">Popular</span>}
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{sv.name}</p>
                <p className="price-amount">{sv.price}</p>
              </div>
              {sv.description && <p className="subtext" style={{ fontSize: '0.9rem', flex: 1 }}>{sv.description}</p>}
              {showContact && (
                <a href="#contacto" className="btn-primary" style={{ justifyContent: 'center', padding: '0.7rem', borderRadius: '0.75rem', fontSize: '0.9rem' }}>
                  Contratar
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

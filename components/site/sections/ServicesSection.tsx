import type { Service } from '@/types'

/**
 * Published-site services grid.
 *
 * Rendered for both the `services` and the `features` section ids, which is why
 * the anchor is a prop: the two ids share this markup but land on different
 * anchors, and hardcoding one here is how the nav link for the other would
 * silently stop scrolling anywhere.
 */
export function ServicesSection({
  anchor,
  services,
  color,
}: {
  anchor: string
  services: Service[]
  color: string
}) {
  return (
    <section className="section-pad" id={anchor} style={{ background: '#fff' }}>
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>Nuestros servicios</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Todo lo que necesitás</h2>
        <p className="subtext" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          Soluciones pensadas para tu negocio
        </p>
        <div className="grid-3">
          {services.map((sv) => (
            <div key={sv.id} className="card service-card">
              <div className="service-emoji">{sv.emoji || '✨'}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{sv.name}</h3>
              <p className="subtext" style={{ fontSize: '0.9rem' }}>{sv.description}</p>
              {sv.price && (
                <p style={{ marginTop: '1rem', fontWeight: 700, color, fontSize: '0.9rem' }}>{sv.price}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import type { Service } from '@/types'
import { type ServicesLayout } from '@/lib/site-layout'

const DEFAULT_LAYOUT: ServicesLayout = {
  variant: 'cards',
  label: 'Nuestros servicios',
  title: 'Todo lo que necesitás',
  subtitle: 'Soluciones pensadas para tu negocio',
}

/**
 * Published-site services section.
 *
 * Rendered for both the `services` and the `features` section ids, which is why
 * the anchor is a prop: the two ids share this markup but land on different
 * anchors, and hardcoding one here is how the nav link for the other would
 * silently stop scrolling anywhere.
 *
 * `layout` (see lib/site-layout.ts) carries the per-template composition and the
 * section wording. It is optional and defaults to today's card grid + copy, so a
 * caller that passes nothing renders exactly as before.
 */
export function ServicesSection({
  anchor,
  services,
  color,
  layout = DEFAULT_LAYOUT,
}: {
  anchor: string
  services: Service[]
  color: string
  layout?: ServicesLayout
}) {
  const header = (
    <>
      <p className="label" style={{ textAlign: 'center' }}>{layout.label}</p>
      <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>{layout.title}</h2>
      <p className="subtext" style={{ textAlign: 'center', marginBottom: '3rem' }}>{layout.subtitle}</p>
    </>
  )

  // Menu: name + price on one line, description below — a restaurant's card.
  if (layout.variant === 'menu') {
    return (
      <section className="section-pad" id={anchor} style={{ background: '#fff' }}>
        <div className="container">
          {header}
          <div className="menu-list">
            {services.map((sv) => (
              <div key={sv.id} className="menu-item">
                <div className="menu-item-head">
                  <h3 className="menu-item-name">{sv.emoji ? `${sv.emoji} ` : ''}{sv.name}</h3>
                  {sv.price && <span className="menu-item-price" style={{ color }}>{sv.price}</span>}
                </div>
                {sv.description && <p className="subtext menu-item-desc">{sv.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // List: practice-areas style — icon + name + description in two sober columns.
  if (layout.variant === 'list') {
    return (
      <section className="section-pad" id={anchor} style={{ background: '#fff' }}>
        <div className="container">
          {header}
          <div className="svc-list">
            {services.map((sv, i) => (
              <div key={sv.id} className="svc-list-item">
                <div className="svc-list-icon" style={{ background: `${color}18`, color }}>
                  {sv.emoji || i + 1}
                </div>
                <div className="svc-list-body">
                  <h3 className="svc-list-name">{sv.name}</h3>
                  {sv.description && <p className="subtext svc-list-desc">{sv.description}</p>}
                  {sv.price && <p className="svc-list-price" style={{ color }}>{sv.price}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Cards: today's grid. Default and fallback.
  return (
    <section className="section-pad" id={anchor} style={{ background: '#fff' }}>
      <div className="container">
        {header}
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

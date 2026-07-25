import type { ContactData } from '@/types'

/**
 * Published-site "Horarios y ubicación" section.
 *
 * Deliberately built on fields the owner ALREADY edits (contact.address / city /
 * province / schedule / phone) — no new editor UI, no new stored data. That is
 * what makes this section shippable as one slice: the map is derived from the
 * address, the hours from the existing schedule text.
 *
 * The map is Google's keyless embed (`output=embed`), so no API key is needed
 * and nothing is billed. It is allowed by a `frame-src` entry added to the CSP;
 * the address is URL-encoded into the query, so it cannot break out of the src.
 *
 * The caller only renders this when there is an address (see dataReady in
 * PublishedSite), so `address` is effectively always present here; the guards
 * below keep the component honest if that ever changes.
 */
export function LocationSection({
  anchor,
  contact,
  color,
}: {
  anchor: string
  contact: ContactData
  color: string
}) {
  const fullAddress = [contact.address, contact.city, contact.province]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(', ')

  if (!fullAddress) return null

  const q = encodeURIComponent(fullAddress)
  const mapSrc = `https://www.google.com/maps?q=${q}&output=embed`
  const directionsUrl = `https://www.google.com/maps?q=${q}`

  return (
    <section className="section-pad location-section" id={anchor}>
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>Dónde estamos</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Horarios y ubicación</h2>

        <div className="location-grid">
          <div className="location-map">
            <iframe
              title="Ubicación en el mapa"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="location-info card">
            <div className="location-item">
              <span className="location-icon" aria-hidden="true">📍</span>
              <div>
                <p className="location-item-label">Dirección</p>
                <p className="location-item-value">{fullAddress}</p>
              </div>
            </div>

            {contact.schedule?.trim() && (
              <div className="location-item">
                <span className="location-icon" aria-hidden="true">🕒</span>
                <div>
                  <p className="location-item-label">Horarios</p>
                  <p className="location-item-value" style={{ whiteSpace: 'pre-line' }}>{contact.schedule}</p>
                </div>
              </div>
            )}

            {contact.phone?.trim() && (
              <div className="location-item">
                <span className="location-icon" aria-hidden="true">📞</span>
                <div>
                  <p className="location-item-label">Teléfono</p>
                  <p className="location-item-value">{contact.phone}</p>
                </div>
              </div>
            )}

            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ marginTop: '0.5rem', background: color }}
            >
              Cómo llegar →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

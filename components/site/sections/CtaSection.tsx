/**
 * Published-site closing call to action.
 *
 * The button is gated on the contact section actually being rendered: a CTA
 * whose only job is to send the visitor to `#contacto` is worse than no CTA at
 * all when that anchor does not exist on the page.
 */
export function CtaSection({ showContact }: { showContact: boolean }) {
  return (
    <section className="section-pad cta-section">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem' }}>
          ¿Listo para empezar?
        </h2>
        {showContact && (
          <a href="#contacto" className="btn-primary" style={{ fontSize: '1rem' }}>
            Quiero más información →
          </a>
        )}
      </div>
    </section>
  )
}

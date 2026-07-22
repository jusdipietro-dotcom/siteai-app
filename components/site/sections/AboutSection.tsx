/**
 * Published-site "about".
 *
 * `color` is the already-validated brand colour: the inline border and text
 * below interpolate it, so a caller that passed an unvalidated value would be
 * writing straight into a style attribute.
 */
export function AboutSection({
  description,
  color,
  showContact,
}: {
  description: string
  color: string
  showContact: boolean
}) {
  return (
    <section className="section-pad about-section" id="nosotros">
      <div className="container">
        <div className="about-inner">
          <div className="about-badge">💡 Sobre nosotros</div>
          <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>¿Quiénes somos?</h2>
          <p className="subtext" style={{ marginBottom: '1.5rem' }}>{description}</p>
          {showContact && (
            <a href="#contacto" className="btn-primary" style={{ background: 'transparent', color: color, border: `2px solid ${color}`, borderRadius: '9999px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Contactanos →
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

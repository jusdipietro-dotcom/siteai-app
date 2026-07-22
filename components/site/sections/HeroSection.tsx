/**
 * Published-site hero.
 *
 * `heroImage` arrives already validated — a value the caller could not vouch
 * for is passed as `null` and no <img> is emitted at all.
 *
 * `showContact` / `showServices` are passed in rather than derived: whether
 * those anchors exist is a fact about the whole page, and a section that
 * guessed would eventually link to an id that was never rendered.
 */
export function HeroSection({
  name,
  businessType,
  tagline,
  heroImage,
  showContact,
  showServices,
}: {
  name: string
  businessType?: string
  tagline?: string
  heroImage: string | null
  showContact: boolean
  showServices: boolean
}) {
  return (
    <section className="hero" id="inicio">
      {heroImage && <img className="hero-bg" src={heroImage} alt="" />}
      <div className="container hero-content">
        {businessType && <div className="hero-badge">✦ {businessType}</div>}
        <h1>{name}</h1>
        {tagline && (
          <p className="hero-tagline">{tagline}</p>
        )}
        <div className="hero-cta">
          {showContact && <a href="#contacto" className="btn-primary">Contactar ahora</a>}
          {showServices && <a href="#servicios" className="btn-outline">Ver servicios</a>}
        </div>
      </div>
    </section>
  )
}

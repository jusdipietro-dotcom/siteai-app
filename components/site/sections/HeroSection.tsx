import type { HeroVariant } from '@/lib/site-layout'

/**
 * Published-site hero.
 *
 * `heroImage` arrives already validated — a value the caller could not vouch
 * for is passed as `null` and no <img> is emitted at all.
 *
 * `showContact` / `showServices` are passed in rather than derived: whether
 * those anchors exist is a fact about the whole page, and a section that
 * guessed would eventually link to an id that was never rendered.
 *
 * `variant` is the per-template composition (see lib/site-layout.ts). Every
 * variant uses the owner's photo when there is one — none discards content — and
 * all four share the same badge/title/tagline/CTA so only the layout differs.
 * Defaults to 'centered', which is the original hero, so a caller that passes
 * nothing renders exactly as before.
 */
export function HeroSection({
  name,
  businessType,
  tagline,
  heroImage,
  showContact,
  showServices,
  variant = 'centered',
}: {
  name: string
  businessType?: string
  tagline?: string
  heroImage: string | null
  showContact: boolean
  showServices: boolean
  variant?: HeroVariant
}) {
  const badge = businessType && <div className="hero-badge">✦ {businessType}</div>
  const heading = <h1>{name}</h1>
  const sub = tagline && <p className="hero-tagline">{tagline}</p>
  const cta = (
    <div className="hero-cta">
      {showContact && <a href="#contacto" className="btn-primary">Contactar ahora</a>}
      {showServices && <a href="#servicios" className="btn-outline">Ver servicios</a>}
    </div>
  )

  // Split: text on a panel, photo framed beside it (not a background).
  if (variant === 'split') {
    return (
      <section className="hero hero--split" id="inicio">
        <div className="container hero-split-inner">
          <div className="hero-content">
            {badge}
            {heading}
            {sub}
            {cta}
          </div>
          {heroImage && (
            <div className="hero-split-media">
              <img src={heroImage} alt="" />
            </div>
          )}
        </div>
      </section>
    )
  }

  // Centered, fullphoto and sobrio share the background-photo structure and
  // differ only by class (photo prominence + text alignment), styled in
  // PublishedSite. sobrio keeps the photo as a faint texture rather than
  // dropping it, so the owner's image is never wasted.
  const modifier =
    variant === 'fullphoto' ? 'hero--fullphoto' : variant === 'sobrio' ? 'hero--sobrio' : ''

  return (
    <section className={`hero ${modifier}`.trim()} id="inicio">
      {heroImage && <img className="hero-bg" src={heroImage} alt="" />}
      <div className="container hero-content">
        {badge}
        {heading}
        {sub}
        {cta}
      </div>
    </section>
  )
}

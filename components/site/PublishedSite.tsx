import type { Project } from '@prisma/client'
import { AboutSection } from '@/components/site/sections/AboutSection'
import { ContactSection } from '@/components/site/sections/ContactSection'
import { CtaSection } from '@/components/site/sections/CtaSection'
import { FaqSection } from '@/components/site/sections/FaqSection'
import { GallerySection } from '@/components/site/sections/GallerySection'
import { HeroSection } from '@/components/site/sections/HeroSection'
import { LocationSection } from '@/components/site/sections/LocationSection'
import { PricingSection } from '@/components/site/sections/PricingSection'
import { ServicesSection } from '@/components/site/sections/ServicesSection'
import { StatsSection } from '@/components/site/sections/StatsSection'
import { TeamSection } from '@/components/site/sections/TeamSection'
import { TestimonialsSection } from '@/components/site/sections/TestimonialsSection'
import { parseJSON } from '@/lib/published-site'
import { resolveSiteFonts } from '@/lib/site-fonts'
import { safeImg } from '@/lib/site-images'
import { publishedSiteUrl } from '@/lib/site-domain'
import { heroVariantFor, servicesLayoutFor, FEATURES_LAYOUT, resolveTemplateKey, fontsForTemplate, isDefaultFont } from '@/lib/site-layout'
import {
  absoluteSiteImageUrl,
  buildSiteStructuredData,
  hasProfessionalSeo,
  serializeJsonLd,
} from '@/lib/site-seo'
import type { BusinessData, SectionConfig, SectionType } from '@/types'

/**
 * Nav/anchor metadata for the sections a visitor can jump to. Sections absent
 * from this map (stats, cta, footer) render but are not linkable. The anchor
 * here is the `id` the section element receives below, so nav links and section
 * ids are always derived from the same source and can never disagree.
 */
const NAV_META: Partial<Record<SectionType, { anchor: string; label: string }>> = {
  hero: { anchor: 'inicio', label: 'Inicio' },
  services: { anchor: 'servicios', label: 'Servicios' },
  features: { anchor: 'caracteristicas', label: 'Características' },
  about: { anchor: 'nosotros', label: 'Nosotros' },
  gallery: { anchor: 'galeria', label: 'Galería' },
  pricing: { anchor: 'precios', label: 'Precios' },
  testimonials: { anchor: 'testimonios', label: 'Testimonios' },
  team: { anchor: 'equipo', label: 'Equipo' },
  faq: { anchor: 'faq', label: 'Preguntas' },
  hours: { anchor: 'ubicacion', label: 'Ubicación' },
  contact: { anchor: 'contacto', label: 'Contacto' },
}

/**
 * The published-site renderer, shared by every addressing mode.
 *
 * Callers are responsible for the publish gate — this component renders
 * whatever project it is handed. Use the loaders in lib/published-site.ts so
 * the `status === 'published'` + `hasPaid` check is never re-implemented.
 *
 * Self-contained document (own <html>/<head>) because a client site must not
 * inherit the dashboard shell's fonts, analytics or chrome.
 *
 * Rendering mirrors the dashboard preview (app/(dashboard)/projects/[id]/preview
 * and the editor's live preview): sections render in the owner's chosen `order`,
 * gated by real content only. A section the owner left empty is omitted — never
 * back-filled with invented services, sample pricing, placeholder gallery tiles
 * or stock figures.
 */
export function PublishedSite({ project: row }: { project: Project }) {
  const bd = parseJSON<BusinessData>(row.businessData as string, {} as BusinessData)
  const sections = parseJSON<SectionConfig[]>(row.sections as string, [])
  const rawColor = bd.branding?.primaryColor || '#6366f1'
  const color = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#6366f1'
  const name = bd.name || row.name
  // The design template to key layouts off. Resolves a dirty `template` column
  // (e.g. a businessType id like 'profesional') to a real template via the rubro.
  const templateKey = resolveTemplateKey(row.template, bd.businessType)

  // A section renders only when the owner actually supplied its content. Nav,
  // footer links and the section list all read this one predicate so they can
  // never point at an anchor that was omitted.
  const dataReady = (id: SectionType): boolean => {
    switch (id) {
      case 'about':
        return !!bd.description
      case 'services':
      case 'features':
        return !!bd.services?.length
      case 'gallery':
        return !!bd.galleryImages?.length
      case 'pricing':
        // Honesty: only when the owner priced at least one service. We never
        // render an em-dash "price" card the preview mock uses.
        return !!bd.services?.some((s) => !!s.price)
      case 'testimonials':
        return !!bd.testimonials?.length
      case 'team':
        return !!bd.team?.length
      case 'faq':
        return !!bd.faqs?.length
      case 'stats':
        return !!bd.stats?.length
      case 'hours':
        // The location section is worth rendering only when there is an address
        // to map. Schedule/phone alone would have nothing to show on a map.
        return !!bd.contact?.address?.trim()
      case 'hero':
      case 'cta':
      case 'contact':
        return true
      default:
        // 'footer' and anything unknown are handled outside the ordered loop.
        return false
    }
  }

  // Single ordered source of truth: enabled + has content, sorted by the order
  // the owner set via drag-and-drop. Footer is always rendered last (below),
  // so it is excluded here.
  const rendered = sections
    .filter((s) => s.enabled && s.id !== 'footer' && dataReady(s.id))
    .sort((a, b) => a.order - b.order)

  const shows = (id: SectionType) => rendered.some((s) => s.id === id)
  const showContact = shows('contact')

  // Nav is derived from the rendered list — capped so a long section list can't
  // overflow the sticky bar on desktop.
  const navLinks = rendered
    .filter((s) => NAV_META[s.id])
    .map((s) => ({ id: s.id, ...NAV_META[s.id]! }))
    .slice(0, 6)

  // Fonts from branding, with the rubro's pairing filled in wherever the owner
  // is still on the generic default (Inter) — so a legal site reads in Playfair
  // without anyone touching a setting, while an explicit font choice is kept.
  // Then resolved by the shared helper (family scrub + Google Font URLs).
  const rubroFonts = fontsForTemplate(templateKey)
  const brandingForFonts = {
    ...bd.branding,
    fontHeading: isDefaultFont(bd.branding?.fontHeading) ? rubroFonts.heading : bd.branding?.fontHeading,
    fontBody: isDefaultFont(bd.branding?.fontBody) ? rubroFonts.body : bd.branding?.fontBody,
  }
  const { headingFamily, bodyFamily, urls: fontUrls } = resolveSiteFonts(brandingForFonts)

  const whatsappNum = bd.contact?.whatsapp?.replace(/\D/g, '')
  const rawGaId = row.plan === 'professional' && bd.gaId ? (bd.gaId as string).trim() : null
  const gaId = rawGaId && /^(G|GT|UA)-[A-Za-z0-9-]+$/.test(rawGaId) ? rawGaId : null
  const sitemapEnabled = bd.seo?.sitemapEnabled && row.hasPaid
  const canonical = publishedSiteUrl(row)

  // Only allow real image sources. A non-URL value (or a javascript: scheme)
  // yields null and the image is simply not rendered. Rendered as a plain `src`
  // attribute, which React escapes and the browser never executes.
  const heroImg = safeImg(bd.heroImage)
  const galleryImgs = (bd.galleryImages ?? []).map(safeImg).filter((u): u is string => !!u)

  // Social links. Handles (@user) become platform URLs; full URLs are kept but
  // forced to an http(s) origin so a javascript: value can't produce an
  // executable href.
  const normalizeUrl = (v: string) => {
    const t = v.trim()
    return /^https?:\/\//i.test(t) ? t : 'https://' + t.replace(/^\/+/, '')
  }
  const handle = (v: string) => v.trim().replace(/^@+/, '')
  const isUrl = (v: string) => /^https?:\/\//i.test(v.trim())
  const s = bd.socials
  const socialLinks: { href: string; icon: string; title: string }[] = []
  if (s?.instagram) socialLinks.push({ href: isUrl(s.instagram) ? normalizeUrl(s.instagram) : `https://instagram.com/${handle(s.instagram)}`, icon: '📸', title: 'Instagram' })
  if (s?.facebook) socialLinks.push({ href: normalizeUrl(s.facebook), icon: '👤', title: 'Facebook' })
  if (s?.linkedin) socialLinks.push({ href: normalizeUrl(s.linkedin), icon: '💼', title: 'LinkedIn' })
  if (s?.twitter) socialLinks.push({ href: isUrl(s.twitter) ? normalizeUrl(s.twitter) : `https://x.com/${handle(s.twitter)}`, icon: '🐦', title: 'X (Twitter)' })
  if (s?.tiktok) socialLinks.push({ href: isUrl(s.tiktok) ? normalizeUrl(s.tiktok) : `https://tiktok.com/@${handle(s.tiktok)}`, icon: '🎵', title: 'TikTok' })
  if (s?.youtube) socialLinks.push({ href: normalizeUrl(s.youtube), icon: '▶️', title: 'YouTube' })

  /*
    Structured data (JSON-LD) — Professional plan only.

    Gated exactly like Google Analytics above: on `row.plan`, read off the
    project row the server loaded. `plan` is not in CLIENT_WRITABLE_FIELDS, so
    no request body can escalate into it, and an Essential site emits nothing
    here at all.

    `sameAs` reuses the already-normalised social hrefs rather than re-deriving
    them, so what we tell Google and what the footer links to can never disagree.

    Everything about WHICH fields may be emitted lives in lib/site-seo.ts —
    including the fields that are deliberately never emitted (no aggregateRating
    from owner-typed testimonials, no guessed opening hours). Read the header
    there before adding a field.
  */
  const structuredData = hasProfessionalSeo(row)
    ? buildSiteStructuredData({
        name,
        businessData: bd,
        canonical,
        image: absoluteSiteImageUrl(bd.heroImage, canonical),
        sameAs: socialLinks.map((l) => l.href),
      })
    : null

  // ── Per-section renderers, keyed by section id ──────────────────────────────
  const renderSection = (section: SectionConfig) => {
    switch (section.id) {
      case 'hero':
        return (
          <HeroSection
            key="hero"
            name={name}
            businessType={bd.businessType}
            tagline={bd.tagline || bd.description}
            heroImage={heroImg}
            showContact={showContact}
            showServices={shows('services')}
            variant={heroVariantFor(templateKey)}
          />
        )

      case 'about':
        return (
          <AboutSection key="about" description={bd.description} color={color} showContact={showContact} />
        )

      case 'services':
        return (
          <ServicesSection
            key="services"
            anchor={NAV_META.services!.anchor}
            services={bd.services}
            color={color}
            layout={servicesLayoutFor(templateKey)}
          />
        )

      case 'features':
        return (
          <ServicesSection
            key="features"
            anchor={NAV_META.features!.anchor}
            services={bd.services}
            color={color}
            layout={FEATURES_LAYOUT}
          />
        )

      case 'gallery':
        return <GallerySection key="gallery" images={galleryImgs} />

      case 'pricing':
        return (
          <PricingSection
            key="pricing"
            services={bd.services.filter((sv) => !!sv.price).slice(0, 3)}
            showContact={showContact}
          />
        )

      case 'stats':
        return <StatsSection key="stats" stats={bd.stats!} />

      case 'team':
        return (
          <TeamSection
            key="team"
            members={bd.team.map((m) => ({ id: m.id, name: m.name, role: m.role, bio: m.bio, photo: safeImg(m.image) }))}
            color={color}
          />
        )

      case 'testimonials':
        return <TestimonialsSection key="testimonials" testimonials={bd.testimonials} />

      case 'faq':
        return <FaqSection key="faq" faqs={bd.faqs} />

      case 'cta':
        return <CtaSection key="cta" showContact={showContact} />

      case 'hours':
        return <LocationSection key="hours" anchor={NAV_META.hours!.anchor} contact={bd.contact} color={color} />

      case 'contact':
        return (
          <ContactSection
            key="contact"
            contact={bd.contact}
            whatsappNumber={whatsappNum}
            leadForm={
              /*
                Real lead capture. The old `mailto:` + method=get submitted
                nothing (and nothing at all on mobile/webmail), so every lead
                was silently lost. This posts to /api/site-leads, which stores
                the lead against this project and notifies the owner. Progressive
                enhancement via a vanilla script rather than a React island: the
                published document nests its own <html> under the app's root
                layout, where hydration is unreliable — the same reason the
                hamburger above uses an inline script.

                It stays here rather than inside ContactSection because its
                element ids are a contract with that script, which only this
                document emits.
              */
              <form id="lead-form">
                {/* Honeypot — hidden from humans, catches bots (same contract as /api/inquiries) */}
                <input
                  id="lead-honeypot"
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                />
                <input id="lead-name" className="form-field" type="text" name="nombre" placeholder="Tu nombre" required minLength={2} />
                <input id="lead-email" className="form-field" type="email" name="email" placeholder="Tu email" required />
                <input id="lead-phone" className="form-field" type="tel" name="tel" placeholder="Tu teléfono (opcional)" />
                <textarea id="lead-message" className="form-field form-textarea" name="mensaje" placeholder="¿En qué podemos ayudarte?" required minLength={2} />
                <button id="lead-submit" type="submit" className="btn-submit">Enviar mensaje →</button>
                <p
                  id="lead-status"
                  role="status"
                  aria-live="polite"
                  style={{ display: 'none', marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}
                />
              </form>
            }
          />
        )

      default:
        return null
    }
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {fontUrls.map((url) => (
          <link key={url} href={url} rel="stylesheet" />
        ))}
        {sitemapEnabled && (
          <link rel="sitemap" type="application/xml" href={`${canonical}/sitemap.xml`} />
        )}
        {structuredData && (
          /*
            serializeJsonLd — NOT a bare JSON.stringify. The GA snippet below
            gets away with JSON.stringify because gaId is regex-narrowed first
            and can never hold a `<`; these are free-form owner fields, so a
            business named `Bar </script><script>…` would otherwise close this
            element. See lib/site-seo.ts.
          */
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
          />
        )}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});` }} />
          </>
        )}
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body { font-family: '${bodyFamily}', system-ui, sans-serif; color: #1e293b; background: #fff; }
          h1, h2, h3, h4, h5, h6 { font-family: '${headingFamily}', system-ui, sans-serif; }
          a { color: inherit; text-decoration: none; }
          img { max-width: 100%; display: block; }
          button { cursor: pointer; font-family: inherit; }
          input, textarea { font-family: inherit; }
          .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
          .section-pad { padding: 5rem 0; }
          .section-pad-sm { padding: 3rem 0; }
          .label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${color}; margin-bottom: 0.75rem; }
          .heading-xl { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: #0f172a; line-height: 1.1; }
          .heading-lg { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; color: #0f172a; line-height: 1.15; }
          .subtext { color: #64748b; line-height: 1.7; }
          .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: ${color}; color: #fff; padding: 0.875rem 2rem; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; border: none; transition: opacity .15s; }
          .btn-primary:hover { opacity: .88; }
          .btn-outline { display: inline-flex; align-items: center; gap: 0.5rem; background: transparent; color: #fff; padding: 0.875rem 2rem; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; border: 2px solid rgba(255,255,255,0.55); transition: background .15s; }
          .btn-outline:hover { background: rgba(255,255,255,0.12); }
          .card { background: #fff; border: 1px solid #e8edf3; border-radius: 1.25rem; padding: 1.75rem; }
          .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
          .grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.5rem; }
          .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.5rem; }
          @media (max-width: 768px) {
            .grid-3 { grid-template-columns: 1fr; }
            .grid-2 { grid-template-columns: 1fr; }
            .grid-4 { grid-template-columns: repeat(2,1fr); }
            .hide-mobile { display: none !important; }
            .section-pad { padding: 2.5rem 0; }
            .section-pad-sm { padding: 2rem 0; }
            .container { padding: 0 1rem; }
          }
          /* Navbar */
          .navbar { position: sticky; top: 0; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); border-bottom: 1px solid #e8edf3; z-index: 100; }
          .navbar-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
          .navbar-logo { font-size: 1.2rem; font-weight: 800; color: ${color}; }
          .navbar-links { display: flex; gap: 2rem; }
          .navbar-links a { font-size: 0.875rem; color: #64748b; font-weight: 500; transition: color .15s; }
          .navbar-links a:hover { color: #0f172a; }
          .hamburger { display: none; background: none; border: none; padding: 0.25rem; cursor: pointer; }
          .hamburger span { display: block; width: 22px; height: 2px; background: #334155; margin: 5px 0; border-radius: 2px; transition: .25s; }
          .mobile-menu { display: none; background: #fff; border-top: 1px solid #e8edf3; padding: 0.75rem 1rem 1rem; }
          .mobile-menu.open { display: block; }
          .mobile-menu a { display: block; padding: 0.65rem 0.5rem; font-size: 0.9rem; font-weight: 500; color: #475569; border-bottom: 1px solid #f1f5f9; }
          .mobile-menu a:last-child { border-bottom: none; }
          @media (max-width: 768px) {
            .hamburger { display: block; }
          }
          /* Hero */
          .hero { background: linear-gradient(135deg, ${color}ee 0%, ${color}88 100%); min-height: 88vh; display: flex; align-items: center; position: relative; overflow: hidden; }
          @media (max-width: 768px) { .hero { min-height: 70vh; } }
          .hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.28; z-index: 0; }
          .hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.08) 100%); z-index: 1; }
          .hero-content { position: relative; z-index: 2; color: #fff; max-width: 700px; }
          .hero-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.375rem 1rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 1.25rem; backdrop-filter: blur(8px); }
          .hero h1 { font-size: clamp(2.25rem, 6vw, 4rem); font-weight: 900; line-height: 1.04; margin-bottom: 1rem; }
          .hero-tagline { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; line-height: 1.7; }
          .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; }
          /* Hero variants (per-template composition — lib/site-layout.ts).
             centered is the base above; these three redefine composition only. */
          /* fullphoto: photo carries the page, text centered */
          .hero--fullphoto .hero-bg { opacity: 0.62; }
          .hero--fullphoto::before { background: linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.32) 100%); }
          .hero--fullphoto .hero-content { max-width: 760px; margin: 0 auto; text-align: center; }
          .hero--fullphoto .hero-cta { justify-content: center; }
          /* sobrio: typographic, photo reduced to a faint texture, dark text on light */
          .hero--sobrio { background: linear-gradient(135deg, ${color}14 0%, #ffffff 100%); }
          .hero--sobrio .hero-bg { opacity: 0.07; }
          .hero--sobrio::before { background: none; }
          .hero--sobrio .hero-content { color: #0f172a; max-width: 820px; margin: 0 auto; text-align: center; }
          .hero--sobrio .hero-badge { background: ${color}18; color: ${color}; }
          .hero--sobrio .hero-tagline { color: #475569; opacity: 1; }
          .hero--sobrio .btn-outline { color: ${color}; border-color: ${color}66; }
          .hero--sobrio .btn-outline:hover { background: ${color}12; }
          /* split: text panel beside a framed photo (no background photo) */
          .hero--split { min-height: auto; padding: 4.5rem 0; }
          .hero--split .hero-split-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; width: 100%; position: relative; z-index: 2; }
          .hero--split .hero-content { max-width: 100%; }
          .hero--split .hero-split-media img { width: 100%; height: 100%; max-height: 440px; object-fit: cover; border-radius: 1.5rem; box-shadow: 0 24px 60px rgba(0,0,0,.28); }
          @media (max-width: 768px) {
            .hero--split .hero-split-inner { grid-template-columns: 1fr; gap: 2rem; }
            .hero--split .hero-split-media img { max-height: 240px; }
          }
          /* Services */
          .service-card { border-top: 3px solid ${color}; }
          .service-emoji { font-size: 2rem; margin-bottom: 1rem; }
          /* Services — menu variant (gastronomía): name + price on a line */
          .menu-list { max-width: 720px; margin: 0 auto; display: grid; gap: 1.25rem; }
          .menu-item { border-bottom: 1px dashed #e2e8f0; padding-bottom: 1.25rem; }
          .menu-item:last-child { border-bottom: none; padding-bottom: 0; }
          .menu-item-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
          .menu-item-name { font-weight: 700; font-size: 1.05rem; color: #0f172a; }
          .menu-item-price { font-weight: 800; white-space: nowrap; }
          .menu-item-desc { font-size: 0.9rem; margin-top: 0.35rem; }
          /* Services — list variant (áreas de práctica): icon + text, two columns */
          .svc-list { max-width: 860px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1.75rem; }
          .svc-list-item { display: flex; gap: 1rem; align-items: flex-start; }
          .svc-list-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; }
          .svc-list-body { min-width: 0; }
          .svc-list-name { font-weight: 700; font-size: 1rem; color: #0f172a; margin-bottom: 0.25rem; }
          .svc-list-desc { font-size: 0.9rem; }
          .svc-list-price { font-weight: 700; font-size: 0.9rem; margin-top: 0.4rem; }
          @media (max-width: 768px) { .svc-list { grid-template-columns: 1fr; gap: 1.25rem; } }
          /* Location (horarios y ubicación) — map + info card */
          .location-section { background: #f8fafc; }
          .location-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 2rem; align-items: stretch; }
          .location-map { border-radius: 1.25rem; overflow: hidden; min-height: 340px; box-shadow: 0 12px 40px rgba(0,0,0,.1); }
          .location-map iframe { width: 100%; height: 100%; min-height: 340px; border: 0; display: block; }
          .location-info { display: flex; flex-direction: column; gap: 1.25rem; justify-content: center; }
          .location-item { display: flex; gap: 0.85rem; align-items: flex-start; }
          .location-icon { font-size: 1.25rem; flex-shrink: 0; line-height: 1.3; }
          .location-item-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 0.15rem; }
          .location-item-value { color: #334155; font-size: 0.95rem; line-height: 1.5; }
          @media (max-width: 768px) { .location-grid { grid-template-columns: 1fr; } .location-map, .location-map iframe { min-height: 260px; } }
          /* Gallery */
          .gallery-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.75rem; }
          .gallery-item { aspect-ratio: 1/1; border-radius: 0.75rem; overflow: hidden; background: #e2e8f0; }
          .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
          @media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2,1fr); } }
          /* Pricing */
          .pricing-section { background: #f8fafc; }
          .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; max-width: 860px; margin: 0 auto; }
          .price-card { background: #fff; border: 2px solid #e8edf3; border-radius: 1.5rem; padding: 1.75rem; display: flex; flex-direction: column; gap: 1rem; }
          .price-card.popular { border-color: ${color}; box-shadow: 0 8px 30px ${color}30; }
          .price-badge { background: ${color}; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; align-self: flex-start; text-transform: uppercase; letter-spacing: 0.05em; }
          .price-amount { font-size: 1.75rem; font-weight: 800; color: ${color}; margin-top: 0.25rem; }
          @media (max-width: 768px) { .pricing-grid { grid-template-columns: 1fr; } }
          /* Testimonials */
          .testi-section { background: #f8fafc; }
          .testi-card { background: #fff; }
          .stars { color: #f59e0b; font-size: 1rem; margin-bottom: 0.75rem; }
          .testi-quote { color: #475569; font-style: italic; margin-bottom: 1.25rem; font-size: 0.9rem; line-height: 1.75; }
          .testi-avatar { width: 36px; height: 36px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
          /* About */
          .about-section { background: #f8fafc; }
          .about-inner { max-width: 720px; }
          .about-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: ${color}18; color: ${color}; font-size: 0.75rem; font-weight: 700; padding: 0.4rem 0.875rem; border-radius: 9999px; margin-bottom: 1rem; }
          /* Team */
          .team-member-card { text-align: center; }
          .team-avatar { width: 72px; height: 72px; border-radius: 50%; background: ${color}22; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; color: ${color}; margin: 0 auto 1rem; }
          .team-photo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; }
          /* FAQ */
          .faq-item { border-bottom: 1px solid #e8edf3; padding: 1.25rem 0; }
          .faq-item:last-child { border-bottom: none; }
          .faq-q { font-weight: 600; color: #0f172a; margin-bottom: 0.5rem; font-size: 0.95rem; }
          .faq-a { color: #64748b; font-size: 0.9rem; line-height: 1.7; }
          /* Stats */
          .stats-section { background: ${color}; color: #fff; }
          .stat-number { font-size: 2.5rem; font-weight: 900; }
          .stat-label { font-size: 0.875rem; opacity: 0.85; }
          /* CTA */
          .cta-section { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; text-align: center; }
          /* Contact */
          .contact-info-item { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem; color: #475569; }
          .contact-info-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
          .contact-form { background: #f8fafc; border-radius: 1.25rem; padding: 1.75rem; border: 1px solid #e8edf3; }
          .form-field { width: 100%; padding: 0.65rem 0.875rem; border: 1.5px solid #e8edf3; border-radius: 0.625rem; font-size: 0.9rem; outline: none; margin-bottom: 0.75rem; color: #0f172a; background: #fff; }
          .form-field:focus { border-color: ${color}; }
          .form-textarea { height: 100px; resize: vertical; }
          .btn-submit { width: 100%; background: ${color}; color: #fff; padding: 0.8rem; border-radius: 0.625rem; border: none; font-weight: 700; font-size: 0.9rem; }
          /* Footer */
          .footer { background: #0f172a; color: #94a3b8; padding: 2.5rem 0; text-align: center; }
          .footer-logo { font-size: 1.25rem; font-weight: 800; color: ${color}; margin-bottom: 0.5rem; }
          .footer-city { font-size: 0.85rem; margin-bottom: 1.5rem; }
          .footer-socials { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
          .footer-social-link { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.9rem; transition: background .15s, color .15s; }
          .footer-social-link:hover { background: ${color}; color: #fff; }
          .footer-copy { font-size: 0.75rem; color: #475569; }
          .whatsapp-float { position: fixed; bottom: 1.5rem; right: 1.5rem; background: #25D366; color: #fff; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 16px rgba(37,211,102,.45); z-index: 200; transition: transform .15s; }
          .whatsapp-float:hover { transform: scale(1.08); }
        `}</style>
      </head>
      <body>

        {/* ── Navbar ── */}
        <nav className="navbar">
          <div className="container navbar-inner">
            <span className="navbar-logo">{name}</span>
            <div className="navbar-links hide-mobile">
              {navLinks.map((l) => (
                <a key={l.id} href={`#${l.anchor}`}>{l.label}</a>
              ))}
            </div>
            {showContact && (
              <a href="#contacto" className="btn-primary hide-mobile" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Contactar
              </a>
            )}
            <button className="hamburger" id="hamburger" aria-label="Menú" type="button">
              <span /><span /><span />
            </button>
          </div>
          <div className="mobile-menu" id="mobile-menu">
            {navLinks.map((l) => (
              <a key={l.id} href={`#${l.anchor}`}>{l.label}</a>
            ))}
          </div>
        </nav>
        <script dangerouslySetInnerHTML={{ __html: `
          var btn = document.getElementById('hamburger');
          var menu = document.getElementById('mobile-menu');
          if(btn && menu) {
            btn.addEventListener('click', function() {
              menu.classList.toggle('open');
            });
            menu.querySelectorAll('a').forEach(function(a) {
              a.addEventListener('click', function() { menu.classList.remove('open'); });
            });
          }
        `}} />

        {/* ── Ordered sections (owner's drag-and-drop order, content-gated) ── */}
        {rendered.map((section) => renderSection(section))}

        {showContact && (
          <script dangerouslySetInnerHTML={{ __html: `
            (function () {
              var pid = ${JSON.stringify(row.id)};
              // Delegate on document, not on the form node: this published document
              // nests its own <html> under the app's root layout, so React may
              // replace the form node during hydration and detach a node-level
              // listener. document survives, and every element is looked up fresh
              // at submit time.
              function el(id) { return document.getElementById(id); }
              function val(id) { var n = el(id); return n ? n.value : ''; }
              function setStatus(msg, kind) {
                var s = el('lead-status');
                if (!s) return;
                s.textContent = msg || '';
                s.style.display = msg ? 'block' : 'none';
                s.style.color = kind === 'error' ? '#dc2626' : '#16a34a';
              }
              document.addEventListener('submit', function (e) {
                var form = e.target;
                if (!form || form.id !== 'lead-form') return;
                e.preventDefault();
                setStatus('', '');
                var btn = el('lead-submit');
                var defaultLabel = 'Enviar mensaje →';
                if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
                var payload = {
                  projectId: pid,
                  name: val('lead-name'),
                  email: val('lead-email'),
                  phone: val('lead-phone'),
                  message: val('lead-message'),
                  honeypot: val('lead-honeypot')
                };
                fetch('/api/site-leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                }).then(function (res) {
                  return res.json().catch(function () { return {}; }).then(function (data) {
                    return { ok: res.ok, data: data };
                  });
                }).then(function (r) {
                  var b = el('lead-submit');
                  if (r.ok && r.data && r.data.ok) {
                    if (form.reset) form.reset();
                    setStatus('¡Mensaje enviado! Te vamos a responder a la brevedad.', 'success');
                    if (b) { b.textContent = 'Mensaje enviado ✓'; }
                    setTimeout(function () { var b2 = el('lead-submit'); if (b2) { b2.disabled = false; b2.textContent = defaultLabel; } }, 4000);
                  } else {
                    var msg = (r.data && r.data.error) ? r.data.error : 'No se pudo enviar el mensaje. Intenta de nuevo.';
                    setStatus(msg, 'error');
                    if (b) { b.disabled = false; b.textContent = defaultLabel; }
                  }
                }).catch(function () {
                  var b = el('lead-submit');
                  setStatus('No se pudo enviar el mensaje. Revisa tu conexion e intenta de nuevo.', 'error');
                  if (b) { b.disabled = false; b.textContent = defaultLabel; }
                });
              }, true);
            })();
          `}} />
        )}

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="container">
            <p className="footer-logo">{name}</p>
            {bd.contact?.city && (
              <p className="footer-city">{[bd.contact.city, bd.contact.province].filter(Boolean).join(', ')}</p>
            )}

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="footer-socials">
                {socialLinks.map((sl) => (
                  <a key={sl.title} href={sl.href} target="_blank" rel="noreferrer" className="footer-social-link" title={sl.title}>
                    {sl.icon}
                  </a>
                ))}
              </div>
            )}

            {navLinks.filter((l) => l.id !== 'hero').length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {navLinks.filter((l) => l.id !== 'hero').map((l) => (
                  <a key={l.id} href={`#${l.anchor}`} style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.label}</a>
                ))}
              </div>
            )}

            <p className="footer-copy">
              © {new Date().getFullYear()} {name}. Todos los derechos reservados.
            </p>
          </div>
        </footer>

        {/* WhatsApp flotante */}
        {whatsappNum && (
          <a
            href={`https://wa.me/${whatsappNum}`}
            target="_blank"
            rel="noreferrer"
            className="whatsapp-float"
            title="WhatsApp"
          >
            💬
          </a>
        )}

      </body>
    </html>
  )
}

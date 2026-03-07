import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import type { BusinessData, SectionConfig } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJSON<T>(val: unknown, fallback: T): T {
  if (typeof val !== 'string') return fallback
  try { return JSON.parse(val) as T } catch { return fallback }
}

function sectionEnabled(sections: SectionConfig[], id: string) {
  return sections.some(s => s.id === id && s.enabled)
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const row = await prisma.project.findFirst({
    where: { slug: params.slug, status: 'published' },
    select: { name: true, businessData: true },
  })
  if (!row) return { title: 'Sitio no encontrado' }

  const bd = parseJSON<BusinessData>(row.businessData, {} as BusinessData)
  const title = bd.seo?.title || row.name
  const description = bd.seo?.description || bd.description || ''

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

// ─── Public site page ─────────────────────────────────────────────────────────

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const row = await prisma.project.findFirst({
    where: { slug: params.slug, status: 'published' },
  })

  if (!row) notFound()

  const bd = parseJSON<BusinessData>(row.businessData as string, {} as BusinessData)
  const sections = parseJSON<SectionConfig[]>(row.sections as string, [])
  const color = bd.branding?.primaryColor || '#6366f1'
  const name = bd.name || row.name

  const has = (id: string) => sectionEnabled(sections, id)

  const whatsappNum = bd.contact?.whatsapp?.replace(/\D/g, '')

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background: #fff; }
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
          .hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.08) 100%); }
          .hero-content { position: relative; color: #fff; max-width: 700px; }
          .hero-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.375rem 1rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 1.25rem; backdrop-filter: blur(8px); }
          .hero h1 { font-size: clamp(2.25rem, 6vw, 4rem); font-weight: 900; line-height: 1.04; margin-bottom: 1rem; }
          .hero-tagline { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; line-height: 1.7; }
          .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; }
          /* Services */
          .service-card { border-top: 3px solid ${color}; }
          .service-emoji { font-size: 2rem; margin-bottom: 1rem; }
          /* Testimonials */
          .testi-section { background: #f8fafc; }
          .testi-card { background: #fff; }
          .stars { color: #f59e0b; font-size: 1rem; margin-bottom: 0.75rem; }
          .testi-quote { color: #475569; font-style: italic; margin-bottom: 1.25rem; font-size: 0.9rem; line-height: 1.75; }
          .testi-avatar { width: 36px; height: 36px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
          /* About */
          .about-section { background: #f8fafc; }
          .about-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
          .about-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: ${color}18; color: ${color}; font-size: 0.75rem; font-weight: 700; padding: 0.4rem 0.875rem; border-radius: 9999px; margin-bottom: 1rem; }
          @media (max-width: 768px) {
            .about-inner { grid-template-columns: 1fr; gap: 2rem; }
            .about-icons { grid-template-columns: 1fr 1fr !important; }
          }
          /* Team */
          .team-member-card { text-align: center; }
          .team-avatar { width: 72px; height: 72px; border-radius: 50%; background: ${color}22; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; color: ${color}; margin: 0 auto 1rem; }
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
          .footer-socials { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; }
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
              <a href="#inicio">Inicio</a>
              {has('services') && <a href="#servicios">Servicios</a>}
              {has('about') && <a href="#nosotros">Nosotros</a>}
              {has('testimonials') && <a href="#testimonios">Testimonios</a>}
              {has('contact') && <a href="#contacto">Contacto</a>}
            </div>
            {has('contact') && (
              <a href="#contacto" className="btn-primary hide-mobile" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Contactar
              </a>
            )}
            <button className="hamburger" id="hamburger" aria-label="Menú" type="button">
              <span /><span /><span />
            </button>
          </div>
          <div className="mobile-menu" id="mobile-menu">
            <a href="#inicio" onClick={undefined}>Inicio</a>
            {has('services') && <a href="#servicios">Servicios</a>}
            {has('about') && <a href="#nosotros">Nosotros</a>}
            {has('testimonials') && <a href="#testimonios">Testimonios</a>}
            {has('contact') && <a href="#contacto">Contacto</a>}
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

        {/* ── Hero ── */}
        <section className="hero" id="inicio">
          <div className="container hero-content">
            <div className="hero-badge">✦ {bd.businessType || 'Negocio local'}</div>
            <h1>{name}</h1>
            <p className="hero-tagline">
              {bd.tagline || bd.description || 'Tu presencia online, profesional y lista para crecer.'}
            </p>
            <div className="hero-cta">
              {has('contact') && (
                <a href="#contacto" className="btn-primary">Contactar ahora</a>
              )}
              {has('services') && (
                <a href="#servicios" className="btn-outline">Ver servicios</a>
              )}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        {has('about') && (
          <section className="section-pad about-section" id="nosotros">
            <div className="container">
              <div className="about-inner">
                <div>
                  <div className="about-badge">💡 Sobre nosotros</div>
                  <h2 className="heading-lg" style={{ marginBottom: '1rem' }}>¿Quiénes somos?</h2>
                  <p className="subtext" style={{ marginBottom: '1.5rem' }}>
                    {bd.description || 'Somos un equipo comprometido con brindar el mejor servicio a nuestros clientes. Trabajamos con pasión y dedicación para superar tus expectativas.'}
                  </p>
                  {has('contact') && (
                    <a href="#contacto" className="btn-primary" style={{ background: 'transparent', color: color, border: `2px solid ${color}`, borderRadius: '9999px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      Contactanos →
                    </a>
                  )}
                </div>
                <div className="about-icons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { emoji: '🏆', label: 'Calidad garantizada' },
                    { emoji: '⚡', label: 'Respuesta rápida' },
                    { emoji: '🤝', label: 'Atención personalizada' },
                    { emoji: '📍', label: 'Presencia local' },
                  ].map(({ emoji, label }) => (
                    <div key={label} style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: '1rem', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{emoji}</div>
                      <p style={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Services ── */}
        {has('services') && (
          <section className="section-pad" id="servicios" style={{ background: '#fff' }}>
            <div className="container">
              <p className="label" style={{ textAlign: 'center' }}>Nuestros servicios</p>
              <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Todo lo que necesitás</h2>
              <p className="subtext" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                Soluciones pensadas para tu negocio
              </p>
              <div className="grid-3">
                {(bd.services?.length > 0
                  ? bd.services
                  : [
                      { id: '1', name: 'Consulta inicial', description: 'Evaluación detallada de tu situación con nuestros expertos.', emoji: '⭐' },
                      { id: '2', name: 'Servicio principal', description: 'El servicio más solicitado por nuestros clientes, con resultados comprobados.', emoji: '🔧' },
                      { id: '3', name: 'Seguimiento', description: 'Acompañamiento continuo para asegurar los mejores resultados.', emoji: '✅' },
                    ]
                ).map((s) => (
                  <div key={s.id} className="card service-card">
                    <div className="service-emoji">{s.emoji || '✨'}</div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{s.name}</h3>
                    <p className="subtext" style={{ fontSize: '0.9rem' }}>{s.description}</p>
                    {s.price && (
                      <p style={{ marginTop: '1rem', fontWeight: 700, color, fontSize: '0.9rem' }}>{s.price}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Stats ── */}
        {has('stats') && (
          <section className="section-pad-sm stats-section">
            <div className="container">
              <div className="grid-4" style={{ textAlign: 'center' }}>
                {[
                  { number: '+500', label: 'Clientes satisfechos' },
                  { number: '+10', label: 'Años de experiencia' },
                  { number: '98%', label: 'Tasa de satisfacción' },
                  { number: '24/7', label: 'Disponibilidad' },
                ].map(({ number, label }) => (
                  <div key={label}>
                    <div className="stat-number">{number}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Team ── */}
        {has('team') && bd.team?.length > 0 && (
          <section className="section-pad" style={{ background: '#f8fafc' }}>
            <div className="container">
              <p className="label" style={{ textAlign: 'center' }}>El equipo</p>
              <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Conocé a nuestro equipo</h2>
              <div className="grid-3">
                {bd.team.map((m) => (
                  <div key={m.id} className="card team-member-card">
                    <div className="team-avatar">{m.name?.[0] ?? '?'}</div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>{m.name}</h3>
                    <p style={{ fontSize: '0.8rem', color, fontWeight: 600, marginBottom: '0.75rem' }}>{m.role}</p>
                    {m.bio && <p className="subtext" style={{ fontSize: '0.875rem' }}>{m.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Testimonials ── */}
        {has('testimonials') && (
          <section className="section-pad testi-section" id="testimonios">
            <div className="container">
              <p className="label" style={{ textAlign: 'center' }}>Testimonios</p>
              <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Lo que dicen nuestros clientes</h2>
              <div className="grid-3">
                {(bd.testimonials?.length > 0
                  ? bd.testimonials
                  : [
                      { id: '1', author: 'María García', role: 'Cliente satisfecha', content: 'Excelente servicio, totalmente recomendable.', rating: 5 },
                      { id: '2', author: 'Carlos López', role: 'Cliente', content: 'Profesionales de primera. Me ayudaron a resolver todo rápidamente.', rating: 5 },
                      { id: '3', author: 'Ana Martínez', role: 'Clienta fiel', content: 'Increíble atención y resultados. Los recomiendo a todos.', rating: 5 },
                    ]
                ).map((t) => (
                  <div key={t.id} className="card testi-card">
                    <div className="stars">{'★'.repeat(t.rating ?? 5)}</div>
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
        )}

        {/* ── FAQ ── */}
        {has('faq') && bd.faqs?.length > 0 && (
          <section className="section-pad" style={{ background: '#fff' }}>
            <div className="container" style={{ maxWidth: '720px' }}>
              <p className="label" style={{ textAlign: 'center' }}>Preguntas frecuentes</p>
              <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>¿Tenés dudas?</h2>
              <div>
                {bd.faqs.map((f) => (
                  <div key={f.id} className="faq-item">
                    <p className="faq-q">{f.question}</p>
                    <p className="faq-a">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        {has('cta') && (
          <section className="section-pad cta-section">
            <div className="container" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem' }}>
                ¿Listo para empezar?
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.05rem' }}>
                Contactanos hoy y recibí una consulta sin costo.
              </p>
              {has('contact') && (
                <a href="#contacto" className="btn-primary" style={{ fontSize: '1rem' }}>
                  Quiero más información →
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        {has('contact') && (
          <section className="section-pad" id="contacto" style={{ background: '#fff' }}>
            <div className="container">
              <p className="label" style={{ textAlign: 'center' }}>Contacto</p>
              <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Contactate con nosotros</h2>
              <p className="subtext" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                Estamos para ayudarte en todo momento
              </p>
              <div className="grid-2" style={{ maxWidth: '800px', margin: '0 auto', alignItems: 'start' }}>
                <div>
                  {bd.contact?.phone && (
                    <a href={`tel:${bd.contact.phone}`} className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1rem' }}>
                      <span className="contact-info-icon">📞</span>
                      <span>{bd.contact.phone}</span>
                    </a>
                  )}
                  {bd.contact?.email && (
                    <a href={`mailto:${bd.contact.email}`} className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1rem' }}>
                      <span className="contact-info-icon">✉️</span>
                      <span>{bd.contact.email}</span>
                    </a>
                  )}
                  {(bd.contact?.city || bd.contact?.address) && (
                    <div className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1rem' }}>
                      <span className="contact-info-icon">📍</span>
                      <span>{[bd.contact.address, bd.contact.city, bd.contact.province].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {bd.contact?.schedule && (
                    <div className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1.5rem' }}>
                      <span className="contact-info-icon">🕐</span>
                      <span>{bd.contact.schedule}</span>
                    </div>
                  )}
                  {whatsappNum && (
                    <a
                      href={`https://wa.me/${whatsappNum}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', marginTop: '0.5rem' }}
                    >
                      💬 Escribinos por WhatsApp
                    </a>
                  )}
                </div>
                <div className="contact-form">
                  <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.95rem' }}>Envianos un mensaje</p>
                  <form
                    action={`mailto:${bd.contact?.email || ''}`}
                    method="get"
                    encType="text/plain"
                  >
                    <input className="form-field" type="text" name="nombre" placeholder="Tu nombre" required />
                    <input className="form-field" type="email" name="email" placeholder="Tu email" required />
                    <input className="form-field" type="tel" name="tel" placeholder="Tu teléfono (opcional)" />
                    <textarea className="form-field form-textarea" name="body" placeholder="¿En qué podemos ayudarte?" required />
                    <button type="submit" className="btn-submit">Enviar mensaje →</button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="container">
            <p className="footer-logo">{name}</p>
            {bd.contact?.city && (
              <p className="footer-city">{[bd.contact.city, bd.contact.province].filter(Boolean).join(', ')}</p>
            )}

            {/* Social links */}
            {bd.socials && Object.values(bd.socials).some(Boolean) && (
              <div className="footer-socials">
                {bd.socials.instagram && (
                  <a href={`https://instagram.com/${bd.socials.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="footer-social-link" title="Instagram">
                    📸
                  </a>
                )}
                {bd.socials.facebook && (
                  <a href={bd.socials.facebook} target="_blank" rel="noreferrer" className="footer-social-link" title="Facebook">
                    👤
                  </a>
                )}
                {bd.socials.linkedin && (
                  <a href={bd.socials.linkedin} target="_blank" rel="noreferrer" className="footer-social-link" title="LinkedIn">
                    💼
                  </a>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {has('services') && <a href="#servicios" style={{ fontSize: '0.8rem', color: '#64748b' }}>Servicios</a>}
              {has('about') && <a href="#nosotros" style={{ fontSize: '0.8rem', color: '#64748b' }}>Nosotros</a>}
              {has('contact') && <a href="#contacto" style={{ fontSize: '0.8rem', color: '#64748b' }}>Contacto</a>}
            </div>

            <p className="footer-copy">
              © {new Date().getFullYear()} {name}. Todos los derechos reservados.{' '}
              <span style={{ opacity: 0.5 }}>· Sitio creado con SiteAI</span>
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

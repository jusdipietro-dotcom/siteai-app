'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink, Edit3, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'
import type { DevicePreview } from '@/types'

// ── Full site preview with all sections using real project data ────────────────
function SiteFullPreview({ project, device, color }: { project: any; device: DevicePreview; color: string }) {
  const bd = project.businessData
  const isMobile = device === 'mobile'
  const px = isMobile ? '1.5rem' : '3rem'
  const py = isMobile ? '3rem' : '5rem'

  // Sections sorted by order, only enabled ones (plus always show hero/footer)
  const enabledIds = new Set(project.sections.filter((s: any) => s.enabled).map((s: any) => s.id))
  const ordered = [...project.sections].sort((a: any, b: any) => a.order - b.order)

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8edf3', padding: `0 ${px}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', zIndex: 10 }}>
        <span style={{ fontSize: '1.2rem', fontWeight: '800', color }}>{bd.name}</span>
        {!isMobile && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {ordered.filter((s: any) => s.enabled && s.id !== 'hero' && s.id !== 'footer').slice(0, 4).map((s: any) => (
              <span key={s.id} style={{ fontSize: '0.875rem', color: '#64748b', cursor: 'pointer' }}>{s.label}</span>
            ))}
          </div>
        )}
        <button style={{ background: color, color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '9999px', border: 'none', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}>
          Contactar
        </button>
      </nav>

      {ordered.map((section: any) => {
        if (!section.enabled) return null
        switch (section.id) {
          case 'hero':
            return (
              <section key="hero" style={{ background: bd.heroImage ? undefined : `linear-gradient(135deg, ${color}ee, ${color}99)`, minHeight: '80vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                {bd.heroImage && <img src={bd.heroImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))' }} />
                <div style={{ position: 'relative', padding: `4rem ${px}`, color: '#fff', maxWidth: '700px' }}>
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1rem' }}>
                    ✦ {bd.businessType}
                  </div>
                  <h1 style={{ fontSize: isMobile ? '2rem' : '3.5rem', fontWeight: '800', lineHeight: 1.05, marginBottom: '1rem' }}>{bd.name}</h1>
                  <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '1.5rem', lineHeight: 1.7 }}>{bd.tagline || 'Tu negocio, tu presencia online'}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button style={{ background: '#fff', color, padding: '0.875rem 2rem', borderRadius: '9999px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Contactar ahora →</button>
                    <button style={{ background: 'transparent', color: '#fff', padding: '0.875rem 2rem', borderRadius: '9999px', fontWeight: '700', border: '2px solid rgba(255,255,255,0.6)', cursor: 'pointer' }}>Ver servicios</button>
                  </div>
                </div>
              </section>
            )

          case 'about':
            return (
              <section key="about" style={{ padding: `${py} ${px}`, background: '#f8fafc', textAlign: 'center' }}>
                <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '1rem' }}>Sobre Nosotros</h2>
                <p style={{ color: '#475569', lineHeight: 1.8, maxWidth: '680px', margin: '0 auto', fontSize: '1rem' }}>{bd.description || 'Somos un equipo apasionado comprometido con la excelencia.'}</p>
              </section>
            )

          case 'services':
          case 'features':
            return (
              <section key={section.id} style={{ padding: `${py} ${px}`, background: '#fff' }}>
                <p style={{ textAlign: 'center', color, fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Nuestros servicios</p>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '800', marginBottom: '3rem' }}>Todo lo que necesitás</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {(bd.services.length > 0 ? bd.services : [
                    { id: '1', name: 'Servicio 1', description: 'Descripción del servicio', emoji: '⭐' },
                    { id: '2', name: 'Servicio 2', description: 'Descripción del servicio', emoji: '🔧' },
                    { id: '3', name: 'Servicio 3', description: 'Descripción del servicio', emoji: '✅' },
                  ]).map((s: any) => (
                    <div key={s.id} style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: '1.25rem', padding: '1.75rem', borderTop: `3px solid ${color}` }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{s.emoji ?? '✦'}</div>
                      <h3 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.5rem' }}>{s.name}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.75 }}>{s.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )

          case 'pricing':
            return (
              <section key="pricing" style={{ padding: `${py} ${px}`, background: '#f8fafc' }}>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Precios</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>Elegí el plan que mejor se adapta a vos</p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>
                  {(bd.services.length > 0 ? bd.services.slice(0, 3) : [
                    { id: '1', name: 'Básico', price: '$9.990/mes', description: 'Ideal para empezar' },
                    { id: '2', name: 'Estándar', price: '$19.990/mes', description: 'Para crecer' },
                    { id: '3', name: 'Premium', price: '$39.990/mes', description: 'Máximo rendimiento' },
                  ]).map((s: any, i: number) => (
                    <div key={s.id} style={{ background: '#fff', border: `2px solid ${i === 1 ? color : '#e8edf3'}`, borderRadius: '1.5rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', transform: i === 1 ? 'scale(1.04)' : 'none', boxShadow: i === 1 ? `0 8px 30px ${color}30` : 'none' }}>
                      {i === 1 && <span style={{ background: color, color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '9999px', alignSelf: 'flex-start', textTransform: 'uppercase' }}>Popular</span>}
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '1.05rem' }}>{s.name}</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: '800', color, marginTop: '0.25rem' }}>{s.price || '—'}</p>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>{s.description}</p>
                      <button style={{ background: i === 1 ? color : 'transparent', color: i === 1 ? '#fff' : color, border: `2px solid ${color}`, padding: '0.7rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>Contratar</button>
                    </div>
                  ))}
                </div>
              </section>
            )

          case 'testimonials':
            return (
              <section key="testimonials" style={{ padding: `${py} ${px}`, background: section.id === 'testimonials' ? '#f8fafc' : '#fff' }}>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '3rem' }}>Lo que dicen nuestros clientes</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                  {(bd.testimonials.length > 0 ? bd.testimonials : [
                    { id: '1', author: 'Cliente', role: 'Usuario', content: 'Excelente servicio.', rating: 5 },
                  ]).map((t: any) => (
                    <div key={t.id} style={{ background: '#fff', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid #e8edf3' }}>
                      <p style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '0.75rem' }}>{'★'.repeat(t.rating ?? 5)}</p>
                      <p style={{ color: '#475569', fontStyle: 'italic', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.75 }}>"{t.content}"</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                          {(t.author || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.875rem' }}>{t.author}</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )

          case 'team':
            return (
              <section key="team" style={{ padding: `${py} ${px}`, background: '#fff' }}>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '3rem' }}>Nuestro Equipo</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
                  {(bd.team.length > 0 ? bd.team : [
                    { id: '1', name: 'Nombre Apellido', role: 'Cargo', bio: '' },
                  ]).slice(0, 4).map((m: any) => (
                    <div key={m.id} style={{ textAlign: 'center', maxWidth: '160px' }}>
                      {m.image
                        ? <img src={m.image} alt={m.name} style={{ width: '80px', height: '80px', borderRadius: '1rem', objectFit: 'cover', margin: '0 auto 0.75rem' }} />
                        : <div style={{ width: '80px', height: '80px', borderRadius: '1rem', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>{(m.name || 'N')[0]}</div>
                      }
                      <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{m.name}</p>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{m.role}</p>
                    </div>
                  ))}
                </div>
              </section>
            )

          case 'gallery':
            return (
              <section key="gallery" style={{ padding: `${py} ${px}`, background: '#f8fafc' }}>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '3rem' }}>Galería</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {(bd.galleryImages ?? []).length > 0
                    ? (bd.galleryImages as string[]).map((url, i) => (
                        <div key={i} style={{ aspectRatio: '1/1', borderRadius: '0.75rem', overflow: 'hidden' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))
                    : [...Array(6)].map((_, i) => (
                        <div key={i} style={{ aspectRatio: '1/1', borderRadius: '0.75rem', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.5rem' }}>🖼</div>
                      ))
                  }
                </div>
              </section>
            )

          case 'faq':
            return (
              <section key="faq" style={{ padding: `${py} ${px}`, background: '#fff' }}>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '3rem' }}>Preguntas Frecuentes</h2>
                <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(bd.faqs.length > 0 ? bd.faqs : [
                    { id: '1', question: '¿Cómo puedo contactarlos?', answer: 'Podés escribirnos por email o WhatsApp en cualquier momento.' },
                  ]).map((faq: any) => (
                    <div key={faq.id} style={{ border: '1px solid #e8edf3', borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
                      <p style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{faq.question}</p>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.75 }}>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )

          case 'stats':
            return (
              <section key="stats" style={{ padding: `${py} ${px}`, background: color }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center', color: '#fff' }}>
                  {[['500+', 'Clientes'], ['10+', 'Años'], ['98%', 'Satisfacción'], ['24/7', 'Soporte']].map(([v, l]) => (
                    <div key={l}><p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{v}</p><p style={{ opacity: 0.8, marginTop: '0.5rem', fontSize: '0.9rem' }}>{l}</p></div>
                  ))}
                </div>
              </section>
            )

          case 'cta':
            return (
              <section key="cta" style={{ padding: `${py} ${px}`, background: `${color}12`, textAlign: 'center' }}>
                <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '1rem' }}>{bd.tagline || '¿Listo para empezar?'}</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '560px', margin: '0 auto 2rem', lineHeight: 1.7 }}>{bd.description || 'Contactanos hoy y llevá tu negocio al siguiente nivel.'}</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button style={{ background: color, color: '#fff', padding: '0.875rem 2.5rem', borderRadius: '9999px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Contactar ahora</button>
                  <button style={{ background: 'transparent', color, padding: '0.875rem 2.5rem', borderRadius: '9999px', fontWeight: '700', border: `2px solid ${color}`, cursor: 'pointer' }}>Saber más</button>
                </div>
              </section>
            )

          case 'contact':
            return (
              <section key="contact" style={{ padding: `${py} ${px}`, background: '#fff' }}>
                <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Contactate con nosotros</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>Estamos para ayudarte en todo momento</p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                  <div>
                    {bd.contact.phone && <p style={{ color: '#475569', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📞 {bd.contact.phone}</p>}
                    {bd.contact.email && <p style={{ color: '#475569', marginBottom: '0.75rem', fontSize: '0.9rem' }}>✉️ {bd.contact.email}</p>}
                    {bd.contact.address && <p style={{ color: '#475569', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📍 {bd.contact.address}</p>}
                    {bd.contact.city && <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{bd.contact.city}</p>}
                    {bd.contact.whatsapp && (
                      <a href={`https://wa.me/${bd.contact.whatsapp}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none' }}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid #e8edf3' }}>
                    <p style={{ fontWeight: '700', color: '#0f172a', marginBottom: '1rem', fontSize: '0.95rem' }}>Envianos un mensaje</p>
                    {['Nombre', 'Email', 'Mensaje'].map((field) => (
                      <div key={field} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ height: field === 'Mensaje' ? '80px' : '38px', background: '#fff', border: '1.5px solid #e8edf3', borderRadius: '0.625rem', display: 'flex', alignItems: field === 'Mensaje' ? 'flex-start' : 'center', padding: '0 0.75rem', paddingTop: field === 'Mensaje' ? '0.5rem' : 0 }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{field}...</span>
                        </div>
                      </div>
                    ))}
                    <button style={{ width: '100%', background: color, color: '#fff', padding: '0.75rem', borderRadius: '0.625rem', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Enviar mensaje →
                    </button>
                  </div>
                </div>
              </section>
            )

          case 'footer':
            return (
              <footer key="footer" style={{ background: '#0f172a', color: '#94a3b8', padding: `2.5rem ${px}`, textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color, marginBottom: '0.5rem' }}>{bd.name}</p>
                {bd.contact.city && <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>{bd.contact.city}</p>}
                {(bd.socials.instagram || bd.socials.facebook || bd.socials.twitter) && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {bd.socials.instagram && <span style={{ color: '#94a3b8' }}>{bd.socials.instagram}</span>}
                    {bd.socials.facebook && <span style={{ color: '#94a3b8' }}>{bd.socials.facebook}</span>}
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', color: '#475569' }}>© {new Date().getFullYear()} {bd.name} · Sitio creado con SiteAI</p>
              </footer>
            )

          default:
            return null
        }
      })}
    </div>
  )
}

const deviceConfig: { id: DevicePreview; icon: typeof Monitor; label: string; width: string; height: string }[] = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%', height: '100%' },
  { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px', height: '1024px' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px', height: '812px' },
]

export default function PreviewPage() {
  const params = useParams()
  const id = params.id as string
  const { projects } = useProjectStore()
  const project = projects.find((p) => p.id === id)
  const [device, setDevice] = useState<DevicePreview>('desktop')

  const dConf = deviceConfig.find(d => d.id === device)!

  if (!project) {
    return <div className="flex items-center justify-center h-screen text-surface-500">Proyecto no encontrado</div>
  }

  const color = project.businessData.branding.primaryColor

  return (
    <div className="flex flex-col h-screen bg-surface-900">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-950 border-b border-surface-800 shrink-0">
        <Link href={`/projects/${id}/editor`} className="p-2 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{project.name}</p>
          <p className="text-xs text-surface-500">Vista previa</p>
        </div>

        {/* Device switcher */}
        <div className="flex items-center bg-surface-800 rounded-xl p-1 gap-0.5">
          {deviceConfig.map((d) => {
            const Icon = d.icon
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  device === d.id ? 'bg-white text-surface-900' : 'text-surface-400 hover:text-white'
                )}
                title={d.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/projects/${id}/editor`}>
            <Button size="sm" variant="outline" className="gap-1.5 border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </Button>
          </Link>
          {project.status === 'published' && (
            <Button size="sm" variant="gradient" className="gap-1.5" onClick={() => window.open(`/s/${project.slug}`, '_blank')}>
              <ExternalLink className="w-3.5 h-3.5" /> Ver sitio
            </Button>
          )}
        </div>
      </div>

      {/* Watermark banner — solo para proyectos sin plan pago */}
      {!project.hasPaid && (
        <div className="shrink-0 bg-surface-900 border-b border-surface-700 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <span className="text-white font-medium">Vista previa gratuita.</span>
              {' '}El sitio publicado no tendrá esta barra ni marca de agua.
            </span>
          </div>
          <Link href={`/projects/${id}/checkout`}>
            <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-white gradient-brand px-3 py-1.5 rounded-lg shadow-brand hover:opacity-90 transition-opacity shrink-0">
              <Sparkles className="w-3.5 h-3.5" /> Publicar sitio
            </button>
          </Link>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-6 px-4">
        <motion.div
          animate={{
            width: dConf.width === '100%' ? '100%' : dConf.width,
            maxHeight: dConf.height === '100%' ? 'none' : dConf.height,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.4)] border border-surface-700"
          style={{ width: device === 'desktop' ? '100%' : dConf.width, maxWidth: '100%' }}
        >
          <SiteFullPreview project={project} device={device} color={color} />
        </motion.div>
      </div>
    </div>
  )
}

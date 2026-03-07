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
          {/* Full HTML preview */}
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* NAV */}
            <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8edf3', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', zIndex: 10 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color }}>{project.businessData.name}</span>
              {device !== 'mobile' && (
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {['Inicio', 'Servicios', 'Nosotros', 'Contacto'].map(l => (
                    <span key={l} style={{ fontSize: '0.875rem', color: '#64748b', cursor: 'pointer' }}>{l}</span>
                  ))}
                </div>
              )}
              <button style={{ background: color, color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '9999px', border: 'none', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}>
                Contactar
              </button>
            </nav>

            {/* HERO */}
            <section style={{ background: `linear-gradient(135deg, ${color}ee, ${color}99)`, minHeight: '80vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))' }} />
              <div style={{ position: 'relative', padding: device === 'mobile' ? '3rem 1.5rem' : '4rem 3rem', color: '#fff', maxWidth: '700px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1rem', backdropFilter: 'blur(8px)' }}>
                  ✦ {project.businessData.businessType}
                </div>
                <h1 style={{ fontSize: device === 'mobile' ? '2rem' : '3.5rem', fontWeight: '800', lineHeight: 1.05, marginBottom: '1rem' }}>
                  {project.businessData.name}
                </h1>
                <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '1.5rem', lineHeight: 1.7 }}>
                  {project.businessData.tagline || 'Tu negocio, tu presencia online'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button style={{ background: '#fff', color, padding: '0.875rem 2rem', borderRadius: '9999px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                    Contactar ahora →
                  </button>
                  <button style={{ background: 'transparent', color: '#fff', padding: '0.875rem 2rem', borderRadius: '9999px', fontWeight: '700', border: '2px solid rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.95rem' }}>
                    Ver servicios
                  </button>
                </div>
              </div>
            </section>

            {/* SERVICES */}
            {project.sections.find(s => s.id === 'services' && s.enabled) && (
              <section style={{ padding: device === 'mobile' ? '3rem 1.5rem' : '5rem 3rem', background: '#fff' }}>
                <p style={{ textAlign: 'center', color, fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Nuestros servicios</p>
                <h2 style={{ textAlign: 'center', fontSize: device === 'mobile' ? '1.75rem' : '2.5rem', fontWeight: '800', marginBottom: '0.75rem', color: '#0f172a' }}>
                  Todo lo que necesitás
                </h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
                  Soluciones pensadas para tu negocio
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: device === 'mobile' ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {(project.businessData.services.length > 0
                    ? project.businessData.services
                    : [
                        { id: '1', name: 'Consulta inicial', description: 'Evaluación de tu caso con expertos', emoji: '⭐' },
                        { id: '2', name: 'Servicio principal', description: 'El servicio más solicitado por nuestros clientes', emoji: '🔧' },
                        { id: '3', name: 'Seguimiento', description: 'Acompañamiento post-servicio', emoji: '✅' },
                      ]
                  ).map((s) => (
                    <div key={s.id} style={{ background: '#fff', border: `1px solid #e8edf3`, borderRadius: '1.25rem', padding: '1.75rem', borderTop: `3px solid ${color}` }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{s.emoji}</div>
                      <h3 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{s.name}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.75 }}>{s.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TESTIMONIALS */}
            {project.sections.find(s => s.id === 'testimonials' && s.enabled) && (
              <section style={{ padding: device === 'mobile' ? '3rem 1.5rem' : '5rem 3rem', background: '#f8fafc' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', marginBottom: '3rem', color: '#0f172a' }}>Lo que dicen nuestros clientes</h2>
                <div style={{ display: 'grid', gridTemplateColumns: device === 'mobile' ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                  {[
                    { name: 'María García', role: 'Cliente satisfecha', text: 'Excelente servicio, totalmente recomendable.' },
                    { name: 'Carlos López', role: 'Cliente', text: 'Profesionales de primera. Me ayudaron a resolver todo.' },
                    { name: 'Ana Martínez', role: 'Clienta fiel', text: 'Increíble atención y resultados. Los recomiendo a todos.' },
                  ].map((t, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid #e8edf3' }}>
                      <p style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '0.75rem' }}>★★★★★</p>
                      <p style={{ color: '#475569', fontStyle: 'italic', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.75 }}>"{t.text}"</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>
                          {t.name[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.875rem' }}>{t.name}</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CONTACT */}
            {project.sections.find(s => s.id === 'contact' && s.enabled) && (
              <section style={{ padding: device === 'mobile' ? '3rem 1.5rem' : '5rem 3rem', background: '#fff' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0f172a' }}>Contactate con nosotros</h2>
                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>Estamos para ayudarte en todo momento</p>
                <div style={{ display: 'grid', gridTemplateColumns: device === 'mobile' ? '1fr' : '1fr 1fr', gap: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                  <div>
                    {project.businessData.contact.phone && <p style={{ color: '#475569', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📞 {project.businessData.contact.phone}</p>}
                    {project.businessData.contact.email && <p style={{ color: '#475569', marginBottom: '0.75rem', fontSize: '0.9rem' }}>✉️ {project.businessData.contact.email}</p>}
                    {project.businessData.contact.city && <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.9rem' }}>📍 {project.businessData.contact.city}</p>}
                    {project.businessData.contact.whatsapp && (
                      <a href={`https://wa.me/${project.businessData.contact.whatsapp}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none' }}>
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
            )}

            {/* FOOTER */}
            <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '2.5rem 3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '800', color, marginBottom: '0.5rem' }}>{project.businessData.name}</p>
              <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>{project.businessData.contact.city}</p>
              <p style={{ fontSize: '0.75rem', color: '#475569' }}>
                © {new Date().getFullYear()} {project.businessData.name} · Sitio creado con SiteAI
              </p>
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

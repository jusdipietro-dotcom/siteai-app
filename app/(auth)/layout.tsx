import Link from 'next/link'
import { Metadata } from 'next'
import { WEBSITE_PLANS, formatARS } from '@/lib/website-plans'

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
}

// Rubros as chips so a visitor recognises their own trade at a glance — "esto
// es para mí". Short labels; the wizard has the full list.
const RUBROS = [
  'Abogados', 'Contadores', 'Consultorios', 'Gimnasios', 'Comercios',
  'Inmobiliarias', 'Restaurantes', 'Peluquerías', 'Arquitectos', 'Fotógrafos',
]

const SITE_FEATURES = [
  { icon: '⚡', text: 'Editor visual, sin programar' },
  { icon: '🤖', text: 'Imágenes generadas con IA' },
  { icon: '💬', text: 'Botón de WhatsApp integrado' },
  { icon: '📱', text: 'Adaptado al celular' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const annual = WEBSITE_PLANS.essential.annual
  const monthly = WEBSITE_PLANS.essential.monthly

  return (
    <div className="min-h-screen flex gradient-dark-hero">
      {/* Left side – sales pitch (desktop) */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/20 via-transparent to-transparent" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 group w-fit">
          <img src="/logo.png" alt="Automatic IA Lab" width={40} height={40} className="h-10 w-10 object-contain rounded-2xl group-hover:scale-105 transition-transform" />
          <div>
            <p className="text-lg font-bold text-white">Automatic IA Lab</p>
            <p className="text-xs text-white/40">Sitios web con IA</p>
          </div>
        </Link>

        {/* Center content */}
        <div className="relative space-y-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/70 text-[11px] font-semibold tracking-wide uppercase mb-4">
              Sitios web autogestionados
            </span>
            <h2 className="text-4xl font-extrabold text-white leading-[1.05] mb-3">
              Tu sitio web, publicado{' '}
              <span className="gradient-text">esta misma tarde.</span>
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed max-w-md">
              Sin diseñador, sin agencia y sin saber programar. Un asistente te hace las
              preguntas de tu negocio y arma el sitio completo sobre una plantilla profesional.
              Después lo editás vos, desde el navegador.
            </p>
          </div>

          {/* Free-first */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
            <span className="text-lg shrink-0">🆓</span>
            <p className="text-white/80 text-sm leading-relaxed">
              Armarlo, editarlo y verlo terminado <span className="font-semibold text-white">no cuesta nada</span>.
              No pedimos tarjeta. Si no te convence, no pagás.
            </p>
          </div>

          {/* Price */}
          <div className="glass-dark rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-wide font-semibold mb-1">Recién pagás cuando publicás</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold gradient-text">{formatARS(annual)}</span>
              <span className="text-white/50 text-sm">/mes · plan anual</span>
            </div>
            <p className="text-white/40 text-xs mt-1.5">
              O {formatARS(monthly)}/mes pagando mes a mes. Incluye hosting, certificado SSL,
              tu subdominio y ediciones ilimitadas.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {SITE_FEATURES.map((feat) => (
              <div key={feat.text} className="flex items-center gap-2 glass-dark rounded-xl px-3 py-2.5">
                <span className="text-base shrink-0">{feat.icon}</span>
                <p className="text-white/75 text-[12.5px] leading-snug">{feat.text}</p>
              </div>
            ))}
          </div>

          {/* Rubros */}
          <div>
            <p className="text-white/55 text-sm font-medium mb-2.5">
              ¿Sos profesional, abogado, contador, tenés un gimnasio o un comercio? Es para vos.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RUBROS.map((r) => (
                <span key={r} className="px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/10 text-white/60 text-xs">
                  {r}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg text-white/40 text-xs">y más…</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/20">⏱️ Minutos, no semanas · © {new Date().getFullYear()} Automatic IA Lab</p>
      </div>

      {/* Right side – form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src="/logo.png" alt="Automatic IA Lab" width={36} height={36} className="h-9 w-9 object-contain rounded-xl" />
            <p className="text-lg font-bold text-white">Automatic IA Lab</p>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}

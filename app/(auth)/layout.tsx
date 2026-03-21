import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex gradient-dark-hero">
      {/* Left side – branding */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/20 via-transparent to-transparent" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 group w-fit">
          <img src="/logo.png" alt="Automatic IA Lab" width={40} height={40} className="h-10 w-10 object-contain rounded-2xl group-hover:scale-105 transition-transform" />
          <div>
            <p className="text-lg font-bold text-white">Automatic IA Lab</p>
            <p className="text-xs text-white/40">Automatizaciones con IA</p>
          </div>
        </Link>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Automatiza tu negocio{' '}
              <span className="gradient-text">con inteligencia artificial.</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed">
              Sitios web profesionales, monitoreo judicial automatizado y herramientas de IA para tu negocio. Todo en una sola plataforma.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: '🌐', title: 'Sitios web en minutos', desc: 'Creá tu sitio profesional sin programar' },
              { icon: '⚖️', title: 'Monitoreo judicial', desc: 'Alertas automaticas de PJN y SCBA' },
              { icon: '🤖', title: 'Automatizaciones IA', desc: 'Workflows inteligentes para tu negocio' },
            ].map((feat) => (
              <div key={feat.title} className="flex items-start gap-3 glass-dark rounded-xl p-3">
                <span className="text-lg mt-0.5">{feat.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{feat.title}</p>
                  <p className="text-white/40 text-xs">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Clientes activos' },
              { value: '24/7', label: 'Monitoreo' },
              { value: '4.9 ★', label: 'Satisfaccion' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">© {new Date().getFullYear()} Automatic IA Lab · Todos los derechos reservados</p>
      </div>

      {/* Right side – form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <img src="/logo.png" alt="Automatic IA Lab" width={36} height={36} className="h-9 w-9 object-contain rounded-xl" />
            <p className="text-lg font-bold text-white">Automatic IA Lab</p>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}

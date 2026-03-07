import Link from 'next/link'

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
          <img src="/logo.png" alt="Automatic IA Lab" className="h-10 w-10 object-contain rounded-2xl group-hover:scale-105 transition-transform" />
          <div>
            <p className="text-lg font-bold text-white">Automatic IA Lab</p>
            <p className="text-xs text-white/40">Website Builder</p>
          </div>
        </Link>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Tu negocio, online{' '}
              <span className="gradient-text">en minutos.</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed">
              Creá tu sitio web profesional sin necesidad de programar. Más de 500 negocios ya confían en Automatic IA Lab.
            </p>
          </div>

          {/* Testimonial */}
          <div className="glass-dark rounded-2xl p-5">
            <p className="text-white/80 text-sm italic leading-relaxed mb-4">
              "Creé mi sitio en menos de 20 minutos y al día siguiente ya tenía consultas de clientes nuevos. Increíble."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                MG
              </div>
              <div>
                <p className="text-white text-sm font-medium">Martín González</p>
                <p className="text-white/40 text-xs">Estudio Contable MG, Córdoba</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Sitios creados' },
              { value: '< 20 min', label: 'Tiempo promedio' },
              { value: '4.9 ★', label: 'Satisfacción' },
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
            <img src="/logo.png" alt="Automatic IA Lab" className="h-9 w-9 object-contain rounded-xl" />
            <p className="text-lg font-bold text-white">Automatic IA Lab</p>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}

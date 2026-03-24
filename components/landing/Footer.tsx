import Link from 'next/link'

const links: Record<string, { label: string; href: string }[]> = {
  Productos: [
    { label: 'Sitios Web con IA', href: '/#sitios-web' },
    { label: 'Monitoreo Judicial', href: '/#monitoreo-judicial' },
    { label: 'Prospeccion B2B', href: '/#prospeccion' },
    { label: 'Captacion de Leads', href: '/#captacion-leads' },
    { label: 'Resenas Google IA', href: '/#resenas-google' },
    { label: 'LinkedIn Optimizer', href: '/#linkedin-optimizer' },
    { label: 'Email Marketing', href: '/#email-marketing' },
    { label: 'Senales Crypto', href: '/#senales-crypto' },
    { label: 'Redes Sociales', href: '/#redes-sociales' },
    { label: 'Turnos Online', href: '/#turnos-online' },
    { label: 'Automatizaciones', href: '/#automatizaciones' },
  ],
  Recursos: [
    { label: 'Blog', href: '/blog' },
    { label: 'Preguntas frecuentes', href: '/#faq' },
    { label: 'Precios', href: '/#pricing' },
    { label: 'Plan Gratuito', href: '/gratis' },
    { label: 'Sobre nosotros', href: '/about' },
    { label: 'Contacto', href: '/contacto' },
  ],
  Legal: [
    { label: 'Terminos de uso', href: '/terms' },
    { label: 'Privacidad', href: '/privacy' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-surface-950 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Automatic IA Lab" width={32} height={32} className="w-8 h-8 object-contain rounded-xl" />
              <span className="text-lg font-bold text-white">Automatic IA Lab</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed max-w-xs">
              Plataforma de automatizacion con IA. 11 productos para escalar tu negocio: sitios web, monitoreo judicial, prospeccion B2B, email marketing, resenas, LinkedIn, trading y mas.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">{category}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-surface-400 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-800">
          <p className="text-sm text-surface-600">
            &copy; {new Date().getFullYear()} Automatic IA Lab &middot; Buenos Aires, Argentina
          </p>
          <p className="text-sm text-surface-600">
            Automatización inteligente para negocios
          </p>
        </div>
      </div>
    </footer>
  )
}

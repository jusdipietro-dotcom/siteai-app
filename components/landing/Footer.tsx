import Link from 'next/link'

const links: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: 'Características', href: '/#features' },
    { label: 'Templates', href: '/#templates' },
    { label: 'Precios', href: '/#pricing' },
    { label: 'Novedades', href: '/#features' },
  ],
  Soporte: [
    { label: 'Documentación', href: '/help' },
    { label: 'Preguntas frecuentes', href: '/#faq' },
    { label: 'Contacto', href: 'mailto:automaticialab@gmail.com' },
    { label: 'Estado del servicio', href: 'https://automaticialab.com' },
  ],
  Legal: [
    { label: 'Términos de uso', href: '/terms' },
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Política de cookies', href: '/privacy' },
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
              <img src="/logo.png" alt="Automatic IA Lab" className="w-8 h-8 object-contain rounded-xl" />
              <span className="text-lg font-bold text-white">Automatic IA Lab</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed max-w-xs">
              Generador de sitios web con IA para negocios locales de Argentina. Sin código, sin diseñadores.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">{category}</h4>
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
            © {new Date().getFullYear()} Automatic IA Lab · Buenos Aires, Argentina
          </p>
          <p className="text-sm text-surface-600">
            Hecho con IA para negocios locales
          </p>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import { Zap } from 'lucide-react'

const links: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: 'Características', href: '/#features' },
    { label: 'Templates', href: '/#templates' },
    { label: 'Precios', href: '/#pricing' },
    { label: 'Changelog', href: '#' },
  ],
  Soporte: [
    { label: 'Documentación', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'Estado del servicio', href: '#' },
  ],
  Legal: [
    { label: 'Términos de uso', href: '/terms' },
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Cookies', href: '#' },
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
              <div className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center shadow-brand">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Site<span className="text-brand-400">AI</span>
              </span>
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
            © {new Date().getFullYear()} SiteAI · AUTOMATIC IA LAB · Buenos Aires, Argentina
          </p>
          <p className="text-sm text-surface-600">
            Hecho con IA para negocios locales
          </p>
        </div>
      </div>
    </footer>
  )
}

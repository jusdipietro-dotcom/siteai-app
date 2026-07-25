'use client'
import { MessageCircle, Mail, MapPin } from 'lucide-react'
import { WA_GENERIC } from '@/lib/whatsapp'

const sections = [
  {
    title: 'Servicios',
    items: [
      { label: 'Inteligencia Artificial', href: '#servicios' },
      { label: 'Marketing Digital', href: '#servicios' },
      { label: 'Diseño Web', href: '#servicios' },
      { label: 'Posicionamiento SEO', href: '#servicios' },
    ],
  },
  {
    title: 'Navegación',
    items: [
      { label: 'Soluciones', href: '#soluciones' },
      { label: 'Para tu rubro', href: '#rubros' },
      { label: 'Proceso', href: '#proceso' },
      { label: 'Preguntas frecuentes', href: '#faq' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="bg-surface-950 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="Automatic IA Lab"
                width={32}
                height={32}
                className="w-8 h-8 object-contain rounded-xl"
              />
              <span className="text-lg font-bold text-white">Automatic IA Lab</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed max-w-md mb-6">
              Agencia digital argentina especializada en inteligencia artificial aplicada, marketing
              digital, diseño web a medida y posicionamiento SEO.
            </p>
            <div className="space-y-2.5 text-sm">
              <a
                href={WA_GENERIC}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                +54 9 11 7131 1465
              </a>
              <div className="flex items-center gap-2 text-surface-500">
                <Mail className="w-4 h-4 text-surface-600" />
                automaticialab@gmail.com
              </div>
              <div className="flex items-center gap-2 text-surface-500">
                <MapPin className="w-4 h-4 text-surface-600" />
                Buenos Aires, Argentina
              </div>
            </div>
          </div>

          {sections.map((s) => (
            <div key={s.title}>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">
                {s.title}
              </p>
              <ul className="space-y-2.5">
                {s.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-surface-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-800">
          <p className="text-sm text-surface-600">
            &copy; {new Date().getFullYear()} Automatic IA Lab - Buenos Aires, Argentina
          </p>
          <p className="text-sm text-surface-600">Automatización inteligente para tu negocio</p>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = { title: 'Política de privacidad — SiteAI' }

const sections = [
  {
    title: '1. Datos que recopilamos',
    content:
      'Recopilamos la información que nos proporcionás directamente: nombre, email y datos del negocio ingresados en el wizard. También recopilamos datos de uso del servicio (páginas visitadas, funciones utilizadas) de forma anónima para mejorar la plataforma.',
  },
  {
    title: '2. Uso de la información',
    content:
      'Utilizamos tus datos para: prestar el servicio de generación de sitios web, enviarte notificaciones relacionadas con tu cuenta, mejorar la plataforma y comunicarnos con vos sobre actualizaciones o cambios importantes.',
  },
  {
    title: '3. Almacenamiento de datos',
    content:
      'Tus datos se almacenan en servidores seguros. Aplicamos medidas técnicas y organizativas razonables para proteger tu información contra acceso no autorizado, pérdida o alteración.',
  },
  {
    title: '4. Compartir información',
    content:
      'No vendemos ni compartimos tus datos personales con terceros para fines comerciales. Podemos compartir información con proveedores de servicios que nos ayudan a operar la plataforma (hosting, email), bajo acuerdos de confidencialidad.',
  },
  {
    title: '5. Cookies',
    content:
      'Utilizamos cookies propias para mantener tu sesión activa y recordar tus preferencias. No utilizamos cookies de rastreo de terceros para publicidad. Podés desactivar las cookies desde la configuración de tu navegador.',
  },
  {
    title: '6. Tus derechos',
    content:
      'Tenés derecho a acceder, rectificar y eliminar tus datos personales en cualquier momento. Para ejercer estos derechos, contactanos desde el panel de configuración de tu cuenta o enviando un email a privacidad@siteai.app.',
  },
  {
    title: '7. Retención de datos',
    content:
      'Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta, tus datos personales serán eliminados en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales.',
  },
  {
    title: '8. Cambios a esta política',
    content:
      'Podemos actualizar esta política periódicamente. Te notificaremos por email ante cambios significativos. El uso continuado del servicio tras la notificación implica la aceptación de la nueva política.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center shadow-brand">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900">
              Site<span className="text-brand-500">AI</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2">Política de privacidad</h1>
          <p className="text-sm text-surface-400">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-semibold text-surface-900 mb-2">{s.title}</h2>
              <p className="text-surface-600 leading-relaxed text-sm">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 flex gap-4 text-sm text-surface-400">
          <Link href="/terms" className="hover:text-surface-700 transition-colors">Términos de uso</Link>
          <span>·</span>
          <Link href="/" className="hover:text-surface-700 transition-colors">Volver al inicio</Link>
        </div>
      </main>
    </div>
  )
}

import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = { title: 'Términos de uso — SiteAI' }

const sections = [
  {
    title: '1. Aceptación de los términos',
    content:
      'Al acceder y utilizar SiteAI, aceptás estos términos de uso en su totalidad. Si no estás de acuerdo con alguna parte, no debés utilizar el servicio.',
  },
  {
    title: '2. Descripción del servicio',
    content:
      'SiteAI es una plataforma de generación de sitios web con inteligencia artificial destinada a negocios locales. El servicio incluye la creación, edición y publicación de sitios web mediante templates y contenido generado automáticamente.',
  },
  {
    title: '3. Cuenta de usuario',
    content:
      'Sos responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta. Debés notificarnos de inmediato ante cualquier uso no autorizado.',
  },
  {
    title: '4. Contenido del usuario',
    content:
      'Sos el único responsable del contenido que subís o publicás a través de SiteAI. No debés subir contenido que infrinja derechos de terceros, sea ilegal, difamatorio o engañoso.',
  },
  {
    title: '5. Planes y pagos',
    content:
      'Los planes pagos se facturan mensualmente. Podés cancelar en cualquier momento desde tu panel de control. No realizamos reembolsos parciales por el período restante del mes en curso, salvo que aplique la garantía de devolución de 30 días.',
  },
  {
    title: '6. Limitación de responsabilidad',
    content:
      'SiteAI se provee "tal cual". No garantizamos disponibilidad ininterrumpida del servicio. No somos responsables por pérdidas de datos, ingresos o cualquier daño indirecto derivado del uso o imposibilidad de uso del servicio.',
  },
  {
    title: '7. Modificaciones',
    content:
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados por email con al menos 15 días de anticipación.',
  },
  {
    title: '8. Ley aplicable',
    content:
      'Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.',
  },
]

export default function TermsPage() {
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
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2">Términos de uso</h1>
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
          <Link href="/privacy" className="hover:text-surface-700 transition-colors">Política de privacidad</Link>
          <span>·</span>
          <Link href="/" className="hover:text-surface-700 transition-colors">Volver al inicio</Link>
        </div>
      </main>
    </div>
  )
}

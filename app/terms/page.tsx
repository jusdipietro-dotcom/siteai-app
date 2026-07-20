import Link from 'next/link'

export const metadata = {
  title: 'Términos de uso',
  description: 'Terminos y condiciones de Automatic IA Lab. Planes, pagos, reembolsos, responsabilidades y legislacion aplicable en Argentina.',
}

const sections = [
  {
    title: '1. Aceptación de los términos',
    content:
      'Al acceder y utilizar Automatic IA Lab, aceptás estos términos de uso en su totalidad. Si no estás de acuerdo con alguna parte, no debés utilizar el servicio.',
  },
  {
    title: '2. Descripción del servicio',
    content:
      'Automatic IA Lab es una plataforma autogestionada de creación de sitios web destinada a negocios locales. El servicio incluye la creación, edición y publicación de sitios web mediante un asistente guiado y plantillas profesionales, a partir de la información que aporta el usuario.',
  },
  {
    title: '3. Cuenta de usuario',
    content:
      'Sos responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta. Debés notificarnos de inmediato ante cualquier uso no autorizado.',
  },
  {
    title: '4. Contenido del usuario',
    content:
      'Sos el único responsable del contenido que subís o publicás a través de Automatic IA Lab. No debés subir contenido que infrinja derechos de terceros, sea ilegal, difamatorio o engañoso.',
  },
  {
    title: '5. Planes y pagos',
    content:
      'Los planes pagos se facturan mensualmente. Podés cancelar en cualquier momento desde tu panel de control. No realizamos reembolsos parciales por el período restante del mes en curso, salvo que aplique la garantía de devolución de 30 días.',
  },
  {
    title: '6. Limitación de responsabilidad',
    content:
      'Automatic IA Lab se provee "tal cual". No garantizamos disponibilidad ininterrumpida del servicio. No somos responsables por pérdidas de datos, ingresos o cualquier daño indirecto derivado del uso o imposibilidad de uso del servicio.',
  },
  {
    title: '7. Modificaciones',
    content:
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados por email con al menos 15 días de anticipación.',
  },
  {
    title: '8. Propiedad intelectual',
    content:
      'El contenido que cargás en tu sitio web es de tu propiedad. La plataforma, su codigo fuente, diseño, marca y documentacion son propiedad exclusiva de Automatic IA Lab. No esta permitido copiar, modificar o distribuir el software de la plataforma sin autorizacion expresa.',
  },
  {
    title: '9. Garantia y reembolsos',
    content:
      'Ofrecemos una garantia de satisfaccion de 30 dias para planes pagos. Si no estas conforme con el servicio dentro de los primeros 30 dias, podes solicitar un reembolso completo escribiendo a automaticialab@gmail.com. Pasado ese plazo, no se realizan reembolsos parciales por el periodo restante.',
  },
  {
    title: '10. Ley aplicable',
    content:
      'Estos terminos se rigen por las leyes de la Republica Argentina, en particular la Ley 24.240 de Defensa del Consumidor y la Ley 25.326 de Proteccion de Datos Personales. Cualquier disputa se sometera a la jurisdiccion de los tribunales ordinarios de la Ciudad Autonoma de Buenos Aires.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Automatic IA Lab" width={32} height={32} className="w-8 h-8 object-contain rounded-xl" />
            <span className="text-lg font-bold text-surface-900">Automatic IA Lab</span>
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

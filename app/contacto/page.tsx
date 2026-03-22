import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Mail, MessageCircle, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto — Automatic IA Lab',
  description: 'Contacta a Automatic IA Lab por email o WhatsApp. Respondemos consultas sobre sitios web, monitoreo judicial y automatizaciones.',
  alternates: { canonical: 'https://automaticialab.com/contacto' },
  openGraph: {
    title: 'Contacto — Automatic IA Lab',
    description: 'Escribinos por email o WhatsApp. Respondemos en menos de 24 horas.',
    url: 'https://automaticialab.com/contacto',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'Automatic IA Lab' }],
  },
}

const channels = [
  {
    icon: Mail,
    title: 'Email',
    desc: 'Escribinos y te respondemos en menos de 24 horas habiles.',
    action: 'automaticialab@gmail.com',
    href: 'mailto:automaticialab@gmail.com',
    cta: 'Enviar email',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    desc: 'Chatea con nosotros directamente. Ideal para consultas rapidas.',
    action: '+54 9 11 0000-0000',
    href: 'https://wa.me/5491100000000?text=Hola%2C%20tengo%20una%20consulta%20sobre%20Automatic%20IA%20Lab',
    cta: 'Abrir WhatsApp',
  },
]

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-surface-950 mb-4">
            Contacto
          </h1>
          <p className="text-lg text-surface-600 leading-relaxed mb-12">
            Estamos para ayudarte. Ya sea que tengas una duda sobre nuestros productos, necesites
            soporte tecnico o quieras explorar una solucion a medida para tu negocio, escribinos
            y te respondemos lo antes posible.
          </p>

          <h2 className="text-2xl font-bold text-surface-950 mb-6">Canales de contacto</h2>
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {channels.map((ch) => (
              <div key={ch.title} className="border border-surface-200 rounded-xl p-6 hover:border-brand-500 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <ch.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">{ch.title}</h3>
                <p className="text-sm text-surface-600 mb-4">{ch.desc}</p>
                <a
                  href={ch.href}
                  target={ch.href.startsWith('https') ? '_blank' : undefined}
                  rel={ch.href.startsWith('https') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  {ch.cta} <span>&#8594;</span>
                </a>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Informacion general</h2>
          <div className="space-y-4 text-surface-600 leading-relaxed mb-12">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-surface-900">Ubicacion</p>
                <p>Buenos Aires, Argentina. Operamos de forma remota atendiendo clientes en todo el pais.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-surface-900">Horario de atencion</p>
                <p>Lunes a viernes de 9:00 a 18:00 (hora Argentina, GMT-3). Consultas fuera de horario se responden al siguiente dia habil.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Preguntas frecuentes antes de contactar</h2>
          <div className="space-y-4 mb-12">
            <div className="bg-surface-50 rounded-xl p-5">
              <h3 className="font-semibold text-surface-900 mb-1">Quiero crear mi sitio web gratis</h3>
              <p className="text-sm text-surface-600">
                No necesitas contactarnos. Registrate directamente en{' '}
                <Link href="/register" className="text-brand-600 hover:text-brand-700 underline">
                  la plataforma
                </Link>{' '}
                y crea tu sitio en minutos.
              </p>
            </div>
            <div className="bg-surface-50 rounded-xl p-5">
              <h3 className="font-semibold text-surface-900 mb-1">Tengo un problema con mi cuenta</h3>
              <p className="text-sm text-surface-600">
                Escribinos por email a automaticialab@gmail.com con tu nombre de usuario y una
                descripcion del problema. Respondemos en menos de 24 horas habiles.
              </p>
            </div>
            <div className="bg-surface-50 rounded-xl p-5">
              <h3 className="font-semibold text-surface-900 mb-1">Necesito una automatizacion a medida</h3>
              <p className="text-sm text-surface-600">
                Contanos que proceso queres automatizar y te armamos una propuesta personalizada.
                Escribinos por email o WhatsApp con los detalles de tu caso.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Nuestro compromiso</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            En Automatic IA Lab nos tomamos en serio cada consulta que recibimos. Nuestro equipo de
            soporte esta formado por personas reales que entienden de tecnologia, automatizacion e
            inteligencia artificial. No vas a hablar con un bot generico: cada respuesta es personalizada
            y pensada para resolver tu situacion concreta.
          </p>
          <p className="text-surface-600 leading-relaxed mb-12">
            Si tu consulta requiere investigacion o una solucion tecnica compleja, te lo vamos a decir
            con transparencia y te daremos un plazo estimado de resolucion. Valoramos tu tiempo tanto
            como el nuestro, y por eso nos esforzamos en resolver cada caso en el menor tiempo posible
            sin sacrificar la calidad de la respuesta.
          </p>

          <div className="flex gap-4 pt-8 border-t border-surface-200">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold rounded-xl transition-colors"
            >
              Sobre nosotros
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold rounded-xl transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

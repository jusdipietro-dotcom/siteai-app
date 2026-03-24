import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Marketing Automatizado',
  description: 'Enviá emails promocionales personalizados a todos tus contactos de forma automática. Sin Mailchimp, sin dólares, pago único. Anti-spam integrado, desuscripción automática y seguimiento en tiempo real.',
  keywords: [
    'email marketing automatizado',
    'email marketing argentina',
    'alternativa mailchimp argentina',
    'email marketing pesos argentinos',
    'email marketing sin dolares',
    'email masivo automatico',
    'email marketing para pymes',
    'email marketing tiendanube',
    'enviar emails masivos gratis',
    'automatic ia lab email marketing',
  ],
  openGraph: {
    title: 'Email Marketing Automatizado | Automatic IA Lab',
    description: 'Enviá emails promocionales personalizados a toda tu base de contactos. Automático, profesional, en pesos.',
    type: 'website',
    url: 'https://automaticialab.com/email-marketing',
  },
}

export default function EmailMarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { GlobalKeyboardShortcuts } from '@/components/shared/GlobalKeyboardShortcuts'
import { Providers } from '@/components/providers/Providers'
import { WhatsAppButton } from '@/components/shared/WhatsAppButton'

export const metadata: Metadata = {
  title: { default: 'Automatic IA Lab — Automatizaciones con IA', template: '%s · Automatic IA Lab' },
  description: 'Plataforma de automatización con IA: creá tu sitio web en minutos, monitoreá notificaciones judiciales y automatizá procesos de tu negocio.',
  keywords: [
    'automatizacion con inteligencia artificial',
    'crear sitio web gratis',
    'generador de sitios web con IA',
    'notificaciones judiciales automaticas',
    'monitoreo judicial Argentina',
    'automatizacion para abogados',
    'pagina web para negocios',
    'automatic ia lab',
  ],
  icons: { icon: '/favicon.ico' },
  robots: 'index, follow',
  verification: { google: 'C1f6_LmId69To22LmPBUOUV_Ys0Gwiu0jdJCbFdkaP0' },
  alternates: {
    canonical: 'https://automaticialab.com',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Automatic IA Lab',
    title: 'Automatic IA Lab — Automatizaciones con IA',
    description: 'Plataforma de automatización con IA: sitios web, monitoreo judicial y más. Todo sin código.',
    url: 'https://automaticialab.com',
    images: [{ url: 'https://automaticialab.com/logo.png', width: 1200, height: 630, alt: 'Automatic IA Lab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automatic IA Lab — Automatizaciones con IA',
    description: 'Plataforma de automatización con IA: sitios web, monitoreo judicial y más. Todo sin código.',
    images: ['https://automaticialab.com/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Analytics — Reemplazar G-KW8GZ3S9DY con tu ID real */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KW8GZ3S9DY" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
              });
              gtag('config', 'G-KW8GZ3S9DY', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <CommandPalette />
          <GlobalKeyboardShortcuts />
          <WhatsAppButton />
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: 'rounded-xl shadow-elevated border border-surface-100 text-sm font-medium',
                success: 'bg-white text-success-700',
                error: 'bg-white text-danger-700',
                warning: 'bg-white text-warning-700',
                info: 'bg-white text-brand-700',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

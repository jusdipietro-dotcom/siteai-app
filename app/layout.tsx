import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { GlobalKeyboardShortcuts } from '@/components/shared/GlobalKeyboardShortcuts'
import { Providers } from '@/components/providers/Providers'

export const metadata: Metadata = {
  title: { default: 'Automatic IA Lab — Generador de Sitios Web', template: '%s · Automatic IA Lab' },
  description: 'Creá sitios web profesionales para tu negocio en minutos, sin saber programar.',
  icons: { icon: '/favicon.ico' },
  verification: { google: 'C1f6_LmId69To22LmPBUOUV_Ys0Gwiu0jdJCbFdkaP0' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Automatic IA Lab',
    title: 'Automatic IA Lab — Generador de Sitios Web',
    description: 'Creá sitios web profesionales para tu negocio en minutos, sin saber programar.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automatic IA Lab — Generador de Sitios Web',
    description: 'Creá sitios web profesionales para tu negocio en minutos, sin saber programar.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <CommandPalette />
          <GlobalKeyboardShortcuts />
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

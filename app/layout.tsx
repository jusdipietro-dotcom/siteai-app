import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { GlobalKeyboardShortcuts } from '@/components/shared/GlobalKeyboardShortcuts'
import { Providers } from '@/components/providers/Providers'
import { WhatsAppButton } from '@/components/shared/WhatsAppButton'

// Self-host Inter via next/font (auto preload + woff2 + no FOUT).
// Replaces the previous @import on Google Fonts which blocked render.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://automaticialab.com'),
  title: {
    default: 'Automatic IA Lab — Automatización IA para PyMEs y Abogados',
    template: '%s · Automatic IA Lab',
  },
  description:
    'Automatización con IA en Argentina. 13 productos para PyMEs y estudios jurídicos: web, monitoreo judicial, prospección B2B, email, reseñas y más.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: undefined,
  robots: 'index, follow',
  verification: { google: 'C1f6_LmId69To22LmPBUOUV_Ys0Gwiu0jdJCbFdkaP0' },
  alternates: {
    canonical: 'https://automaticialab.com',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Automatic IA Lab',
    title: 'Automatic IA Lab — Automatización IA para PyMEs y Abogados',
    description:
      'Automatización con IA en Argentina. 13 productos para PyMEs y estudios jurídicos: web, monitoreo judicial, prospección B2B, email, reseñas y más.',
    url: 'https://automaticialab.com',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Automatic IA Lab — Automatización con IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@automaticialab',
    creator: '@automaticialab',
    title: 'Automatic IA Lab — Automatización IA para PyMEs y Abogados',
    description:
      'Automatización con IA en Argentina. 13 productos para PyMEs y estudios jurídicos: web, monitoreo judicial, prospección B2B, email, reseñas y más.',
    images: ['/og-image.png'],
  },
}

export const viewport = {
  themeColor: '#0099ff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
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

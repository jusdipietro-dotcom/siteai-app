import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LinkedIn Optimizer IA',
  description: 'Optimiza tu perfil de LinkedIn y genera publicaciones de alto impacto con inteligencia artificial.',
  openGraph: {
    title: 'LinkedIn Optimizer IA — Automatic IA Lab',
    description: 'Optimiza tu perfil de LinkedIn y genera publicaciones de alto impacto con inteligencia artificial.',
    url: 'https://automaticialab.com/linkedin',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'LinkedIn Optimizer IA — Automatic IA Lab' }],
  },
  alternates: { canonical: 'https://automaticialab.com/linkedin' },
}

export default function LinkedInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

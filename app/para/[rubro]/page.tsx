import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { rubros } from '@/data/rubros'
import { RubroContent } from './RubroContent'

interface PageProps {
  params: {
    rubro: string
  }
}

export function generateStaticParams() {
  return rubros.map((rubro) => ({
    rubro: rubro.slug,
  }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const rubro = rubros.find((r) => r.slug === params.rubro)

  if (!rubro) {
    return { title: 'No encontrado' }
  }

  return {
    title: rubro.heroTitle,
    description: rubro.description,
    keywords: rubro.keywords,
    alternates: {
      canonical: `https://automaticialab.com/para/${rubro.slug}`,
    },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      siteName: 'Automatic IA Lab',
      title: rubro.heroTitle,
      description: rubro.description,
      url: `https://automaticialab.com/para/${rubro.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: rubro.heroTitle,
      description: rubro.description,
    },
  }
}

export default function RubroPage({ params }: PageProps) {
  const rubro = rubros.find((r) => r.slug === params.rubro)

  if (!rubro) {
    notFound()
  }

  const otherRubros = rubros.filter((r) => r.slug !== params.rubro).slice(0, 3)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Creador de Sitios Web para ${rubro.name}`,
    description: rubro.description,
    url: `https://automaticialab.com/para/${rubro.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Automatic IA Lab',
      url: 'https://automaticialab.com',
    },
    keywords: rubro.keywords.join(', '),
  }

  const schemas = [schema]

  // Add monitoreo product schema for abogados cross-sell
  if (rubro.crossSell) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product' as const,
      name: rubro.crossSell.title,
      description: rubro.crossSell.description,
      url: `https://automaticialab.com${rubro.crossSell.ctaHref}`,
      provider: {
        '@type': 'Organization',
        name: 'Automatic IA Lab',
        url: 'https://automaticialab.com',
      },
      keywords: '',
    } as typeof schema)
  }

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <div className="min-h-screen bg-white">
        <Navbar />
        <RubroContent rubro={rubro} otherRubros={otherRubros} />
        <Footer />
      </div>
    </>
  )
}

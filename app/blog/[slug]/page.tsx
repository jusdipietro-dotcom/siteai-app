import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { blogPosts } from '@/data/blog-posts'
import { Calendar, Clock, Tag, ArrowLeft } from 'lucide-react'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import { JsonLd } from '@/components/seo/JsonLd'

interface PageProps {
  params: {
    slug: string
  }
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

// Generate metadata for each post
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug)

  if (!post) {
    return {
      title: 'Artículo no encontrado',
    }
  }

  const url = `https://automaticialab.com/blog/${post.slug}`
  return {
    title: { absolute: post.title },
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      images: [{ url: post.ogImage || 'https://automaticialab.com/logo.png' }],
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export default function BlogPostPage({ params }: PageProps) {
  const post = blogPosts.find((p) => p.slug === params.slug)

  if (!post) {
    notFound()
  }

  const postDate = new Date(post.date)
  const formattedDate = postDate.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.ogImage || 'https://automaticialab.com/og-image.png',
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Automatic IA Lab',
      logo: { '@type': 'ImageObject', url: 'https://automaticialab.com/logo.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://automaticialab.com/blog/${post.slug}`,
    },
  }

  return (
    <main className="min-h-screen bg-white">
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: 'https://automaticialab.com' },
          { name: 'Blog', url: 'https://automaticialab.com/blog' },
          { name: post.title, url: `https://automaticialab.com/blog/${post.slug}` },
        ]}
      />
      <JsonLd data={articleSchema} />
      <Navbar />

      {/* Back Link */}
      <div className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {/* Category */}
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold text-surface-950 mb-6">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-surface-600 pb-6 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <span className="font-medium">Por {post.author}</span>
              </div>
              <div className="hidden sm:block text-surface-300">•</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>{formattedDate}</time>
              </div>
              <div className="hidden sm:block text-surface-300">•</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div
              className="text-surface-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-brand-500/10 to-brand-600/10 border border-brand-200 rounded-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-surface-950 mb-3">
              ¿Listo para crear tu sitio web?
            </h3>
            <p className="text-surface-600 mb-6">
              Dejá que la IA construya tu presencia online en minutos. Crea tu sitio
              web profesional sin código, sin diseñadores, sin complicaciones.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Crear sitio gratis
              <span>→</span>
            </Link>
          </div>

          {/* Related Posts */}
          {blogPosts.length > 1 && (
            <div className="border-t border-surface-200 pt-12">
              <h3 className="text-2xl font-bold text-surface-950 mb-6">
                Más artículos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {blogPosts
                  .filter((p) => p.slug !== post.slug)
                  .slice(0, 2)
                  .map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/blog/${relatedPost.slug}`}
                      className="group"
                    >
                      <div className="border border-surface-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-md transition-all">
                        <div className="flex items-start gap-2 mb-2">
                          <Tag className="w-3.5 h-3.5 text-brand-500 mt-1 flex-shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                            {relatedPost.category}
                          </span>
                        </div>
                        <h4 className="font-semibold text-surface-950 group-hover:text-brand-600 transition-colors mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-surface-500 line-clamp-2">
                          {relatedPost.description}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.description,
            image: post.ogImage || 'https://automaticialab.com/logo.png',
            datePublished: post.date,
            author: {
              '@type': 'Organization',
              name: post.author,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Automatic IA Lab',
              logo: {
                '@type': 'ImageObject',
                url: 'https://automaticialab.com/logo.png',
              },
            },
          }),
        }}
      />

      <div className="mt-16">
        <Footer />
      </div>
    </main>
  )
}

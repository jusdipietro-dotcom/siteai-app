import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { blogPosts } from '@/data/blog-posts'
import { Calendar, Clock, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | Tips para tu Negocio Online',
  description: 'Consejos, guías y estrategias para hacer crecer tu negocio online. Aprende sobre marketing digital, SEO, sitios web y más.',
  keywords: ['blog', 'marketing digital', 'sitio web', 'negocios online', 'SEO', 'consejos'],
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-surface-950 mb-4">
            Blog
          </h1>
          <p className="text-xl text-surface-600">
            Tips, guías y estrategias para hacer crecer tu negocio online
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="group border border-surface-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-brand-500"
              >
                {/* Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/80 to-brand-600/80 group-hover:opacity-90 transition-opacity" />
                  <div className="relative text-white text-center px-4">
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-75">
                      {post.category}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-xl font-bold text-surface-950 mb-3 group-hover:text-brand-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>

                  {/* Description */}
                  <p className="text-surface-600 text-sm mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-surface-500 mb-4 pb-4 border-b border-surface-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* CTA Link */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 group/link"
                  >
                    Leer más
                    <span className="ml-2 group-hover/link:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-500 to-brand-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para crear tu sitio web?
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            Dejá que la IA construya tu presencia online en minutos, no semanas.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-600 font-semibold rounded-lg hover:bg-surface-50 transition-colors"
          >
            Empezar gratis
            <span>→</span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}

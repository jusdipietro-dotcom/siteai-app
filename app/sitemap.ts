import { MetadataRoute } from 'next'
import { blogPosts } from '@/data/blog-posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://automaticialab.com'

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const now = new Date()
  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },

    // Vertical landings (high SEO value)
    { url: `${baseUrl}/automatizacion-para-abogados`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
    { url: `${baseUrl}/premium`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },

    // Servicios a medida
    { url: `${baseUrl}/servicios/diseno-web`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${baseUrl}/servicios/seo`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${baseUrl}/servicios/email-marketing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/servicios/prospeccion`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Blog
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...blogEntries,

    // Testimonios (social proof + GBP funnel)
    { url: `${baseUrl}/testimonios`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Otros
    { url: `${baseUrl}/recursos`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/gratis`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/leads`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    // Legal
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}

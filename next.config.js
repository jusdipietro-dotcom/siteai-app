/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un build autónomo (carpeta .next/standalone) ideal para VPS con Node/PM2.
  // En Vercel esto no hace falta y puede ignorarse — Vercel detecta Next.js automáticamente.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  async redirects() {
    return [
      {
        // Permanent 301 redirect www -> non-www (canonical host).
        source: '/:path*',
        has: [{ type: 'host', value: 'www.automaticialab.com' }],
        destination: 'https://automaticialab.com/:path*',
        permanent: true,
      },
      // Legacy SaaS auto-product URLs → /contacto (agency model now).
      // /admin/* and /(dashboard)/* keep working (auth-gated, internal use).
      { source: '/gratis', destination: '/contacto', permanent: true },
      { source: '/recursos', destination: '/contacto', permanent: true },
      { source: '/leads', destination: '/contacto', permanent: true },
      { source: '/servicios/email-marketing', destination: '/servicios/marketing-digital', permanent: true },
      { source: '/servicios/prospeccion', destination: '/servicios/marketing-digital', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com https://api.automaticialab.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/:path*.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.css',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.jpg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Necesario para que Prisma funcione en edge/serverless en Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    instrumentationHook: true,
  },

  // Type errors fail the build. The Dockerfile runs `next build`, so a type
  // error now stops the container image from being produced instead of
  // reaching production unnoticed.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un build autónomo (carpeta .next/standalone) ideal para VPS con Node/PM2.
  // En Vercel esto no hace falta y puede ignorarse — Vercel detecta Next.js automáticamente.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

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
  },
}

module.exports = nextConfig

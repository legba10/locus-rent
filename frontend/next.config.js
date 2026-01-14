/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.locus.ru'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  // Оптимизация производительности
  experimental: {
    optimizePackageImports: ['lucide-react', 'mapbox-gl'],
  },
  // Компрессия
  compress: true,
  // Оптимизация сборки
  swcMinify: true,
  // Оптимизация загрузки
  poweredByHeader: false,
}

module.exports = nextConfig

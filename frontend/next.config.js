/** @type {import('next').NextConfig} */
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://pulsetoob-cms.onrender.com/api')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pulsetoob-cms.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'pulsetoob.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pulsetoob.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/rss/:path*',
        destination: `${apiBaseUrl}/api/rss/:path*`,
      },
    ]
  },
}
module.exports = nextConfig

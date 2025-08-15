/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async redirects() {
    return [
      {
        source: '/heic-to-jpeg',
        destination: '/convert-heic-to-jpg',
        permanent: true,
      },
      {
        source: '/free-heic-converter',
        destination: '/',
        permanent: true,
      },
      // Language-specific redirects
      {
        source: '/es',
        destination: '/es/heic-a-jpg',
        permanent: true,
      },
      {
        source: '/de',
        destination: '/de/heic-zu-jpg',
        permanent: true,
      },
      {
        source: '/pl',
        destination: '/pl/heic-na-jpg',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
}

module.exports = nextConfig 
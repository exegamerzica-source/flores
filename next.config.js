/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/api/home',
      },
      {
        source: '/produto/:id',
        destination: '/api/produto/:id',
      },
    ]
  },
}

module.exports = nextConfig

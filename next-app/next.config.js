/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/api/home',
      },
    ]
  },
}

module.exports = nextConfig

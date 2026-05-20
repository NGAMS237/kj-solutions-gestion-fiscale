/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://backend:4000';
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};
module.exports = nextConfig;

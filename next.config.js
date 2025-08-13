/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed static export so API routes can run in server mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;

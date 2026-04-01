/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output bundles only the necessary files for production.
  // Required for the Docker production image.
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Serve modern formats — browser falls back to webp/jpeg automatically
    formats: ['image/avif', 'image/webp'],
    // Responsive breakpoint sizes used for srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimised images for 7 days
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  transpilePackages: ['@app/shared'],
};

module.exports = nextConfig;

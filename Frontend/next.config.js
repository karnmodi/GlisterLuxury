/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // ESLint configuration for builds
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
    // Allow production builds to complete with warnings (not errors)
    // Set to true to skip ESLint entirely during builds
    ignoreDuringBuilds: true,
  },
  // TypeScript check during build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig

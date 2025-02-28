/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile pictures
  },
  // If you need to add more domains for images, add them here
  // If this is set to true, change it to false
  // experimental: {
  //   appDir: false
  // }
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "buffer": require.resolve("buffer/"),
    };
    return config;
  },
  typescript: {
    // Ignore TypeScript errors in production builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors in production builds
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 
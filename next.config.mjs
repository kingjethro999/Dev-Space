/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Webpack config for webpack bundler (used with --webpack flag)
  webpack: (config, { isServer }) => {
    // Externalize we-encrypt for client bundles since it's Node.js only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      // Mark we-encrypt as external in client bundles
      config.externals = config.externals || [];
      config.externals.push('we-encrypt');
    }
    return config;
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {
    // Empty config to silence warning - Turbopack automatically handles
    // Node.js modules and won't bundle we-encrypt for client by default
    // since we use 'server-only' package and dynamic requires
  },
}

export default nextConfig

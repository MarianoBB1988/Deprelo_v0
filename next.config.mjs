/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    'jspdf',
    'jspdf-autotable', 
    'xlsx',
    'bcrypt',
    'mysql2'
  ],
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    }
  },
  webpack: (config, { isServer }) => {
    // Solo aplicar configuración webpack si no es Turbopack
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        'node-gyp-build': false,
        'bcrypt': false,
        'mysql2': false,
        'net': false,
        'tls': false,
        'timers': false,
        'events': false,
      }
    }
    
    return config
  },
}

export default nextConfig
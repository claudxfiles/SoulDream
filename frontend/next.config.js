/** @type {import('next').NextConfig} */
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');
const crypto = require('crypto');

const nextConfig = {
  transpilePackages: ['agent-base', 'googleapis', 'google-auth-library', 'gaxios', 'google-logging-utils', 'gcp-metadata'],
  
  // Configuración para redirigir solicitudes API al backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*', // Backend running on port 8080
      },
    ];
  },
  
  // Definir variables de entorno públicas
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.presentandflow.cl' 
      : 'http://localhost:8080',
  },
  
  // Optimización de chunks y carga
  webpack: (config, { isServer, dev }) => {
    // Solo aplicamos los polyfills en el cliente, no en el servidor
    if (!isServer) {
      config.plugins.push(
        new NodePolyfillPlugin({
          excludeAliases: ['console', 'http', 'https', 'zlib'],
        }),
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Configuración de fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        http2: false,
        events: require.resolve('events/'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        path: require.resolve('path-browserify'),
      };

      // Optimización de chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = crypto.createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return crypto
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },

  eslint: {
    // Desactivar la verificación de ESLint durante la construcción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desactivar la verificación de tipos durante la construcción
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  
  // Configuración de producción
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;

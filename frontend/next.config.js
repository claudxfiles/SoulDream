/** @type {import('next').NextConfig} */
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');

const nextConfig = {
  transpilePackages: ['agent-base', 'googleapis', 'google-auth-library', 'gaxios', 'google-logging-utils', 'gcp-metadata'],
  
  // Configuración para redirigir solicitudes API al backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Asumiendo que el backend corre en el puerto 8000
      },
    ];
  },
  
  // Definir variables de entorno públicas
  env: {
    NEXT_PUBLIC_BACKEND_URL: 'http://localhost:8000',
  },
  
  webpack: (config, { isServer }) => {
    // Solo aplicamos los polyfills en el cliente, no en el servidor
    if (!isServer) {
      // Configuramos los polyfills con un enfoque menos invasivo
      // (no modificamos la entrada directamente para evitar problemas de hot-reload)
      
      // Añadir plugin para polyfills de Node.js de forma más segura
      config.plugins.push(
        new NodePolyfillPlugin({
          // No incluir polyfills innecesarios
          excludeAliases: ['console', 'http', 'https', 'zlib'],
        }),
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        // Definir explícitamente los módulos que usamos en polyfills
        new webpack.NormalModuleReplacementPlugin(
          /^node:(.*)/,
          (resource) => {
            const mod = resource.request.replace(/^node:/, '');
            switch (mod) {
              case 'events':
                resource.request = 'events';
                break;
              case 'process':
                resource.request = 'process/browser';
                break;
              case 'stream':
                resource.request = 'stream-browserify';
                break;
              case 'buffer':
                resource.request = 'buffer';
                break;
              case 'util':
                resource.request = 'util';
                break;
              case 'path':
                resource.request = 'path-browserify';
                break;
            }
          }
        )
      );

      // Configuración de fallbacks para módulos de Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        http2: false, // Cambiado a false en lugar de un polyfill personalizado
        events: require.resolve('events/'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        path: require.resolve('path-browserify'),
      };

      // Alias para node: imports de manera más limpia
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:events': require.resolve('events/'),
        'node:process': require.resolve('process/browser'),
        'node:stream': require.resolve('stream-browserify'),
        'node:buffer': require.resolve('buffer/'),
        'node:util': require.resolve('util/'),
        'node:path': require.resolve('path-browserify'),
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
};

module.exports = nextConfig;

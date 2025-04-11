// Configuración de APIs y URLs
export const API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('http://', 'https://') 
  : 'https://api.presentandflow.cl';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? process.env.NEXT_PUBLIC_BACKEND_URL.replace('http://', 'https://')
  : 'https://api.presentandflow.cl';

// Asegurarse de que siempre usamos HTTPS en producción
export const ensureHttps = (url: string): string => {
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}; 
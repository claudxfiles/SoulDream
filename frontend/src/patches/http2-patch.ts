// Mock básico para el módulo http2 que se usa en googleapis-common
// Este es un mock mínimo que permite que el código compile

const http2Mock = {
  connect: () => {
    throw new Error('http2.connect no está disponible en el navegador');
  },
  constants: {
    HTTP2_HEADER_METHOD: ':method',
    HTTP2_HEADER_PATH: ':path',
    HTTP2_HEADER_AUTHORITY: ':authority',
    HTTP2_HEADER_SCHEME: ':scheme',
    HTTP2_HEADER_STATUS: ':status',
    HTTP2_HEADER_CONTENT_TYPE: 'content-type',
    HTTP2_HEADER_CONTENT_LENGTH: 'content-length',
    HTTP2_HEADER_ACCEPT: 'accept',
  }
};

// Asignar al global para que esté disponible
(globalThis as any).http2 = http2Mock;

// Si alguna importación intenta usar 'http2', redirigirla a nuestro mock
if (typeof window !== 'undefined') {
  const originalRequire = (window as any).require || (() => {
    throw new Error('Module not found');
  });
  
  (window as any).require = (name: string) => {
    if (name === 'http2') {
      return http2Mock;
    }
    return originalRequire(name);
  };
}

export default http2Mock; 
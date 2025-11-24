// Configuración de la aplicación

// Helper para determinar la URL base de la API dinámicamente
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // Lado del servidor, usar la variable de entorno o el default para localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  // Lado del cliente, construir la URL para evitar problemas de contenido mixto
  // Asume que la API está en el puerto 5000 del mismo host.
  // Reemplaza el puerto del frontend (e.g. 9002) por el puerto de la API (5000).
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;

  // Si el host es localhost, mantenemos http y el puerto 5000.
  if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    return 'http://localhost:5000';
  }
  
  // Para entornos de producción/despliegue, usar https y el puerto 5000.
  // Esto asume que el backend está expuesto en el mismo dominio pero en el puerto 5000 y con HTTPS.
  return `${protocol}//${currentHost.replace(/:\d+$/, '')}:5000`;
};

export const config = {
  get apiUrl() {
    return getApiUrl();
  },
  apiBasePath: '/api',
  get apiBaseUrl() {
    return `${this.apiUrl}${this.apiBasePath}`;
  },
  // Configuración AR
  ar: {
    defaultScale: {
      '3d-model': 0.015,
      video: 0.5,
      image: 1,
    },
    camera: {
      facingMode: 'environment' as const,
      idealWidth: 1920,
      idealHeight: 1080,
    },
  },
} as const;

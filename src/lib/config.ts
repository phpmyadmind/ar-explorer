// Configuración de la aplicación

// Helper para determinar la URL base de la API dinámicamente
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // Lado del servidor, usar la variable de entorno o el default para producción
    return process.env.NEXT_PUBLIC_API_URL || 'https://ar.cardio-adium.com';
  }
  
  // Lado del cliente, construir la URL para evitar problemas de contenido mixto
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;

  // Si el host es localhost, mantenemos http y el puerto 5000.
  if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    return 'http://localhost:5000';
  }
  
  // Para cualquier otro entorno (producción/despliegue), usar la URL base de producción.
  return 'https://ar.cardio-adium.com';
};

export const config = {
  get apiUrl() {
    return getApiUrl();
  },
  apiBasePath: '/api',
  get apiBaseUrl() {
    // La URL base para las llamadas a la API ya incluye '/api' en muchos casos,
    // así que construimos la URL de recursos aquí para evitar duplicación.
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

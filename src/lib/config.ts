// Configuración de la aplicación
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
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


/**
 * Servicio para cargar recursos AR desde local o base de datos
 */

import { config } from './config';

/**
 * Obtiene la URL completa del recurso
 * @param resourceUrl - URL relativa del recurso (ej: /uploads/file.mp4)
 * @returns URL completa del recurso
 */
export const getResourceUrl = (resourceUrl: string | null): string | null => {
  if (!resourceUrl) return null;
  
  // Si ya es una URL completa, retornarla
  if (resourceUrl.startsWith('http://') || resourceUrl.startsWith('https://')) {
    return resourceUrl;
  }
  
  // Si es una data URL base64, retornarla directamente
  if (resourceUrl.startsWith('data:')) {
    return resourceUrl;
  }
  
  // Si es una ruta relativa (ej: /uploads/file.mp4), construir la URL completa
  // Usar config.apiUrl directamente, no apiBaseUrl (que incluye /api)
  if (resourceUrl.startsWith('/')) {
    return `${config.apiUrl}${resourceUrl}`;
  }
  
  return `${config.apiUrl}/${resourceUrl}`;
};

/**
 * Verifica si un recurso existe localmente
 * @param resourceUrl - URL del recurso
 * @returns Promise<boolean>
 */
export const checkLocalResource = async (resourceUrl: string): Promise<boolean> => {
  try {
    const fullUrl = getResourceUrl(resourceUrl);
    if (!fullUrl) return false;
    const response = await fetch(fullUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Interfaz para recursos AR
 */
export interface ARResource {
  content_base64?: string | null;
  content_url?: string | null;
  type?: string;
  name?: string;
}

/**
 * Carga un recurso desde la base de datos usando content_url
 * @param resource - Objeto del recurso con content_url o string con URL
 * @returns Promise<string> URL del recurso cargado
 */
export const loadResource = async (resource: ARResource | string): Promise<string> => {
  if (!resource) {
    throw new Error('Recurso no válido');
  }

  // Si es un string, tratarlo como URL directa
  if (typeof resource === 'string') {
    // Si ya es una URL completa o data URL, retornarla
    if (resource.startsWith('http://') || resource.startsWith('https://') || resource.startsWith('data:')) {
      return resource;
    }
    // Construir URL completa si es relativa
    return getResourceUrl(resource) || resource;
  }

  // Usar siempre content_url de la base de datos
  if (resource.content_url) {
    console.log('📁 Cargando recurso desde content_url:', resource.content_url);
    const resourceUrl = getResourceUrl(resource.content_url);
    
    if (!resourceUrl) {
      throw new Error('URL del recurso no válida');
    }

    return resourceUrl;
  }

  throw new Error('Recurso sin content_url disponible');
};

/**
 * Obtiene el tipo de archivo basado en la extensión o MIME type
 * @param url - URL del archivo o data URL base64
 * @returns Tipo de archivo (image, video, 3d-model)
 */
export const getFileType = (url: string | null | undefined): 'image' | 'video' | '3d-model' | 'unknown' => {
  if (!url) return 'unknown';
  
  // Si es una data URL base64, extraer el MIME type
  if (url.startsWith('data:')) {
    const mimeMatch = url.match(/data:([^;]+)/);
    if (mimeMatch) {
      const mimeType = mimeMatch[1];
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.includes('gltf') || mimeType.includes('glb')) return '3d-model';
    }
  }
  
  // Si es una URL normal, usar la extensión
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return 'image';
  }
  
  if (['mp4', 'mov', 'webm', 'ogg'].includes(extension)) {
    return 'video';
  }
  
  if (['glb', 'gltf'].includes(extension)) {
    return '3d-model';
  }
  
  return 'unknown';
};

/**
 * Valida si el formato de archivo es soportado
 * @param url - URL del archivo
 * @returns boolean
 */
export const isSupportedFormat = (url: string | null | undefined): boolean => {
  const type = getFileType(url);
  return type !== 'unknown';
};


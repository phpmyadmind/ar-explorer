import { useState, useEffect, useCallback } from 'react';
import type { Model } from '@/lib/models';
import { staticModels } from '@/lib/models';
import { config } from '@/lib/config';
import { getAuthHeaders } from '@/lib/auth';

interface UseARModelsReturn {
  models: Model[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useARModels(): UseARModelsReturn {
  const [models, setModels] = useState<Model[]>(staticModels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener headers con token (se genera automáticamente si no existe)
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        console.error('❌ No Authorization header available');
        throw new Error('No authorization token available');
      }
      
      const apiUrl = `${config.apiUrl}/api/resources`;
      console.log('🔍 Fetching resources from:', apiUrl);
      console.log('🔐 Headers:', { ...headers, Authorization: 'Bearer ***' });
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: headers,
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.status === 401) {
        // Token might be expired, clear it and try to generate a new one
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ar_token');
          // Intentar obtener un nuevo token y reintentar una vez
          try {
            const newHeaders = await getAuthHeaders();
            const retryResponse = await fetch(apiUrl, {
              cache: 'no-store',
              headers: newHeaders,
            });
            if (retryResponse.ok) {
              // Si el reintento fue exitoso, continuar con el procesamiento normal
              const retryData = await retryResponse.json();
              // Reutilizar el código de formateo que está más abajo
              const formattedModels: Model[] = retryData.map((item: any) => {
                let contentPath = item.content_url;
                if (!contentPath) {
                  console.warn(`Resource ${item.uuid} has no content_url`);
                  return null;
                }
                if (contentPath.startsWith('http://') || contentPath.startsWith('https://')) {
                  // Full URL, use as is
                } else if (contentPath.startsWith('/')) {
                  contentPath = `${config.apiUrl}${contentPath}`;
                } else {
                  contentPath = `${config.apiUrl}/${contentPath}`;
                }
                return {
                  id: item.uuid,
                  name: item.name,
                  path: contentPath,
                  previewImage: item.qr_code_url?.startsWith('http')
                    ? item.qr_code_url
                    : `${config.apiUrl}${item.qr_code_url}`,
                  scale: item.type === '3d-model' ? 0.015 : item.type === 'video' ? 0.5 : 1,
                  description: item.description || item.name,
                  type: item.type,
                  url: `/ar-viewer?model=${item.uuid}`,
                };
              }).filter((model): model is Model => model !== null);
              const allModels = [...formattedModels, ...staticModels];
              setModels(allModels);
              setLoading(false);
              return;
            }
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }
        throw new Error('Authentication failed (token may be expired). Please reload.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Backend not available (${response.status}). Falling back to static content.`);
      }

      const data = await response.json();
      console.log('✅ Received resources:', data.length, 'items');
      
      const formattedModels: Model[] = data.map((item: any) => {
        let contentPath = item.content_url;
        
        if (!contentPath) {
          console.warn(`Resource ${item.uuid} has no content_url`);
          return null;
        }
        
        if (contentPath.startsWith('http://') || contentPath.startsWith('https://')) {
          // Full URL, use as is
        } else if (contentPath.startsWith('/')) {
          contentPath = `${config.apiUrl}${contentPath}`;
        } else {
          contentPath = `${config.apiUrl}/${contentPath}`;
        }
        
        return {
          id: item.uuid,
          name: item.name,
          path: contentPath,
          previewImage: item.qr_code_url?.startsWith('http')
            ? item.qr_code_url
            : `${config.apiUrl}${item.qr_code_url}`,
          scale: item.type === '3d-model' ? 0.015 : item.type === 'video' ? 0.5 : 1,
          description: item.description || item.name,
          type: item.type,
          url: `/ar-viewer?model=${item.uuid}`,
        };
      }).filter((model): model is Model => model !== null);

      console.log('📦 Formatted models:', formattedModels.length, 'from API');
      const allModels = [...formattedModels, ...staticModels];
      
      setModels(allModels);
    } catch (err: any) {
      console.error('❌ Error fetching models:', err.message);
      console.error('❌ Error details:', err);
      setError(`Could not connect to the backend (${err.message}). Displaying static models only.`);
      setModels(staticModels);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // We rely on AuthProvider to be ready first.
    // A small delay to ensure localStorage is populated.
    setTimeout(() => {
        fetchModels();
    }, 100);
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
}

import { useState, useEffect, useCallback } from 'react';
import type { Model } from '@/lib/models';
import { staticModels } from '@/lib/models';
import { config } from '@/lib/config';

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
      const apiUrl = `${config.apiBaseUrl}/resources`;
      console.log('🔍 Fetching resources from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Backend not available (${response.status}). Falling back to static content.`);
      }

      const data = await response.json();
      console.log('✅ Received resources:', data.length, 'items');
      
      const formattedModels: Model[] = data.map((item: any) => {
        // Usar siempre content_url de la base de datos
        let contentPath = item.content_url;
        
        if (!contentPath) {
          console.warn(`Resource ${item.uuid} has no content_url`);
          return null;
        }
        
        // Construir URL completa si es relativa
        if (contentPath.startsWith('http://') || contentPath.startsWith('https://')) {
          // URL completa, usar tal cual
          contentPath = contentPath;
        } else if (contentPath.startsWith('/')) {
          // URL relativa que empieza con /
          contentPath = `${config.apiUrl}${contentPath}`;
        } else {
          // URL relativa sin /
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
          url: `/?model=${item.uuid}`,
        };
      }).filter((model): model is Model => model !== null);

      console.log('📦 Formatted models:', formattedModels.length, 'from API');
      console.log('📦 Static models:', staticModels.length);
      const allModels = [...formattedModels, ...staticModels];
      console.log('📦 Total models:', allModels.length);
      
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
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
}


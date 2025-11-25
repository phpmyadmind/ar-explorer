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

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ar_token') : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export function useARModels(): UseARModelsReturn {
  const [models, setModels] = useState<Model[]>(staticModels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${config.apiUrl}/api/resources`;
      console.log('🔍 Fetching resources from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: getAuthHeaders(),
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.status === 401) {
        if (typeof window !== 'undefined') window.location.href = '/'; // Redirect to login
        throw new Error('Authentication failed. Please log in.');
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
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
}

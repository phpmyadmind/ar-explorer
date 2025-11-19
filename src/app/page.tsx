'use client';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { CameraView } from '@/components/ar-explorer/camera-view';
import { ModelSelector } from '@/components/ar-explorer/model-selector';
import { type Model, staticModels } from '@/lib/models';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import the ARViewer component with SSR disabled
const ARViewer = dynamic(() => import('@/components/ar-explorer/ar-viewer').then(mod => mod.ARViewer), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
});


const API_URL = 'http://localhost:5000/api';

export default function HomePage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const modelIdFromUrl = searchParams.get('model');

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/resources`);
      if (!response.ok) {
        throw new Error('Backend not available');
      }
      const data = await response.json();
      const formattedModels: Model[] = data.map((item: any) => ({
        id: item.uuid,
        name: item.name,
        path: `http://localhost:5000${item.content_url}`,
        previewImage: `http://localhost:5000${item.qr_code_url}`,
        scale: item.type === '3d-model' ? 0.015 : 1, // Escala por defecto
        description: item.name,
        type: item.type,
        url: `/?model=${item.uuid}`,
      }));
      setModels(formattedModels);

    } catch (err) {
      console.warn('Failed to fetch from backend, falling back to static models.');
      setModels(staticModels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (models.length > 0) {
      if (modelIdFromUrl) {
        const model = models.find(m => m.id === modelIdFromUrl) || null;
        setSelectedModel(model);
      } else {
        setSelectedModel(models[0]);
      }
    }
  }, [modelIdFromUrl, models]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    window.history.pushState({}, '', `/?model=${model.id}`);
  };
  
  if (loading) {
    return (
      <div className="flex h-svh w-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
       <div className="flex h-svh w-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-red-500 flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-8">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="font-semibold text-lg">An Error Occurred</p>
              <p className="text-center">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchModels}>Try Again</Button>
          </div>
        </main>
       </div>
    );
  }

  return (
    <div className="flex h-svh w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top part: Camera and AR view (takes most of the space) */}
        <div className="relative flex-1 mt-[15vh]">
          <CameraView />
          <ARViewer model={selectedModel} />
        </div>

        {/* Bottom part: Scrollable model selector */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] md:h-[40%] border-t bg-muted/40 backdrop-blur-sm">
           <ModelSelector models={models} selectedModelId={selectedModel?.id ?? null} onSelectModel={handleSelectModel} />
        </div>
      </main>
    </div>
  );
}
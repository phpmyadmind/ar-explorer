'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { ARViewer } from '@/components/ar-explorer/ar-viewer';
import { CameraView } from '@/components/ar-explorer/camera-view';
import { ModelSelector } from '@/components/ar-explorer/model-selector';
import { type Model, staticModels } from '@/lib/models';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const API_URL = 'http://localhost:5000/api';

function HomePageContent() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
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
      setIsOnline(true);

    } catch (err) {
      console.warn('Failed to fetch from backend, falling back to static models.');
      setModels(staticModels);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    // This logic needs to run after models are set, either from API or static fallback
    if (models.length > 0) {
      if (modelIdFromUrl) {
        const model = models.find(m => m.id === modelIdFromUrl) || null;
        setSelectedModel(model);
      } else {
        // If no model is in the URL, select the first one by default
        setSelectedModel(models[0]);
      }
    }
  }, [modelIdFromUrl, models]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    // Update URL without reloading page
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

  // Error is now reserved for critical unhandled errors, not for backend connection.
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
      <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left side: Camera + AR Viewer */}
        <div className="flex flex-1 flex-col h-full md:w-1/2">
            <div className="relative h-[30%] md:h-1/2">
                <CameraView />
            </div>
            <Separator />
            <div className="relative flex-1 h-[70%] md:h-1/2 bg-muted/20">
                <ARViewer model={selectedModel} />
            </div>
        </div>

        {/* Right side: Scrollable model selector */}
        <div className="flex-1 border-t md:border-t-0 md:border-l bg-muted/40 h-full md:w-1/2">
           <ModelSelector models={models} selectedModelId={selectedModel?.id ?? null} onSelectModel={handleSelectModel} />
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    // Suspense is required for useSearchParams
    <Suspense fallback={<div className="flex h-svh w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <HomePageContent />
    </Suspense>
  );
}

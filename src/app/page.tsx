'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { ARViewer } from '@/components/ar-explorer/ar-viewer';
import { ModelSelector } from '@/components/ar-explorer/model-selector';
import { type Model } from '@/lib/models';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = 'http://localhost:5000/api';

function HomePageContent() {
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
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const formattedModels: Model[] = data.map((item: any) => ({
        id: item.uuid,
        name: item.name,
        path: `http://localhost:5000${item.content_url}`,
        // La API no provee una imagen de vista previa, así que usamos el QR.
        previewImage: `http://localhost:5000${item.qr_code_url}`,
        scale: item.type === '3d-model' ? 0.015 : 1, // Escala por defecto
        description: item.name,
        type: item.type,
        url: `/?model=${item.uuid}`,
      }));
      setModels(formattedModels);

    } catch (err) {
      setError('Failed to fetch models. Make sure the backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (modelIdFromUrl && models.length > 0) {
      const model = models.find(m => m.id === modelIdFromUrl) || null;
      setSelectedModel(model);
    }
  }, [modelIdFromUrl, models]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
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
      <main className="relative flex-1 overflow-hidden">
        <ARViewer model={selectedModel} />
        <ModelSelector models={models} selectedModelId={selectedModel?.id ?? null} onSelectModel={handleSelectModel} />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    // Suspense is required for useSearchParams
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

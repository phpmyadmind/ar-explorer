// src/app/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { type Model, staticModels } from '@/lib/models';
import { Loader2, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ARViewer = dynamic(() => import('@/components/ar-explorer/ar-viewer').then(mod => mod.ARViewer), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
});

const API_URL = 'http://localhost:5000/api';

function HomePageContent() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const modelIdFromUrl = searchParams.get('model');

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/resources`);
        if (!response.ok) {
          throw new Error('Backend not available. Falling back to static content.');
        }
        const data = await response.json();
        const formattedModels: Model[] = data.map((item: any) => ({
          id: item.uuid,
          name: item.name,
          path: `http://localhost:5000${item.content_url}`,
          previewImage: `http://localhost:5000${item.qr_code_url}`,
          scale: item.type === '3d-model' ? 0.015 : 1,
          description: item.name,
          type: item.type,
          url: `/?model=${item.uuid}`,
        }));
        setModels(formattedModels.concat(staticModels));
      } catch (err: any) {
        console.warn(err.message);
        setModels(staticModels);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (models.length > 0) {
      if (modelIdFromUrl) {
        const model = models.find(m => m.id === modelIdFromUrl) || null;
        setSelectedModel(model);
      } else {
        setSelectedModel(null);
      }
    }
  }, [modelIdFromUrl, models]);
  
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

  return (
    <div className="flex h-svh w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="relative flex-grow bg-black">
          <ARViewer model={selectedModel} />
          {!selectedModel && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl max-w-md mx-4">
                    <Box className="mx-auto h-12 w-12 text-primary"/>
                    <h2 className="mt-4 text-2xl font-bold text-card-foreground">Welcome to the AR Platform</h2>
                    <p className="text-muted-foreground mt-2">Select a model to get started or scan a QR code.</p>
                    <Button asChild className="mt-6">
                        <Link href="/models">Browse Models</Link>
                    </Button>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-svh w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <HomePageContent />
    </Suspense>
  )
}

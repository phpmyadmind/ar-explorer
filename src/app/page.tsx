// src/app/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { type Model, staticModels } from '@/lib/models';
import { Loader2, AlertCircle, QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ar-explorer/model-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrReader } from '@microlink/react-qr-reader';

const ARViewer = dynamic(() => import('@/components/ar-explorer/ar-viewer').then(mod => mod.ARViewer), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
});

const API_URL = 'http://localhost:5000/api';

function HomePageContent() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelIdFromUrl = searchParams.get('model');

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
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
        scale: item.type === '3d-model' ? 0.015 : 1, // Escala por defecto
        description: item.name,
        type: item.type,
        url: `/?model=${item.uuid}`,
      }));
      setModels(formattedModels.concat(staticModels));

    } catch (err: any) {
      console.warn(err.message);
      setError(err.message);
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
      } else if (!selectedModel) {
        //setSelectedModel(models[0]);
      }
    }
  }, [modelIdFromUrl, models]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
    window.history.pushState({}, '', `/?model=${model.id}`);
  };
  
  const handleQrScan = (result: any) => {
    if (result) {
      const url = result?.text;
      try {
        // Expected format from backend: `ar://resource/${uuid}`
        if (url.startsWith('ar://resource/')) {
            const modelId = url.substring('ar://resource/'.length);
            if (modelId) {
                router.push(`/?model=${modelId}`);
                setIsScanning(false);
                return;
            }
        }
        
        // Fallback for full URLs
        const urlObject = new URL(url);
        const modelId = urlObject.searchParams.get('model');
        if (modelId && (urlObject.origin === window.location.origin || urlObject.origin === 'http://localhost:3000')) {
            router.push(`/?model=${modelId}`);
            setIsScanning(false);
        } else {
            alert("Invalid QR code scanned. Please scan a valid resource QR code.");
        }
      } catch (e) {
          console.error("Scanned QR code is not a valid URL or format.", e);
          alert("Scanned QR code is not a valid URL or format.");
      }
    }
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

  return (
    <div className="flex h-svh w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="relative flex-grow bg-black">
          <ARViewer model={selectedModel} />
           <Button
            variant="secondary"
            className="absolute bottom-4 right-4 z-20 rounded-full h-14 w-14 shadow-lg"
            size="icon"
            onClick={() => setIsScanning(true)}
          >
            <QrCode className="h-7 w-7" />
            <span className="sr-only">Scan QR Code</span>
          </Button>
        </div>

        <div className="h-[30vh] border-t bg-muted/40 backdrop-blur-sm">
           <ModelSelector models={models} selectedModelId={selectedModel?.id ?? null} onSelectModel={handleSelectModel} />
        </div>
      </main>

      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at a resource QR code to load it.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-square w-full bg-muted overflow-hidden">
            {isScanning && (
                 <QrReader
                    onResult={(result) => handleQrScan(result)}
                    constraints={{ facingMode: 'environment' }}
                    className="w-full h-full"
                />
            )}
          </div>
        </DialogContent>
      </Dialog>
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
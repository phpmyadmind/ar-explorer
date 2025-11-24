'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { type Model } from '@/lib/models';
import { useARModels } from '@/hooks/use-ar-models';
import { ErrorBoundary } from '@/components/ar-explorer/error-boundary';
import { ARViewerWrapper } from '@/components/ar-explorer/ar-viewer-wrapper';
import { config } from '@/lib/config';
import { Loader2, Box, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

function HomePageContent() {
  const { models, loading, error } = useARModels();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelIdFromUrl = searchParams.get('model');

  // Memoizar el modelo seleccionado para evitar búsquedas innecesarias
  const selectedModelFromUrl = useMemo(() => {
    if (!modelIdFromUrl || loading || models.length === 0) {
      return null;
    }
    return models.find(m => m.id === modelIdFromUrl) || null;
  }, [modelIdFromUrl, models, loading]);

  useEffect(() => {
    if (!modelIdFromUrl) {
      setSelectedModel(null);
      return;
    }

    if (loading || models.length === 0) {
      return;
    }

    if (selectedModelFromUrl) {
      setSelectedModel(selectedModelFromUrl);
    } else {
      console.warn(`Model with id ${modelIdFromUrl} not found`);
      setSelectedModel(null);
    }
  }, [modelIdFromUrl, selectedModelFromUrl, loading, models.length]);
  
  if (loading) {
    return (
      <div className="flex h-svh w-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading AR models...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-svh w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {error && (
          <Alert variant="default" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative flex-grow bg-black">
          <ErrorBoundary>
            <ARViewerWrapper model={selectedModel} />
          </ErrorBoundary>
          
          {!selectedModel && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl max-w-md mx-4">
                    <Box className="mx-auto h-12 w-12 text-primary"/>
                <h2 className="mt-4 text-2xl font-bold text-card-foreground">
                  Welcome to the AR Platform
                </h2>
                <p className="text-muted-foreground mt-2">
                  Select a model to get started.
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <Button asChild>
                        <Link href="/models">Browse Models</Link>
                    </Button>
                  <Button asChild variant="outline">
                    <Link href="/contents">Manage Content</Link>
                  </Button>
                </div>
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
    <Suspense fallback={
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

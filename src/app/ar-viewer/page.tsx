'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { type Model } from '@/lib/models';
import { useARModels } from '@/hooks/use-ar-models';
import { ErrorBoundary } from '@/components/ar-explorer/error-boundary';
import { ARViewerWrapper } from '@/components/ar-explorer/ar-viewer-wrapper';
import { Loader2, Box, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

function ARViewerPageContent() {
  const { models, loading, error } = useARModels();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const searchParams = useSearchParams();
  const modelIdFromUrl = searchParams.get('model');

  const selectedModelFromUrl = useMemo(() => {
    if (!modelIdFromUrl || loading || models.length === 0) {
      return null;
    }
    return models.find(m => m.id === modelIdFromUrl) || null;
  }, [modelIdFromUrl, models, loading]);

  useEffect(() => {
    if (loading) return; // Wait for models to load

    if (selectedModelFromUrl) {
      setSelectedModel(selectedModelFromUrl);
    } else if (modelIdFromUrl) {
      console.warn(`Model with id ${modelIdFromUrl} not found`);
      setSelectedModel(null);
    } else {
        // No model in URL, show welcome/selection screen
        setSelectedModel(null);
    }
  }, [modelIdFromUrl, selectedModelFromUrl, loading]);
  
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
          <Alert variant="destructive" className="m-4 mb-0">
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
                  Welcome to the AR Viewer
                </h2>
                <p className="text-muted-foreground mt-2">
                  Select a model from the library to get started.
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <Button asChild>
                        <Link href="/models">Browse Models</Link>
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

export default function ARViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <ARViewerPageContent />
    </Suspense>
  );
}


'use client';

import React, { useState, Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box } from 'lucide-react';
import type { Model } from '@/lib/models';
import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('./model-viewer').then(mod => mod.ModelViewer), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center bg-transparent"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
});

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: React.FC<ARViewerProps> = ({ model }) => {
  const [error, setError] = useState<string | null>(null);

  const is3DModel = model && model.type === '3d-model';
  
  return (
    <div className="absolute inset-0 w-full h-full">
        {is3DModel && (
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-transparent"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <ModelViewer model={model} />
            </Suspense>
        )}

        {model && !is3DModel && (
          <div className="w-full h-full flex items-center justify-center p-8">
            {model.type === 'video' ? (
              <video src={model.path} className="max-w-full max-h-full rounded-lg shadow-2xl" controls autoPlay loop muted />
            ) : (
               <img src={model.path} alt={model.name} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
            )}
          </div>
        )}
      
      {/* Overlays for error/welcome states */}
      {(error || !model) && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-300">
            <div className="max-w-md w-full p-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>An Error Occurred</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {!model && !error && (
                 <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl">
                   <Box className="mx-auto h-12 w-12 text-primary"/>
                   <h2 className="mt-4 text-2xl font-bold text-card-foreground">Welcome to AR Platform</h2>
                   <p className="text-muted-foreground mt-2">Select a model from the list to get started.</p>
                 </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

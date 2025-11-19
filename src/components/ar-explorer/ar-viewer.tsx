
'use client';

import React, { useState, useRef, useEffect, FC, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gltf, OrbitControls, Environment } from '@react-three/drei';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box } from 'lucide-react';
import type { Model } from '@/lib/models';
import * as THREE from 'three';

interface ARViewerProps {
  model: Model | null;
}

const ModelViewer = ({ model }: { model: Model }) => {
  return (
    <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
      <Gltf src={model.path} scale={model.scale} position={[0, 0, 0]} />
      <Environment preset="sunset" />
    </Suspense>
  );
};


export const ARViewer: FC<ARViewerProps> = ({ model }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoModelRef = useRef<HTMLVideoElement>(null);
  const [is3DModel, setIs3DModel] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    if(videoModelRef.current) videoModelRef.current.style.display = 'none';

    if (!model) {
      setLoading(false);
      setIs3DModel(false);
      return;
    }

    const is3D = model.type === '3d-model';
    setIs3DModel(is3D);

    if (is3D) {
      // For 3D models, loading is handled by Suspense in ModelViewer
      setLoading(false);
    } else {
      // For video/image
      if (videoModelRef.current) {
        videoModelRef.current.style.display = 'block';
        videoModelRef.current.src = model.path;
        videoModelRef.current.play().catch(e => console.error("Video play failed", e));
      }
      setLoading(false);
    }
  }, [model]);

  return (
    <div className="absolute inset-0 w-full h-full">
        {is3DModel && model && (
            <Canvas style={{ background: 'transparent' }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
                <ModelViewer model={model} />
                <OrbitControls />
            </Canvas>
        )}

      {/* Video/Image view */}
      <video ref={videoModelRef} loop playsInline muted className="w-full h-full object-cover" style={{display: 'none'}} />
      
      {/* Overlays for loading/error/welcome states */}
      {(loading || error || !model) && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-300">
            <div className="max-w-md w-full p-4">
              {loading && (
                <div className="flex flex-col items-center gap-4 text-center p-8 bg-card/80 rounded-lg shadow-2xl">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-semibold text-card-foreground">Loading Model...</p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>An Error Occurred</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {!model && !loading && !error && (
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

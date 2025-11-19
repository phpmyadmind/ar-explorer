
'use client';

import React, { useState, useRef, useEffect, FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box } from 'lucide-react';
import type { Model } from '@/lib/models';
import * as THREE from 'three';

interface ARViewerProps {
  model: Model | null;
}

const ModelViewer = ({ model }: { model: Model }) => {
  const [gltf, setGltf] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (model.path) {
      new GLTFLoader().load(model.path, (loadedGltf) => {
        const scene = loadedGltf.scene;
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        scene.position.sub(center);
        scene.scale.set(model.scale, model.scale, model.scale);
        setGltf(scene);
      });
    }
  }, [model]);

  return gltf ? <primitive ref={modelRef} object={gltf} /> : null;
};


export const ARViewer: FC<ARViewerProps> = ({ model }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoModelRef = useRef<HTMLVideoElement>(null);
  const [is3DModel, setIs3DModel] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Hide both views initially
    if(videoModelRef.current) videoModelRef.current.style.display = 'none';

    if (!model) {
      setLoading(false);
      setIs3DModel(false);
      return;
    }

    if (model.type === 'video' || model.type === 'image') {
      setIs3DModel(false);
      if (videoModelRef.current) {
        videoModelRef.current.style.display = 'block';
        videoModelRef.current.src = model.path;
        videoModelRef.current.play().catch(e => console.error("Video play failed", e));
      }
      setLoading(false);
    } else if (model.type === '3d-model') {
      setIs3DModel(true);
       const timer = setTimeout(() => setLoading(false), 500);
       return () => clearTimeout(timer);
    }

  }, [model]);

  return (
    <div className="absolute inset-0 w-full h-full">
        {is3DModel && model && (
            <Canvas style={{ background: 'transparent' }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
                <React.Suspense fallback={null}>
                    <ModelViewer model={model} />
                </React.Suspense>
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

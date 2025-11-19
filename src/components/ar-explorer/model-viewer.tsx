
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gltf, OrbitControls, Environment } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import type { Model } from '@/lib/models';

interface ModelViewerProps {
  model: Model;
}

export const ModelViewer = ({ model }: ModelViewerProps) => {
  return (
    <Canvas style={{ background: 'transparent' }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <Gltf src={model.path} scale={model.scale} position={[0, 0, 0]} />
        <Environment preset="sunset" />
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
};

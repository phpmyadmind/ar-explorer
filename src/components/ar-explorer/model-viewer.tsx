'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gltf, DeviceOrientationControls, OrbitControls, Plane, useVideoTexture } from '@react-three/drei';
import type { Model } from '@/lib/models';

function ModelScene({ path, scale }: { path: string, scale: number }) {
  return (
    <Gltf src={path} scale={scale} />
  );
}

interface ModelViewerProps {
  model: Model;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ model }) => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
      <Suspense fallback={null}>
        <ModelScene path={model.path} scale={model.scale} />
      </Suspense>
      <OrbitControls />
      <DeviceOrientationControls />
    </Canvas>
  );
};


'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gltf, DeviceOrientationControls, OrbitControls, Plane, useVideoTexture } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import type { Model } from '@/lib/models';
import * as THREE from 'three';

// Component to render video texture on a plane
function VideoScene({ path }: { path: string }) {
  const texture = useVideoTexture(path);
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    const video = (texture.image as HTMLVideoElement);
    if (video) {
        const handleMetadata = () => {
            setAspect(video.videoWidth / video.videoHeight);
        };
        video.addEventListener('loadedmetadata', handleMetadata);
        return () => video.removeEventListener('loadedmetadata', handleMetadata);
    }
  }, [texture.image]);

  const planeScale = useMemo(() => {
    const scale = 5;
    return aspect > 1 ? [scale, scale / aspect] : [scale * aspect, scale];
  }, [aspect]);

  return (
    <Plane args={[1, 1]} scale={planeScale as [number, number, number]}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </Plane>
  );
}

// Component to render the 3D model
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
        {model.type === '3d-model' ? (
          <ModelScene path={model.path} scale={model.scale} />
        ) : (
          <VideoScene path={model.path} />
        )}
      </Suspense>
      <OrbitControls />
      <DeviceOrientationControls />
    </Canvas>
  );
};

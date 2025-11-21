'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Gltf, OrbitControls, DeviceOrientationControls, Plane, useVideoTexture } from '@react-three/drei';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box, VideoOff } from 'lucide-react';
import type { Model } from '@/lib/models';
import * as THREE from 'three';

// Component to handle video texture on a plane
function VideoScene({ path }: { path: string }) {
  const texture = useVideoTexture(path);
  return (
    <mesh scale={[1, 1, 1]}>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Component to handle 3D model loading
function ModelScene({ path, scale }: { path: string, scale: number }) {
  return (
    <Gltf src={path} scale={scale} />
  );
}

// Background component that uses the device camera
function CameraBackground() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const texture = useVideoTexture(video!);
  const { size } = useThree();

  useEffect(() => {
    let stream: MediaStream;
    const videoElement = document.createElement('video');
    videoElement.playsInline = true;
    videoElement.muted = true;
    videoElement.autoplay = true;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        videoElement.srcObject = s;
        videoElement.play();
        setVideo(videoElement);
      })
      .catch(err => {
        console.error("Camera access denied:", err);
      });

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  if (!video) return null;

  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[size.width / 50, size.height / 50]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: React.FC<ARViewerProps> = ({ model }) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      } catch (err) {
        console.error('Failed to get camera permission', err);
        setCameraError('Camera access is required for the AR experience. Please grant permission in your browser settings.');
        setHasCameraPermission(false);
      }
    };
    checkPermission();
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      {hasCameraPermission ? (
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
          
          <Suspense fallback={null}>
            <CameraBackground />
            {model && model.type === '3d-model' && <ModelScene path={model.path} scale={model.scale} />}
            {model && model.type === 'video' && <VideoScene path={model.path} />}
            {model && model.type === 'image' && <ModelScene path={model.path} scale={1} />}
          </Suspense>

          <OrbitControls />
          <DeviceOrientationControls />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Alert variant="destructive" className="max-w-md">
            <VideoOff className="h-5 w-5" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        </div>
      )}

      {(!model && hasCameraPermission) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl max-w-md">
            <Box className="mx-auto h-12 w-12 text-primary"/>
            <h2 className="mt-4 text-2xl font-bold text-card-foreground">Welcome to AR Platform</h2>
            <p className="text-muted-foreground mt-2">Select a model from the list below to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
};

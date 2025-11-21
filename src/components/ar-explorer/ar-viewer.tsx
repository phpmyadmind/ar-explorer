'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, DeviceOrientationControls, Plane, useVideoTexture, Gltf } from '@react-three/drei';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box, VideoOff, CameraOff } from 'lucide-react';
import type { Model } from '@/lib/models';
import * as THREE from 'three';

// Componente para manejar la textura de video/imagen en un plano
function MediaScene({ path, type }: { path: string, type: 'video' | 'image' }) {
  const texture = useVideoTexture(path, { start: type === 'video', muted: type === 'video' });
  const aspectRatio = 16 / 9; // Asumimos un aspect ratio para el video/imagen
  
  return (
    <mesh scale={[aspectRatio, 1, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// Componente para manejar la carga de modelos 3D
function ModelScene({ path, scale }: { path: string, scale: number }) {
  return (
    <Gltf src={path} scale={scale} />
  );
}

// Componente de fondo que utiliza la cámara del dispositivo
function CameraBackground() {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

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
        const texture = new THREE.VideoTexture(videoElement);
        texture.colorSpace = THREE.SRGBColorSpace;
        setVideoTexture(texture);
      })
      .catch(err => {
        console.error("Camera access denied:", err);
      });

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  if (!videoTexture) return null;

  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial map={videoTexture} />
    </mesh>
  );
}

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: React.FC<ARViewerProps> = ({ model }) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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
  
  if (hasCameraPermission === null) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      );
  }

  if (!hasCameraPermission) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Alert variant="destructive" className="max-w-md">
            <CameraOff className="h-5 w-5" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        </div>
      );
  }
  
  return (
    <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
          
          <Suspense fallback={
              <mesh>
                  <boxGeometry />
                  <meshStandardMaterial />
              </mesh>
          }>
            <CameraBackground />
            {model?.type === '3d-model' && <ModelScene path={model.path} scale={model.scale} />}
            {(model?.type === 'video' || model?.type === 'image') && <MediaScene path={model.path} type={model.type} />}
          </Suspense>

          <OrbitControls enableZoom={true} enablePan={true} />
          <DeviceOrientationControls />
        </Canvas>

      {(!model) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
          <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl max-w-md mx-4">
            <Box className="mx-auto h-12 w-12 text-primary"/>
            <h2 className="mt-4 text-2xl font-bold text-card-foreground">Welcome to the AR Platform</h2>
            <p className="text-muted-foreground mt-2">Select a model from the list below or scan a QR code to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
};

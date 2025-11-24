'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  DeviceOrientationControls, 
  useVideoTexture, 
  Gltf,
  PerspectiveCamera,
  ContactShadows
} from '@react-three/drei';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box, VideoOff, CameraOff, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import type { Model } from '@/lib/models';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

// Componente para manejar imágenes/videos desde base64
const Base64MediaScene = memo(function Base64MediaScene({ path, type, scale = 1 }: { path: string; type: 'video' | 'image'; scale?: number }) {
  const [data, setData] = useState<{ texture: THREE.Texture; aspectRatio: number } | null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let alive = true;
    let videoEl: HTMLVideoElement | null = null;
    let texture: THREE.Texture | null = null;

    if (type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!alive) return;
        texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        setData({ texture, aspectRatio: img.width / img.height });
      };
      img.onerror = () => alive && setError('Failed to load image.');
      img.src = path;
    } else if (type === 'video') {
      videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.playsInline = true;
      videoEl.muted = false;
      videoEl.loop = true;
      videoEl.autoplay = false;
      
      const onCanPlay = () => {
        if (!alive || !videoEl) return;
        videoEl.play().then(() => {
          if (!alive || !videoEl) return;
          texture = new THREE.VideoTexture(videoEl);
          texture.colorSpace = THREE.SRGBColorSpace;
          setData({ texture, aspectRatio: videoEl.videoWidth / videoEl.videoHeight });
        }).catch(e => {
            console.error("Video play failed:", e);
            if(alive) setError('Video playback was blocked by the browser.');
        });
      };
      videoEl.addEventListener('canplay', onCanPlay);
      videoEl.onerror = () => alive && setError('Failed to load video.');
      videoEl.src = path;
    }
    
    return () => {
      alive = false;
      if (videoEl) {
        videoEl.pause();
        videoEl.src = '';
        videoEl.removeEventListener('canplay', onCanPlay);
      }
      if (texture) {
        texture.dispose();
      }
    };
  }, [path, type]);

  const scene = useThree((state) => state.scene);
  useEffect(() => {
      if (data?.texture) {
          scene.background = data.texture;
      }
  }, [data, scene]);

  if (error) {
    return (
        <mesh>
          <boxGeometry args={[2, 1, 0.1]} />
          <meshBasicMaterial color="red" />
        </mesh>
    )
  }
  
  if (!data) return null;

  return (
    <mesh scale={[data.aspectRatio * scale, scale, 1]} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={data.texture} toneMapped={false} transparent />
    </mesh>
  );
});

// Componente para manejar la carga de modelos 3D
const ModelScene = memo(function ModelScene({ path, scale }: { path: string, scale: number }) {
  return (
    <Suspense fallback={
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" wireframe />
      </mesh>
    }>
      <Gltf 
        src={path} 
        scale={scale}
      />
    </Suspense>
  );
});


const MediaScene = memo(function MediaScene({ path, type, scale = 1 }: { path: string; type: 'video' | 'image'; scale?: number }) {
  const isBase64 = path?.startsWith('data:');
  const Component = isBase64 ? Base64MediaScene : URLVideoScene; // Assuming URL is always video for now
  
  if (type === 'image') {
      return <URLImageScene path={path} scale={scale} />
  }

  return <Component path={path} type={type} scale={scale} />;
});

function URLImageScene({ path, scale = 1 }: { path: string, scale?: number }) {
  const [data, setData] = useState<{ texture: THREE.Texture; aspectRatio: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!alive) return;
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      setData({ texture, aspectRatio: img.width / img.height });
    };
    img.onerror = () => console.error('Failed to load image from URL:', path);
    img.src = path;
    return () => {
      alive = false;
      data?.texture.dispose();
    };
  }, [path, data]);

  if (!data) return null;

  return (
    <mesh scale={[data.aspectRatio * scale, scale, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={data.texture} toneMapped={false} />
    </mesh>
  );
}

function URLVideoScene({ path, scale = 1 }: { path: string, type: 'video' | 'image', scale?: number }) {
  const texture = useVideoTexture(path, {
    start: true,
    muted: false,
    loop: true,
    crossOrigin: 'anonymous',
  });

  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    const video = texture.source.data as HTMLVideoElement;
    const updateAspect = () => {
      if (video.videoWidth > 0) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };
    if (video.readyState > 0) {
      updateAspect();
    } else {
      video.addEventListener('loadedmetadata', updateAspect);
    }
    return () => video.removeEventListener('loadedmetadata', updateAspect);
  }, [texture]);
  
  return (
    <mesh scale={[aspectRatio * scale, scale, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent />
    </mesh>
  );
}

// Controles AR mejorados
const ARControls = memo(function ARControls({ 
  model, 
  onScaleChange, 
  onRotationChange,
  scale,
  rotation 
}: { 
  model: Model | null;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  scale: number;
  rotation: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!model) return null;

  return (
    <Card className={cn("absolute bottom-4 left-4 right-4 z-20 transition-all duration-300", isExpanded ? 'p-4' : 'p-2')}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{model.name}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Scale</span>
              <span className="text-muted-foreground">{scale.toFixed(2)}x</span>
            </div>
            <Slider value={[scale]} onValueChange={([value]) => onScaleChange(value)} min={0.1} max={5} step={0.05} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotation</span>
              <span className="text-muted-foreground">{Math.round(rotation)}°</span>
            </div>
            <Slider value={[rotation]} onValueChange={([value]) => onRotationChange(value)} min={0} max={360} step={1} />
          </div>
        </div>
      )}
    </Card>
  );
});
ARControls.displayName = 'ARControls';

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: React.FC<ARViewerProps> = ({ model }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelScale, setModelScale] = useState<number>(model?.scale || 1);
  const [modelRotation, setModelRotation] = useState<number>(0);
  const [isARMode, setIsARMode] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    setModelScale(model?.scale || 1);
    setModelRotation(0);
  }, [model]);

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const setupCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API not available in this browser.");
      setHasCameraPermission(false);
      return false;
    }
    try {
      cleanupCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
      setCameraError(null);
      return true;
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError' ? 'Camera access was denied.' : 'Could not access the camera.');
      setHasCameraPermission(false);
      return false;
    }
  }, [cleanupCamera]);

  const toggleARMode = useCallback(async () => {
    setIsSwitching(true);
    if (isARMode) {
      cleanupCamera();
      setIsARMode(false);
    } else {
      const success = await setupCamera();
      if (success) {
        setIsARMode(true);
      }
    }
    setIsSwitching(false);
  }, [isARMode, setupCamera, cleanupCamera]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => cleanupCamera();
  }, [cleanupCamera]);

  const modelTransform = useMemo(() => ({
    rotation: [0, (modelRotation * Math.PI) / 180, 0] as [number, number, number],
    scale: modelScale,
  }), [modelRotation, modelScale]);

  return (
    <div className="absolute inset-0 w-full h-full bg-gray-800">
      <video
        ref={videoRef}
        className={cn("absolute inset-0 w-full h-full object-cover", isARMode ? 'block' : 'hidden')}
        playsInline
        autoPlay
        muted
      />
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
        }}
        camera={{ position: [0, 0, 2], fov: 75 }}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 7.5]} intensity={2.5} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        {!isARMode && <color attach="background" args={['#333']} />}
        
        {model && (
          <group rotation={modelTransform.rotation} scale={modelTransform.scale}>
            {model.type === '3d-model' && (
              <>
                <ModelScene path={model.path} scale={1} />
                <ContactShadows position={[0, -0.7, 0]} opacity={0.5} scale={10} blur={2} far={2} />
              </>
            )}
            {(model.type === 'video' || model.type === 'image') && (
              <MediaScene path={model.path} type={model.type} scale={1} />
            )}
          </group>
        )}
        
        {isARMode ? (
          <DeviceOrientationControls />
        ) : (
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            enableRotate={true}
            minDistance={0.5}
            maxDistance={10}
          />
        )}
      </Canvas>
      
      {model && (
        <ARControls
          model={model}
          onScaleChange={setModelScale}
          onRotationChange={setModelRotation}
          scale={modelScale}
          rotation={modelRotation}
        />
      )}

      {cameraError && isARMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <Alert variant="destructive" className="max-w-md">
                <CameraOff className="h-5 w-5" />
                <AlertTitle>Camera Error</AlertTitle>
                <AlertDescription>{cameraError}</AlertDescription>
                <Button variant="secondary" size="sm" className="mt-2" onClick={setupCamera}>Try Again</Button>
            </Alert>
          </div>
      )}

      <Button
        variant="outline"
        size="lg"
        className="absolute top-20 right-4 z-20 h-12 w-12 rounded-full p-0"
        onClick={toggleARMode}
        disabled={isSwitching}
        title={isARMode ? 'Switch to 3D View' : 'Switch to AR View'}
      >
        {isSwitching ? <Loader2 className="h-5 w-5 animate-spin" /> : 
         isARMode ? <VideoOff className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default ARViewer;

'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  DeviceOrientationControls, 
  useVideoTexture, 
  Gltf,
  PerspectiveCamera,
  ContactShadows
} from '@react-three/drei';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Box, VideoOff, CameraOff, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import type { Model } from '@/lib/models';
import * as THREE from 'three';

// Componente para manejar imágenes/videos desde base64
function Base64MediaScene({ path, type, scale = 1 }: { path: string, type: 'video' | 'image', scale?: number }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // Default 16:9
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!path) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Cleanup anterior
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.remove();
      videoRef.current = null;
    }
    
    if (type === 'image') {
      // Para imágenes base64
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        tex.colorSpace = THREE.SRGBColorSpace;
        // Calcular relación de aspecto real de la imagen
        const aspect = img.width / img.height;
        setAspectRatio(aspect);
        textureRef.current = tex;
        setTexture(tex);
        setIsLoading(false);
      };
      
      img.onerror = (e) => {
        console.error('Error loading image from base64', e);
        setTexture(null);
        setIsLoading(false);
      };
      
      img.src = path;
      
      return () => {
        if (textureRef.current) {
          textureRef.current.dispose();
          textureRef.current = null;
        }
        setTexture(null);
      };
    } else if (type === 'video') {
      // Para videos base64, necesitamos agregarlo al DOM temporalmente
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.muted = false; // Habilitar audio
      video.loop = true;
      video.autoplay = true;
      video.volume = 1.0; // Volumen máximo
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.style.position = 'absolute';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      
      // Agregar al DOM para que funcione correctamente
      if (containerRef.current) {
        containerRef.current.appendChild(video);
      } else {
        document.body.appendChild(video);
      }
      
      videoRef.current = video;
      
      const handleLoadedData = () => {
        // Calcular relación de aspecto real del video
        if (video.videoWidth && video.videoHeight) {
          const aspect = video.videoWidth / video.videoHeight;
          setAspectRatio(aspect);
          console.log(`📐 Base64MediaScene - Video aspect ratio: ${aspect.toFixed(2)} (${video.videoWidth}x${video.videoHeight})`);
        }
        
        // Asegurar que el video esté listo para reproducir
        const tryPlay = () => {
          if (video.readyState >= 2) {
            video.play().then(() => {
              const tex = new THREE.VideoTexture(video);
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              // Actualizar la textura en cada frame
              tex.needsUpdate = true;
              textureRef.current = tex;
              setTexture(tex);
              setIsLoading(false);
              console.log('✅ Base64MediaScene - Video playing successfully');
            }).catch(err => {
              console.error('❌ Error playing video:', err);
              setTexture(null);
              setIsLoading(false);
            });
          } else {
            // Esperar a que el video esté listo
            setTimeout(tryPlay, 100);
          }
        };
        tryPlay();
      };
      
      // También escuchar el evento loadedmetadata para obtener dimensiones temprano
      video.addEventListener('loadedmetadata', () => {
        if (video.videoWidth && video.videoHeight) {
          const aspect = video.videoWidth / video.videoHeight;
          setAspectRatio(aspect);
          console.log(`📐 Base64MediaScene - Video metadata loaded: ${aspect.toFixed(2)} (${video.videoWidth}x${video.videoHeight})`);
        }
      });
      
      const handleError = (e: Event) => {
        console.error('Error loading video from base64', e);
        setTexture(null);
        setIsLoading(false);
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.src = path;
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadedmetadata', () => {});
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = '';
          videoRef.current.remove();
          videoRef.current = null;
        }
        if (textureRef.current) {
          textureRef.current.dispose();
          textureRef.current = null;
        }
        setTexture(null);
        setAspectRatio(16 / 9); // Reset a default
      };
    }
  }, [path, type]);
  
  // Usar useFrame para actualizar la textura del video en el render loop de Three.js
  useFrame(() => {
    if (textureRef.current && type === 'video' && videoRef.current) {
      // Asegurar que el video esté reproduciéndose
      if (videoRef.current.paused && videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(err => {
          console.warn('Warning: Could not play video:', err);
        });
      }
      textureRef.current.needsUpdate = true;
    }
  });
  
  // Los elementos de video se agregan al DOM fuera del Canvas
  // No renderizar divs dentro del Canvas
  useEffect(() => {
    if (containerRef.current && !containerRef.current.parentElement) {
      document.body.appendChild(containerRef.current);
    }
    return () => {
      if (containerRef.current && containerRef.current.parentElement) {
        containerRef.current.parentElement.removeChild(containerRef.current);
      }
    };
  }, []);

  if (isLoading || !texture) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="gray" />
      </mesh>
    );
  }
  
  return (
    <mesh scale={[aspectRatio * scale, scale, 1]} position={[0, 0, 0]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent={type === 'video'} />
    </mesh>
  );
}

// Componente para manejar imágenes desde URL
function URLImageScene({ path, scale = 1 }: { path: string, scale?: number }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // Default 16:9
  const textureRef = useRef<THREE.Texture | null>(null);
  
  useEffect(() => {
    if (!path) {
      console.warn('⚠️ URLImageScene - No path provided');
      return;
    }
    
    console.log('🖼️ URLImageScene - Loading image from:', path);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('✅ URLImageScene - Image loaded successfully');
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      tex.colorSpace = THREE.SRGBColorSpace;
      // Calcular relación de aspecto real de la imagen
      const aspect = img.width / img.height;
      setAspectRatio(aspect);
      console.log(`📐 URLImageScene - Image aspect ratio: ${aspect.toFixed(2)} (${img.width}x${img.height})`);
      textureRef.current = tex;
      setTexture(tex);
    };
    
    img.onerror = (e) => {
      console.error('❌ URLImageScene - Error loading image from URL:', path, e);
      setTexture(null);
    };
    
    img.src = path;
    
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      setTexture(null);
    };
  }, [path]);
  
  if (!texture) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="gray" />
      </mesh>
    );
  }
  
  return (
    <mesh scale={[aspectRatio * scale, scale, 1]} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent={false} />
    </mesh>
  );
}

// Componente para manejar videos desde URL
function URLVideoScene({ path, scale = 1 }: { path: string, scale?: number }) {
  console.log('🎥 URLVideoScene - Loading video from:', path);
  
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // Default 16:9
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const texture = useVideoTexture(path, { 
    start: true, 
    muted: false, // Habilitar audio
    loop: true,
    playsInline: true,
    crossOrigin: 'anonymous'
  });
  
  // Obtener referencia al elemento de video para calcular aspect ratio
  useEffect(() => {
    // useVideoTexture crea un video internamente, necesitamos acceder a él
    // Buscar el elemento de video en el DOM que tenga el src correcto
    const findVideoElement = () => {
      const videos = document.querySelectorAll('video');
      for (const video of videos) {
        if (video.src && (video.src.includes(path) || video.srcObject)) {
          videoRef.current = video;
          // Calcular aspect ratio cuando el video esté listo
          const updateAspectRatio = () => {
            if (video.videoWidth && video.videoHeight) {
              const aspect = video.videoWidth / video.videoHeight;
              setAspectRatio(aspect);
              console.log(`📐 URLVideoScene - Video aspect ratio: ${aspect.toFixed(2)} (${video.videoWidth}x${video.videoHeight})`);
            }
          };
          
          if (video.readyState >= 2) {
            updateAspectRatio();
          } else {
            video.addEventListener('loadedmetadata', updateAspectRatio, { once: true });
            video.addEventListener('loadeddata', updateAspectRatio, { once: true });
          }
          break;
        }
      }
    };
    
    // Intentar encontrar el video después de un pequeño delay
    const timer = setTimeout(findVideoElement, 500);
    return () => clearTimeout(timer);
  }, [path]);
  
  // Asegurar que la textura se actualice en cada frame y habilitar audio
  useFrame(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
    // Habilitar audio del video si está disponible
    if (videoRef.current) {
      if (videoRef.current.muted) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
      }
      // Actualizar aspect ratio si el video tiene nuevas dimensiones
      if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
        const aspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
        if (Math.abs(aspect - aspectRatio) > 0.01) {
          setAspectRatio(aspect);
        }
      }
    }
  });
  
  return (
    <mesh scale={[aspectRatio * scale, scale, 1]} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent={true} />
    </mesh>
  );
}

// Componente wrapper para URLs
function URLMediaScene({ path, type, scale = 1 }: { path: string, type: 'video' | 'image', scale?: number }) {
  if (type === 'video') {
    return <URLVideoScene path={path} scale={scale} />;
  } else {
    return <URLImageScene path={path} scale={scale} />;
  }
}

// Componente wrapper que decide qué usar
function MediaScene({ path, type, scale = 1 }: { path: string, type: 'video' | 'image', scale?: number }) {
  console.log('🎬 MediaScene - Loading resource:', { path, type, scale });
  
  if (!path) {
    console.error('❌ MediaScene - No path provided');
    return (
      <mesh>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    );
  }
  
  const isBase64 = path?.startsWith('data:');
  
  if (isBase64) {
    console.log('📦 Using Base64MediaScene for base64 content');
    return <Base64MediaScene path={path} type={type} scale={scale} />;
  } else {
    console.log('🌐 Using URLMediaScene for URL content:', path);
    return <URLMediaScene path={path} type={type} scale={scale} />;
  }
}

// Componente para manejar la carga de modelos 3D con mejor manejo de errores
function ModelScene({ path, scale }: { path: string, scale: number }) {
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
}

// Componente de fondo que utiliza la cámara del dispositivo con mejor manejo
function CameraBackground({ onError }: { onError?: (error: string) => void }) {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Crear el contenedor si no existe
  useEffect(() => {
    if (!containerRef.current) {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.width = '0';
      div.style.height = '0';
      div.style.overflow = 'hidden';
      div.style.pointerEvents = 'none';
      containerRef.current = div;
    }
  }, []);

  useEffect(() => {
    let videoElement: HTMLVideoElement | null = null;
    let currentStream: MediaStream | null = null;
    let textureInstance: THREE.VideoTexture | null = null;
    
    const startCamera = async () => {
      try {
        // Verificar que la API esté disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not available');
        }

        // Crear elemento de video
        videoElement = document.createElement('video');
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        videoElement.style.position = 'absolute';
        videoElement.style.width = '1px';
        videoElement.style.height = '1px';
        videoElement.style.opacity = '0';
        videoElement.style.pointerEvents = 'none';
        
        // Agregar al DOM
        if (containerRef.current) {
          containerRef.current.appendChild(videoElement);
        } else {
          document.body.appendChild(videoElement);
        }
        
        videoRef.current = videoElement;

        // Solicitar acceso a la cámara
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        
        currentStream = stream;
        streamRef.current = stream;
        videoElement.srcObject = stream;
        
        const handleLoadedMetadata = () => {
          if (!videoElement) return;
          console.log('📹 CameraBackground - Video metadata loaded:', {
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            readyState: videoElement.readyState
          });
          videoElement.play().then(() => {
            if (!videoElement) return;
            console.log('✅ CameraBackground - Video playing successfully');
            const texture = new THREE.VideoTexture(videoElement);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
            textureInstance = texture;
            setVideoTexture(texture);
            setIsLoading(false);
            console.log('✅ CameraBackground - Texture created and set');
          }).catch(err => {
            console.error('❌ CameraBackground - Error playing video stream:', err);
            onError?.('Failed to start camera stream');
            setIsLoading(false);
          });
        };
        
        const handleError = (e: Event) => {
          console.error('Video element error:', e);
          onError?.('Video element error during camera stream');
          setIsLoading(false);
        };
        
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('error', handleError);
      } catch (err: any) {
        console.error("Camera access error:", err);
        onError?.(err.message || 'Camera access denied');
        setIsLoading(false);
      }
    };

    startCamera();
    
    return () => {
      // Cleanup
      currentStream?.getTracks().forEach(track => track.stop());
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
        videoElement.remove();
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
      if (textureInstance) {
        textureInstance.dispose();
      }
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [onError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Usar useFrame para actualizar la textura de la cámara en el render loop de Three.js
  useFrame(() => {
    if (videoTexture && videoRef.current) {
      // Asegurar que el video esté reproduciéndose
      if (videoRef.current.paused && videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(err => {
          console.warn('⚠️ CameraBackground - Warning: Could not play camera video:', err);
        });
      }
      // Actualizar la textura en cada frame
      videoTexture.needsUpdate = true;
    }
  });

  // Los elementos de video se agregan al DOM fuera del Canvas
  // No renderizar divs dentro del Canvas
  useEffect(() => {
    if (containerRef.current && !containerRef.current.parentElement) {
      document.body.appendChild(containerRef.current);
    }
    return () => {
      if (containerRef.current && containerRef.current.parentElement) {
        containerRef.current.parentElement.removeChild(containerRef.current);
      }
    };
  }, []);

  if (isLoading || !videoTexture) {
    console.log('⏳ CameraBackground - Loading or no texture:', { isLoading, hasTexture: !!videoTexture });
    return (
      <mesh position={[0, 0, 0.5]} scale={[2, 2, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="gray" />
      </mesh>
    );
  }

  // Renderizar el fondo de la cámara detrás de todos los elementos
  // La cámara está en posición [0, 0, 2], así que el fondo debe estar más cerca
  // Calcular el tamaño basado en el FOV de la cámara y el aspect ratio de la ventana
  const cameraZ = 2; // Posición Z de la cámara
  const backgroundDistance = 1.8; // Distancia del fondo desde la cámara (más cerca para mejor visibilidad)
  const fov = 75;
  const fovRad = (fov * Math.PI) / 180;
  const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;
  
  // Calcular el tamaño del plano para cubrir el FOV a la distancia especificada
  // Aumentar el tamaño para asegurar que cubra toda la vista
  const height = 2 * Math.tan(fovRad / 2) * backgroundDistance;
  const width = height * aspect;
  
  // Posición del fondo: detrás de la cámara pero visible
  const backgroundZ = cameraZ - backgroundDistance;
  
  console.log('📹 CameraBackground render:', {
    cameraZ,
    backgroundZ,
    width,
    height,
    aspect,
    hasTexture: !!videoTexture,
    videoRef: !!videoRef.current
  });
  
  return (
    <mesh position={[0, 0, backgroundZ]} scale={[width, height, 1]} renderOrder={0}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={videoTexture} 
        transparent={false}
        side={THREE.DoubleSide}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}

// Controles AR mejorados - Memoizado para evitar re-renders innecesarios
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (!model) return null;

  return (
    <Card className={`absolute bottom-4 left-4 right-4 z-20 transition-all duration-300 ${
      isExpanded ? 'p-4' : 'p-2'
    }`}>
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
              <span className="flex items-center gap-1">
                <ZoomIn className="h-3 w-3" />
                Scale
              </span>
              <span className="text-muted-foreground">{scale.toFixed(2)}x</span>
            </div>
            <Slider
              value={[scale]}
              onValueChange={([value]) => onScaleChange(value)}
              min={0.1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                Rotation
              </span>
              <span className="text-muted-foreground">{Math.round(rotation)}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={([value]) => onRotationChange(value)}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      )}
    </Card>
  );
});

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: React.FC<ARViewerProps> = ({ model }) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [modelScale, setModelScale] = useState<number>(model?.scale || 1);
  const [modelRotation, setModelRotation] = useState<number>(0);
  const [isARMode, setIsARMode] = useState(false); // 3D view por defecto

  // Log cuando cambia el modelo
  useEffect(() => {
    if (model) {
      console.log('🎯 ARViewer - Model loaded:', {
        id: model.id,
        name: model.name,
        type: model.type,
        path: model.path,
        scale: model.scale
      });
      setModelScale(model.scale || 1);
      setModelRotation(0);
    } else {
      console.log('🎯 ARViewer - No model selected');
    }
  }, [model]);

  // Memoizar callbacks para evitar re-renders innecesarios
  const handleScaleChange = useCallback((scale: number) => {
    setModelScale(scale);
  }, []);

  const handleRotationChange = useCallback((rotation: number) => {
    setModelRotation(rotation);
  }, []);

  const toggleARMode = useCallback(() => {
    setIsARMode(prev => !prev);
  }, []);

  // Memoizar configuración del Canvas
  const canvasConfig = useMemo(() => ({
    camera: { position: [0, 0, 2] as [number, number, number], fov: 75 },
    gl: {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false, // Importante para transparencia correcta
      powerPreference: 'high-performance' as const,
      preserveDrawingBuffer: false,
      stencil: false,
      depth: true
    },
    // Configurar el renderer para que tenga fondo transparente
    onCreated: ({ gl, scene, camera }: any) => {
      console.log('🎨 Configurando contexto WebGL para transparencia');
      
      // Configurar el contexto WebGL para transparencia
      const context = gl.getContext() as WebGLRenderingContext;
      if (context) {
        // Asegurar que el contexto tenga alpha habilitado
        console.log('🎨 Contexto WebGL:', {
          alpha: context.getContextAttributes()?.alpha,
          premultipliedAlpha: context.getContextAttributes()?.premultipliedAlpha
        });
      }
      
      // Configurar el renderer para fondo transparente
      gl.setClearColor(0x000000, 0); // Negro con alpha 0 (completamente transparente)
      
      // Asegurar que el canvas tenga fondo transparente
      if (gl.domElement) {
        gl.domElement.style.background = 'transparent';
        gl.domElement.style.backgroundColor = 'transparent';
        
        // Log del estado del canvas
        const computedStyle = window.getComputedStyle(gl.domElement);
        console.log('🎨 Estado del canvas:', {
          display: computedStyle.display,
          background: computedStyle.background,
          backgroundColor: computedStyle.backgroundColor,
          zIndex: computedStyle.zIndex,
          opacity: computedStyle.opacity
        });
      }
      
      // Log del estado del contenedor
      if (gl.domElement?.parentElement) {
        const containerStyle = window.getComputedStyle(gl.domElement.parentElement);
        console.log('📦 Estado del contenedor:', {
          background: containerStyle.background,
          backgroundColor: containerStyle.backgroundColor
        });
      }
    }
  }), []);

  // Memoizar rotación y escala del modelo
  const modelTransform = useMemo(() => ({
    rotation: [0, (modelRotation * Math.PI) / 180, 0] as [number, number, number],
    scale: [modelScale, modelScale, modelScale] as [number, number, number]
  }), [modelRotation, modelScale]);

  useEffect(() => {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setHasCameraPermission(false);
      setCameraError('Camera API not available in this environment');
      return;
    }

    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      } catch (err: any) {
        console.error('Failed to get camera permission', err);
        setCameraError('Camera access is required for the AR experience. Please grant permission in your browser settings.');
        setHasCameraPermission(false);
      }
    };
    
    // Pequeño delay para evitar problemas de hidratación
    const timer = setTimeout(() => {
      checkPermission();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (hasCameraPermission === null) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
          <p className="text-white text-sm">Initializing AR...</p>
        </div>
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
    <div 
      className="absolute inset-0 w-full h-full" 
      style={{ 
        background: 'transparent',
        backgroundColor: 'transparent'
      }}
    >
      <Canvas 
        camera={canvasConfig.camera} 
        gl={canvasConfig.gl}
        onCreated={canvasConfig.onCreated}
        style={{ 
          background: 'transparent',
          backgroundColor: 'transparent'
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 2]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        
        <Suspense fallback={null}>
          {/* Renderizar el fondo de la cámara primero para que esté detrás */}
          {isARMode && (
            <CameraBackground onError={setCameraError} />
          )}
          
          {/* Renderizar el modelo después para que esté delante */}
          {model && (
            <group 
              rotation={modelTransform.rotation}
              scale={modelTransform.scale}
              renderOrder={1}
            >
              {model.type === '3d-model' && (
                <>
                  <ModelScene path={model.path} scale={1} />
                  <ContactShadows 
                    position={[0, -1, 0]} 
                    opacity={0.4} 
                    scale={10} 
                    blur={2} 
                    far={4.5} 
                  />
                </>
              )}
              {(model.type === 'video' || model.type === 'image') && (
                <MediaScene path={model.path} type={model.type} scale={modelScale} />
              )}
            </group>
          )}
        </Suspense>

        {model && (
          <>
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
          </>
        )}
      </Canvas>

      {model && (
        <ARControls
          model={model}
          onScaleChange={handleScaleChange}
          onRotationChange={handleRotationChange}
          scale={modelScale}
          rotation={modelRotation}
        />
      )}

      {!model && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
          <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl max-w-md mx-4">
            <Box className="mx-auto h-12 w-12 text-primary"/>
            <h2 className="mt-4 text-2xl font-bold text-card-foreground">Welcome to the AR Platform</h2>
            <p className="text-muted-foreground mt-2">
              Select a model from the list below to get started.
            </p>
          </div>
        </div>
      )}

      {/* Toggle AR Mode */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-20 right-4 z-20"
        onClick={toggleARMode}
        title={isARMode ? 'Switch to 3D View' : 'Switch to AR View'}
      >
        {isARMode ? <VideoOff className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
      </Button>
    </div>
  );
};

// Export default para compatibilidad con dynamic import
export default ARViewer;

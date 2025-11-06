'use client';

import { useState, useRef, useEffect, FC } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, VideoOff, RefreshCw, Box } from 'lucide-react';
import type { Model } from '@/lib/models';

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: FC<ARViewerProps> = ({ model }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const videoModelRef = useRef<HTMLVideoElement>(null);

  const setupCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraError(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access the camera. Please grant permission and try again.');
        setCameraError(true);
      }
    } else {
      setError('Your browser does not support camera access.');
      setCameraError(true);
    }
  };

  useEffect(() => {
    setupCamera();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (canvasRef.current) {
        camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous model
    const toRemove = scene.children.filter(child => child.type === "Group");
    toRemove.forEach(child => scene.remove(child));
    if (videoModelRef.current) {
      videoModelRef.current.src = '';
      videoModelRef.current.style.display = 'none';
    }

    if (!model) return;
    
    setLoading(true);
    setError(null);
    
    if (model.type === 'video') {
      if (videoModelRef.current) {
        videoModelRef.current.src = model.path;
        videoModelRef.current.style.display = 'block';
        videoModelRef.current.play();
      }
      setLoading(false);
      return;
    }

    const loader = new GLTFLoader();
    loader.load(
      model.path,
      (gltf) => {
        const loadedModel = gltf.scene;
        loadedModel.scale.set(model.scale, model.scale, model.scale);
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.sub(center);
        
        scene.add(loadedModel);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading model:', err);
        setError(`Failed to load model: ${model.name}. Ensure the file exists at public${model.path}.`);
        setLoading(false);
      }
    );

  }, [model]);

  return (
    <div className="relative flex-1 w-full overflow-hidden bg-black">
      <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <video ref={videoModelRef} loop playsInline muted className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-auto w-auto max-h-[80%] max-w-[90%]" style={{display: 'none'}} />
      
      {(loading || error || cameraError || !model) && (
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
                    {(cameraError || error.includes('camera')) && <Button onClick={setupCamera} className="mt-2"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>}
                  </AlertDescription>
                </Alert>
              )}
              {cameraError && !error?.includes('camera') && (
                <Alert variant="destructive">
                  <VideoOff className="h-4 w-4" />
                  <AlertTitle>Camera Not Available</AlertTitle>
                  <AlertDescription>
                    Could not access camera. Please check permissions.
                    <Button onClick={setupCamera} className="mt-4"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>
                  </AlertDescription>
                </Alert>
              )}
              {!model && !loading && !error && !cameraError && (
                 <div className="text-center p-8 bg-card/80 rounded-lg shadow-2xl">
                   <Box className="mx-auto h-12 w-12 text-primary"/>
                   <h2 className="mt-4 text-2xl font-bold text-card-foreground">Welcome to AR Explorer</h2>
                   <p className="text-muted-foreground mt-2">Select a model from the list below to place it in your world.</p>
                 </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

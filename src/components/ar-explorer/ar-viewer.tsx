'use client';

import { useState, useRef, useEffect, FC } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Box, RefreshCw } from 'lucide-react';
import type { Model } from '@/lib/models';

interface ARViewerProps {
  model: Model | null;
}

export const ARViewer: FC<ARViewerProps> = ({ model }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoModelRef = useRef<HTMLVideoElement>(null);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
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
        const parent = canvasRef.current.parentElement;
        if (parent) {
          camera.aspect = parent.clientWidth / parent.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(parent.clientWidth, parent.clientHeight);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    const parentElement = canvasRef.current?.parentElement;
    const resizeObserver = new ResizeObserver(() => {
        handleResize();
    });

    if (parentElement) {
      resizeObserver.observe(parentElement);
    }
    
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (parentElement) {
        resizeObserver.unobserve(parentElement);
      }
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const toRemove = scene.children.filter(child => child.name === "loaded_model");
    toRemove.forEach(child => scene.remove(child));
    
    if(canvasRef.current) canvasRef.current.style.display = 'none';
    if (videoModelRef.current) {
      videoModelRef.current.src = '';
      videoModelRef.current.style.display = 'none';
    }

    if (!model) return;
    
    setLoading(true);
    setError(null);
    
    if (model.type === 'video' || model.type === 'image') {
       if (videoModelRef.current) {
        videoModelRef.current.style.display = 'block';
        videoModelRef.current.src = model.path;
        videoModelRef.current.play();
      }
      setLoading(false);
      return;
    }
    
    if (model.type === '3d-model') {
        if(canvasRef.current) canvasRef.current.style.display = 'block';
        const loader = new GLTFLoader();
        loader.load(
          model.path,
          (gltf) => {
            const loadedModel = gltf.scene;
            loadedModel.name = "loaded_model";
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
            setError(`Failed to load model: ${model.name}.`);
            setLoading(false);
          }
        );
    }

  }, [model]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{display: 'none'}}/>
      <video ref={videoModelRef} loop playsInline muted className="w-full h-full" style={{display: 'none', objectFit: 'contain', width: '90%', height: '90%', margin: 'auto'}} />
      
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

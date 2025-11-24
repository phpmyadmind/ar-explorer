'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { Model } from '@/lib/models';

interface ARViewerWrapperProps {
  model: Model | null;
}

export function ARViewerWrapper({ model }: ARViewerWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [ARViewer, setARViewer] = useState<React.ComponentType<{ model: Model | null }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Asegurar que solo se carga en el cliente
    if (typeof window === 'undefined') return;
    
    // Evitar cargar múltiples veces
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Esperar a que el DOM y React estén completamente listos
    const loadComponent = async () => {
      try {
        // Esperar a que React esté completamente inicializado
        // Verificar que React está disponible antes de cargar React Three Fiber
        const waitForReact = () => {
          return new Promise<void>((resolve) => {
            const checkReact = () => {
              // Verificar que React está disponible
              try {
                // @ts-ignore
                if (typeof window !== 'undefined' && window.__REACT_LOADED__) {
                  // Esperar un frame adicional para asegurar que React está completamente inicializado
                  requestAnimationFrame(() => {
                    setTimeout(resolve, 150);
                  });
                } else {
                  // Si no está disponible, esperar un poco más
                  setTimeout(checkReact, 50);
                }
              } catch (e) {
                // Si hay error, esperar un poco más
                setTimeout(checkReact, 50);
              }
            };
            
            // Iniciar verificación después de un pequeño delay
            setTimeout(checkReact, 100);
          });
        };
        
        await waitForReact();

        // Cargar el módulo de forma dinámica
        const mod = await import('./ar-viewer');
        
        if (mod && mod.ARViewer) {
          setARViewer(() => mod.ARViewer);
          setMounted(true);
        } else if (mod && mod.default) {
          setARViewer(() => mod.default);
          setMounted(true);
        } else {
          setError('ARViewer component not found in module');
        }
      } catch (err: any) {
        console.error('Error loading ARViewer:', err);
        setError(err.message || 'Failed to load AR Viewer. Please refresh the page.');
        loadingRef.current = false;
      }
    };

    loadComponent();
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="text-center p-4 max-w-md">
          <p className="text-destructive mb-2 font-semibold">Error loading AR Viewer</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              loadingRef.current = false;
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!mounted || !ARViewer) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading AR Viewer...</p>
        </div>
      </div>
    );
  }

  try {
    return <ARViewer model={model} />;
  } catch (err: any) {
    console.error('Error rendering ARViewer:', err);
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="text-center p-4">
          <p className="text-destructive mb-2">Error rendering AR Viewer</p>
          <p className="text-sm text-muted-foreground">{err.message}</p>
        </div>
      </div>
    );
  }
}


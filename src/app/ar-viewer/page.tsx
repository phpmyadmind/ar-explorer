'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirige /ar-viewer a la raíz / manteniendo el parámetro model
 * Esto mantiene compatibilidad con URLs antiguas
 */
function ARViewerRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelId = searchParams.get('model');

  useEffect(() => {
    // Redirigir a la raíz con el mismo parámetro model
    if (modelId) {
      router.replace(`/?model=${modelId}`);
    } else {
      router.replace('/');
    }
  }, [modelId, router]);

  return (
    <div className="flex h-svh w-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

export default function ARViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <ARViewerRedirect />
    </Suspense>
  );
}

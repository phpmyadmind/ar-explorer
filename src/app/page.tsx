'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ar-explorer/header';
import { ARViewer } from '@/components/ar-explorer/ar-viewer';
import { ModelSelector } from '@/components/ar-explorer/model-selector';
import { models, type Model } from '@/lib/models';
import { Toaster } from '@/components/ui/toaster';

function HomePageContent() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const searchParams = useSearchParams();
  const modelIdFromUrl = searchParams.get('model');

  useEffect(() => {
    if (modelIdFromUrl) {
      const model = models.find(m => m.id === modelIdFromUrl) || null;
      setSelectedModel(model);
    }
  }, [modelIdFromUrl]);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
  };

  return (
    <div className="flex h-svh w-full flex-col bg-background text-foreground">
      <Header />
      <main className="relative flex-1 overflow-hidden">
        <ARViewer model={selectedModel} />
        <ModelSelector models={models} selectedModelId={selectedModel?.id ?? null} onSelectModel={handleSelectModel} />
      </main>
      <Toaster />
    </div>
  );
}

export default function Home() {
  return (
    <HomePageContent />
  );
}

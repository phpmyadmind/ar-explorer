'use client';
import { useState } from 'react';
import { Header } from '@/components/ar-explorer/header';
import { ARViewer } from '@/components/ar-explorer/ar-viewer';
import { ModelSelector } from '@/components/ar-explorer/model-selector';
import { models, type Model } from '@/lib/models';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model);
  };

  return (
    <div className="flex h-svh w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <ARViewer model={selectedModel} />
        <ModelSelector models={models} selectedModelId={selectedModel?.id ?? null} onSelectModel={handleSelectModel} />
      </main>
      <Toaster />
    </div>
  );
}

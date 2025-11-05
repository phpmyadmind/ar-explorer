'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Model } from '@/lib/models';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  models: Model[];
  selectedModelId: string | null;
  onSelectModel: (model: Model) => void;
}

export const ModelSelector: FC<ModelSelectorProps> = ({ models, selectedModelId, onSelectModel }) => {
  return (
    <div className="w-full border-t bg-background/80 p-4 backdrop-blur-sm z-10">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <div className="flex w-max space-x-4">
          {models.map((model) => (
            <Card
              key={model.id}
              onClick={() => onSelectModel(model)}
              className={cn(
                'group h-40 w-48 shrink-0 cursor-pointer overflow-hidden transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                selectedModelId === model.id ? 'ring-2 ring-primary shadow-lg' : 'ring-0'
              )}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectModel(model)}
            >
              <CardContent className="relative h-full p-0">
                {model.previewImage && (
                    <Image
                      src={model.previewImage}
                      alt={`Preview of ${model.name}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint="product photo"
                      sizes="200px"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3">
                  <h3 className="font-semibold text-primary-foreground">{model.name}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

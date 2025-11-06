'use client';

import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import type { Model } from '@/lib/models';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  models: Model[];
  selectedModelId: string | null;
  onSelectModel: (model: Model) => void;
}

export const ModelSelector: FC<ModelSelectorProps> = ({ models, selectedModelId, onSelectModel }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrModel, setQrModel] = useState<Model | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  useEffect(() => {
    if (qrModel && typeof window !== 'undefined') {
      const url = `${window.location.origin}/?model=${qrModel.id}`;
      QRCode.toDataURL(url, { width: 300, margin: 2 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [qrModel]);

  const openQrDialog = (model: Model, event: React.MouseEvent) => {
    event.stopPropagation();
    setQrModel(model);
    setIsQrDialogOpen(true);
  };

  if (models.length === 0) {
    return (
       <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/50 to-transparent p-4 z-10">
         <div className="text-center text-white p-4 bg-black/30 rounded-lg">
            No models available. Please add some in the admin panel.
         </div>
       </div>
    )
  }

  return (
    <>
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/50 to-transparent p-4 z-10">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
          <div className="flex w-max space-x-4">
            {models.map((model) => (
              <Card
                key={model.id}
                onClick={() => onSelectModel(model)}
                className={cn(
                  'group h-32 w-40 shrink-0 cursor-pointer overflow-hidden transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
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
                        unoptimized // Required for external URLs without specific hostnames in next.config.js
                      />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                      onClick={(e) => openQrDialog(model, e)}
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="sr-only">Show QR Code</span>
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 p-3">
                    <h3 className="font-semibold text-primary-foreground text-sm">{model.name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">{qrModel?.name}</DialogTitle>
            <DialogDescription className="text-center">
              Scan this code to view the AR experience on another device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} alt={`QR Code for ${qrModel?.name}`} width={300} height={300} className="rounded-lg border"/>
            ) : (
              <div className="h-[300px] w-[300px] animate-pulse rounded-lg bg-muted" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

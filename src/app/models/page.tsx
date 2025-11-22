// src/app/models/page.tsx
'use client';

import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, Info, Loader2, AlertCircle } from 'lucide-react';
import type { Model } from '@/lib/models';
import { staticModels } from '@/lib/models';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL = 'http://localhost:5000/api';

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrModel, setQrModel] = useState<Model | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/resources`);
      if (!response.ok) {
        throw new Error('Backend not available. Falling back to static content.');
      }
      const data = await response.json();
      const formattedModels: Model[] = data.map((item: any) => ({
        id: item.uuid,
        name: item.name,
        path: `http://localhost:5000${item.content_url}`,
        previewImage: `http://localhost:5000${item.qr_code_url}`,
        scale: item.type === '3d-model' ? 0.015 : 1, // Escala por defecto
        description: item.name,
        type: item.type,
        url: `/?model=${item.uuid}`,
      }));
      setModels(formattedModels.concat(staticModels));
    } catch (err: any) {
      console.warn(err.message);
      setError('Could not connect to the backend. Displaying static models only.');
      setModels(staticModels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);


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
  
  const handleSelectModel = (model: Model) => {
    router.push(`/?model=${model.id}`);
  };

  if (loading) {
     return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
          <CardHeader>
             <CardTitle>Select a Model</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {models.map((model) => (
                <Card
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className='group shrink-0 cursor-pointer overflow-hidden transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aspect-square'
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectModel(model)}
                >
                    <CardContent className="relative h-full p-0">
                    {model.previewImage && (
                        <Image
                            src={model.previewImage}
                            alt={`Preview of ${model.name}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint="product photo"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            unoptimized
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute top-1 right-1 flex gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                    >
                                    <Info className="h-4 w-4" />
                                    <span className="sr-only">Show Info</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center">
                                    <p className="text-sm text-muted-foreground">{model.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                        onClick={(e) => openQrDialog(model, e)}
                        >
                        <QrCode className="h-4 w-4" />
                        <span className="sr-only">Show QR Code</span>
                        </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 p-2">
                        <h3 className="font-semibold text-primary-foreground text-sm">{model.name}</h3>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
            { !loading && models.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                    No models available. Go to the "Contents" section to add resources.
                </div>
            )}
        </CardContent>
      </Card>

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

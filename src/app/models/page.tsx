'use client';

import { FC, useState, useEffect, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { QrCode, Info, Loader2, AlertCircle, RefreshCw, Play, Box } from 'lucide-react';
import type { Model } from '@/lib/models';
import { useARModels } from '@/hooks/use-ar-models';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ModelsPage() {
  const { models, loading, error, refetch } = useARModels();
  const router = useRouter();

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrModel, setQrModel] = useState<Model | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  useEffect(() => {
    if (qrModel && typeof window !== 'undefined') {
      const url = `${window.location.origin}/?model=${qrModel.id}`;
      QRCode.toDataURL(url, { 
        width: 300, 
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [qrModel]);

  const openQrDialog = useCallback((model: Model, event: React.MouseEvent) => {
    event.stopPropagation();
    setQrModel(model);
    setIsQrDialogOpen(true);
  }, []);
  
  const handleSelectModel = useCallback((model: Model) => {
    router.push(`/?model=${model.id}`);
  }, [router]);

  const getTypeBadgeColor = useCallback((type: string) => {
    switch (type) {
      case '3d-model':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'video':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'image':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AR Models Library</CardTitle>
            <CardDescription>
              Select a model to view in AR or generate a QR code to share
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Notice</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {models.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No models available</p>
              <p className="text-sm mb-4">Go to the "Contents" section to add resources.</p>
              <Button asChild>
                <a href="/contents">Add Resources</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {models.map((model) => {
                const badgeColor = getTypeBadgeColor(model.type);
                return (
                <Card
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className='group shrink-0 cursor-pointer overflow-hidden transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aspect-square relative'
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
                        sizes="(max-width: 768px) 50vw, 33vw"
                        unoptimized
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    
                    {/* Badge de tipo */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className={cn("text-xs", badgeColor)}>
                        {model.type.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectModel(model);
                              }}
                            >
                              <Play className="h-4 w-4" />
                              <span className="sr-only">View in AR</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>View in AR</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm"
                              onClick={(e) => openQrDialog(model, e)}
                            >
                              <QrCode className="h-4 w-4" />
                              <span className="sr-only">Show QR Code</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Generate QR Code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Show Info</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center">
                            <p className="text-sm">{model.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Nombre del modelo */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 drop-shadow-lg">
                        {model.name}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">{qrModel?.name}</DialogTitle>
            <DialogDescription className="text-center">
              Scan this QR code to view the AR experience on another device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {qrCodeUrl ? (
              <Image 
                src={qrCodeUrl} 
                alt={`QR Code for ${qrModel?.name}`} 
                width={300} 
                height={300} 
                className="rounded-lg border"
              />
            ) : (
              <div className="h-[300px] w-[300px] animate-pulse rounded-lg bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          {qrModel && typeof window !== 'undefined' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Share this code to access:</p>
              <p className="font-mono text-xs mt-1 break-all">{window.location.origin}/?model={qrModel.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

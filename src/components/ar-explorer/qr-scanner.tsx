
'use client';
import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { CameraOff } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string | null) => void;
  onError: (error: any) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reader = useRef(new BrowserMultiFormatReader());
  const { toast } = useToast();

  useEffect(() => {
    let controls: any;

    const startScan = async () => {
      if (!videoRef.current) return;
      try {
        controls = await reader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('QR Scan Error:', err);
          }
        });
      } catch (error: any) {
        console.error('Error initializing scanner:', error);
        onError(error);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    
    startScan();

    return () => {
      if (controls) {
        controls.stop();
      } else {
        reader.current.reset();
      }
    };
  }, [onScan, onError, toast]);

  return (
    <div>
        <video ref={videoRef} className="w-full h-full object-cover" />
        <div className="absolute inset-0 border-4 border-primary/50 rounded-lg m-8 pointer-events-none" style={{
            clipPath: 'polygon(0% 0%, 0% 25%, 5% 25%, 5% 5%, 25% 5%, 25% 0%, 75% 0%, 75% 5%, 95% 5%, 95% 25%, 100% 25%, 100% 75%, 95% 75%, 95% 95%, 75% 95%, 75% 100%, 25% 100%, 25% 95%, 5% 95%, 5% 75%, 0% 75%)'
        }}></div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, FC } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, VideoOff } from 'lucide-react';

export const CameraView: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  const setupCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraError(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access the camera. Please grant permission and try again.');
        setCameraError(true);
      }
    } else {
      setError('Your browser does not support camera access.');
      setCameraError(true);
    }
  };

  useEffect(() => {
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
     <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
       {(error || cameraError) && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm transition-opacity duration-300">
            <div className="max-w-md w-full p-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>An Error Occurred</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    {error}
                    {(cameraError || error.includes('camera')) && <Button onClick={setupCamera} className="mt-2"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>}
                  </AlertDescription>
                </Alert>
              )}
              {cameraError && !error?.includes('camera') && (
                <Alert variant="destructive">
                  <VideoOff className="h-4 w-4" />
                  <AlertTitle>Camera Not Available</AlertTitle>
                  <AlertDescription>
                    Could not access camera. Please check permissions.
                    <Button onClick={setupCamera} className="mt-4"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

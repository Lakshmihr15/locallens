
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface CameraViewHandle {
  captureFrame: () => string | null;
}

interface CameraViewProps {
  isActive: boolean;
}

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(({ isActive }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (!videoRef.current || !canvasRef.current) return null;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }
      return null;
    }
  }));

  useEffect(() => {
    if (!isActive) return;
    
    // Setup GPS
    const geoId = navigator.geolocation.watchPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log("Geo error", err),
      { enableHighAccuracy: true }
    );

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    }
    setupCamera();

    return () => {
      navigator.geolocation.clearWatch(geoId);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover opacity-70 grayscale-[0.2]"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* HUD System Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        <div className="flex justify-between items-start opacity-40">
           <div className="flex flex-col gap-1">
             <div className="w-16 h-1 bg-blue-500/50" />
             <div className="w-8 h-1 bg-blue-500/30" />
           </div>
           <div className="text-[9px] font-black text-blue-500 text-right tracking-widest uppercase">
              Sensor Suite Active<br/>
              Optical Grid: 1080p
           </div>
        </div>

        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="w-12 h-12 border border-blue-500/30 rounded-full animate-pulse flex items-center justify-center">
              <div className="w-1 h-1 bg-blue-500 rounded-full" />
           </div>
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-blue-500/50" />
           <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-blue-500/50" />
           <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-blue-500/50" />
           <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-blue-500/50" />
        </div>

        {/* Data Stream HUD */}
        <div className="flex justify-between items-end opacity-60">
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-sm animate-bounce" />
                <span className="text-[10px] font-bold text-white tracking-widest">LAT: {coords?.lat.toFixed(4) || '0.0000'}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-sm animate-bounce [animation-delay:200ms]" />
                <span className="text-[10px] font-bold text-white tracking-widest">LNG: {coords?.lng.toFixed(4) || '0.0000'}</span>
             </div>
           </div>

           <div className="w-32 h-32 relative">
             {/* Radar Ring */}
             <div className="absolute inset-0 border border-blue-500/20 rounded-full"></div>
             <div className="absolute inset-4 border border-blue-500/10 rounded-full"></div>
             {/* Radar Sweep */}
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-transparent animate-[spin_4s_linear_infinite]" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-black text-blue-400">RADAR_MK1</div>
           </div>
        </div>
      </div>
    </div>
  );
});

export default CameraView;

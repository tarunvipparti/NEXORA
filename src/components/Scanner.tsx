import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { motion } from 'motion/react';
import { X, Camera, Image as ImageIcon, ShieldAlert, RefreshCcw, Info, ExternalLink, Lock, Settings } from 'lucide-react';

interface ScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onCancel, onImageUpload }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      setError(null);
      setIsPermissionDenied(false);
      
      if (!window.isSecureContext) {
        setError('Camera access requires a secure connection (HTTPS). Please ensure you are accessing the site via a secure URL.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API is not supported in this browser. Please use a modern browser like Chrome or Safari.');
        return;
      }

      try {
        // Try with environment facing mode first (ideal for QR scanning)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
        } catch (e) {
          // Fallback to any available camera if environment mode fails
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setIsPermissionDenied(true);
          setError('Camera access was denied. We need your permission to scan QR codes.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found on this device. Please ensure your camera is connected.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Camera is already in use by another application. Please close other apps using the camera and try again.');
        } else if (err.name === 'OverconstrainedError') {
          setError('The requested camera constraints could not be satisfied. Trying fallback...');
        } else {
          setError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
        }
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code) {
              onScan(code.data);
              return;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [onScan, retryCount]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-950 overflow-y-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                {isPermissionDenied ? (
                  <Lock className="w-10 h-10 text-red-500" />
                ) : (
                  <ShieldAlert className="w-10 h-10 text-red-500" />
                )}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">
              {isPermissionDenied ? 'Access Denied' : 'Camera Error'}
            </h3>
            <p className="text-white/60 text-sm mb-8 max-w-xs leading-relaxed">
              {isPermissionDenied 
                ? "SecureScan AI needs camera access to scan QR codes. Your browser has blocked this request."
                : error}
            </p>

            <div className="w-full max-w-xs space-y-3">
              <button 
                onClick={() => setRetryCount(prev => prev + 1)}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-white/90 active:scale-[0.95]"
              >
                <RefreshCcw size={18} />
                Try Again
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                  <span className="bg-zinc-950 px-4 text-white/40 font-bold">Recommended Fallback</span>
                </div>
              </div>

              <label className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.95] shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                <ImageIcon size={18} />
                <span>Upload QR from Gallery</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={onImageUpload}
                />
              </label>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                  <span className="bg-zinc-950 px-4 text-white/40 font-bold">Manual Entry</span>
                </div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const url = formData.get('url') as string;
                  if (url && onScan) onScan(url);
                }}
                className="flex gap-2"
              >
                <input 
                  name="url"
                  type="url" 
                  placeholder="Paste URL here..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-white/20"
                  required
                />
                <button 
                  type="submit"
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-white/60 hover:text-white"
                >
                  <ExternalLink size={18} />
                </button>
              </form>

              <button 
                onClick={onCancel}
                className="w-full text-white/30 text-xs font-bold uppercase tracking-widest hover:text-white/60 transition-colors pt-6"
              >
                ← Back to Home
              </button>
            </div>

            {isPermissionDenied && (
              <div className="mt-8 p-5 bg-red-500/5 rounded-2xl border border-red-500/20 text-left w-full max-w-xs">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                  <Settings size={12} />
                  How to enable camera
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/80 mb-1">Desktop (Chrome/Edge/Safari)</p>
                    <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-4">
                      <li>Click the <b>lock icon</b> in the address bar.</li>
                      <li>Toggle <b>Camera</b> to "On" or "Allow".</li>
                      <li>Refresh the page.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/80 mb-1">Mobile (iOS/Android)</p>
                    <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-4">
                      <li>Check <b>Settings &gt; Browser &gt; Camera</b>.</li>
                      <li>Ensure <b>SecureScan AI</b> has permission.</li>
                      <li>Close and reopen the browser tab.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {!isPermissionDenied && (
              <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/5 text-left w-full max-w-xs">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                  <Info size={12} />
                  Troubleshooting Guide
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/80 mb-1">Desktop (Chrome/Edge/Safari)</p>
                    <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-4">
                      <li>Click the <b>lock icon</b> in the address bar.</li>
                      <li>Toggle <b>Camera</b> to "On" or "Allow".</li>
                      <li>Refresh the page.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/80 mb-1">Mobile (iOS/Android)</p>
                    <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-4">
                      <li>Check <b>Settings &gt; Browser &gt; Camera</b>.</li>
                      <li>Ensure <b>SecureScan AI</b> has permission.</li>
                      <li>Close and reopen the browser tab.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64 border-2 border-white/30 rounded-3xl overflow-hidden">
                <motion.div 
                  className="absolute inset-x-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              </div>
            </div>

            <div className="absolute top-12 left-0 right-0 text-center">
              <p className="text-white text-sm font-mono tracking-widest uppercase opacity-80">
                Scanning for threats...
              </p>
            </div>
          </>
        )}
      </div>

      <div className="p-8 bg-zinc-900/90 backdrop-blur-md flex justify-center">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-medium border border-white/10 transition-colors"
        >
          <X size={20} />
          Cancel Scan
        </button>
      </div>
    </div>
  );
};

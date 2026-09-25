'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Smartphone,
  Video,
  VideoOff,
  RefreshCw,
  Radio,
  AlertCircle,
  Camera,
  Maximize2,
  Minimize2,
  Lock,
  Wifi,
} from 'lucide-react';
import { createTransmitterSession } from '@/lib/monitoring/webrtc-streamer';

function RemoteCameraContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || 'default_session';

  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connecting' | 'connected' | 'disconnected'>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionCleanupRef = useRef<(() => void) | null>(null);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const target = containerRef.current || document.documentElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const startMobileCamera = async (selectedFacing: 'environment' | 'user') => {
    try {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Vertical 9:16 portrait constraints for mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: selectedFacing },
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 9 / 16 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      setIsStreaming(true);

      // Start WebRTC Transmitter Session
      if (sessionCleanupRef.current) {
        sessionCleanupRef.current();
      }

      const { cleanup } = await createTransmitterSession(sessionId, stream, (status) => {
        setConnectionStatus(status);
      });

      sessionCleanupRef.current = cleanup;
    } catch (err: any) {
      console.error('Error starting mobile camera:', err);
      // Fallback with basic constraints if resolution was rejected
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: selectedFacing },
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(console.error);
        }
        setIsStreaming(true);
        if (sessionCleanupRef.current) sessionCleanupRef.current();
        const { cleanup } = await createTransmitterSession(sessionId, fallbackStream, (status) => {
          setConnectionStatus(status);
        });
        sessionCleanupRef.current = cleanup;
      } catch (fallbackErr: any) {
        setErrorMessage('No se pudo acceder a la cámara del teléfono: ' + (err.message || err.name));
      }
    }
  };

  const stopMobileCamera = () => {
    if (sessionCleanupRef.current) {
      sessionCleanupRef.current();
      sessionCleanupRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setConnectionStatus('waiting');
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startMobileCamera(nextMode);
  };

  useEffect(() => {
    startMobileCamera('environment');
    return () => {
      stopMobileCamera();
    };
  }, [sessionId]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-black text-white flex flex-col justify-between overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Background Vertical Video Stream Viewport */}
      <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Permission / Tap to Start Overlay if camera is off */}
        {!isStreaming && (
          <div
            onClick={() => startMobileCamera(facingMode)}
            className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center cursor-pointer space-y-4 active:bg-slate-900 transition-colors"
          >
            <div className="w-20 h-20 rounded-full bg-[#0070F2]/20 text-[#0070F2] flex items-center justify-center animate-pulse">
              <Camera size={40} />
            </div>
            <div>
              <p className="text-base font-bold text-white">Toca para Iniciar Cámara Vertical</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Permite el acceso a la cámara para transmitir directamente al panel central de monitoreo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Top Floating Bar */}
      <div className="relative z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-auto bg-linear-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0070F2] text-white flex items-center justify-center shadow-md">
            <Smartphone size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight drop-shadow-md">Cámara Móvil RIS3</span>
            <span className="text-[10px] text-slate-300 font-mono drop-shadow-md">
              ID: {sessionId.slice(0, 8)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-md ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                : 'bg-blue-500/30 text-blue-200 border-blue-400/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-ping'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400'
                  : 'bg-blue-400'
              }`}
            />
            {connectionStatus === 'connected'
              ? 'EN VIVO'
              : connectionStatus === 'connecting'
              ? 'CONECTANDO'
              : 'LISTO'}
          </span>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md active:scale-95"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="relative z-30 mx-4 p-3 bg-rose-600/90 backdrop-blur-md border border-rose-400 rounded-xl text-white text-xs flex items-center gap-2 shadow-xl">
          <AlertCircle size={16} className="shrink-0 text-rose-200" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bottom Camera Controls (Floating over video) */}
      <div className="relative z-30 p-4 sm:p-6 bg-linear-to-t from-black/90 via-black/50 to-transparent space-y-4 pointer-events-auto">
        
        {/* Info Pill */}
        <div className="flex items-center justify-center">
          <div className="px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300 flex items-center gap-2">
            <Radio size={12} className={isStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
            <span>
              {facingMode === 'environment' ? 'Lente Trasera (Principal)' : 'Lente Frontal (Selfie)'}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {/* Flip Camera Button */}
          <button
            onClick={toggleFacingMode}
            className="w-13 h-13 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
            title="Girar Cámara"
          >
            <RefreshCw size={22} className="text-slate-200" />
          </button>

          {/* Main Shutter / Stream Toggle Button */}
          {!isStreaming ? (
            <button
              onClick={() => startMobileCamera(facingMode)}
              className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/30 active:scale-95 transition-all cursor-pointer"
              title="Iniciar Transmisión"
            >
              <Video size={28} />
            </button>
          ) : (
            <button
              onClick={stopMobileCamera}
              className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl ring-4 ring-rose-400/30 active:scale-95 transition-all cursor-pointer"
              title="Detener Transmisión"
            >
              <VideoOff size={28} />
            </button>
          )}

          {/* Fullscreen Quick Button */}
          <button
            onClick={toggleFullscreen}
            className="w-13 h-13 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Agrandar Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 size={22} className="text-slate-200" /> : <Maximize2 size={22} className="text-slate-200" />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function RemoteCameraPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs font-semibold">
          Cargando transmisor móvil...
        </div>
      }
    >
      <RemoteCameraContent />
    </Suspense>
  );
}

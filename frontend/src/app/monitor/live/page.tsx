'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import { ICamera } from '@/lib/monitoring/types';
import {
  Tv,
  LayoutGrid,
  Square,
  Grid3X3,
  Maximize2,
  Cctv,
  Users,
  Activity,
  AlertCircle,
  RefreshCw,
  Plus,
  Sliders,
  Camera,
  Video,
  VideoOff,
  Zap,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function MonitoringLivePage() {
  const { cameras, loadingCameras, refreshCameras } = useMonitoring();
  const [layoutGrid, setLayoutGrid] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [expandedCam, setExpandedCam] = useState<ICamera | null>(null);

  // Live WebCam & Multi-Person Tracking State
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [currentZoneLabel, setCurrentZoneLabel] = useState('Sector Central');
  const [distanceScaleLabel, setDistanceScaleLabel] = useState('Media Distancia');
  const [confidenceScore, setConfidenceScore] = useState(98);
  const [headColor, setHeadColor] = useState('#00FF66'); // Verde Neón por defecto
  const [bodyColor, setBodyColor] = useState('#0066FF'); // Azul Eléctrico por defecto
  const [boxThickness, setBoxThickness] = useState<number>(6); // Líneas gruesas bien marcadas
  const [aiEngineStatus, setAiEngineStatus] = useState<'loading' | 'mediapipe_gpu' | 'cv_heuristic'>('loading');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mpDetectorRef = useRef<any>(null);

  // Multi-person tracker state
  const personsRef = useRef<{
    persons: Array<{
      id: number;
      headX: number;
      headY: number;
      headW: number;
      headH: number;
      targetHeadX: number;
      targetHeadY: number;
      targetHeadW: number;
      targetHeadH: number;
      bodyX: number;
      bodyY: number;
      bodyW: number;
      bodyH: number;
      targetBodyX: number;
      targetBodyY: number;
      targetBodyW: number;
      targetBodyH: number;
      confidence: number;
      colorHead: string;
      colorBody: string;
      distanceLabel: string;
      zoneLabel: string;
      lastSeen: number;
    }>;
    lastVideoTime: number;
    nextId: number;
  }>({
    persons: [],
    lastVideoTime: -1,
    nextId: 1,
  });

  const PERSON_COLORS = [
    { head: '#00FF66', body: '#0066FF' }, // Persona 1: Verde / Azul
    { head: '#FF0033', body: '#9333EA' }, // Persona 2: Rojo / Púrpura
    { head: '#FFE600', body: '#00E5FF' }, // Persona 3: Amarillo / Cyan
    { head: '#FF007F', body: '#FF6600' }, // Persona 4: Magenta / Naranja
    { head: '#00F0FF', body: '#10B981' }, // Persona 5: Cyan / Esmeralda
  ];

  // Load MediaPipe BlazeFace Neural Network on GPU (Multi-face detection)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );
        if (!isMounted) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          minDetectionConfidence: 0.4,
          runningMode: 'VIDEO',
        });

        if (isMounted) {
          mpDetectorRef.current = detector;
          setAiEngineStatus('mediapipe_gpu');
        }
      } catch (err) {
        if (isMounted) setAiEngineStatus('cv_heuristic');
      }
    }

    initMediaPipe();
    return () => {
      isMounted = false;
    };
  }, []);

  const startWebcam = async () => {
    try {
      // Intentar primero con resolución HD ideal
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        // Fallback universal para cualquier cámara web o integrada en Windows
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsWebcamActive(true);

      // Vincular inmediatamente si el elemento ya está montado
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error('Error al abrir webcam:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Permiso de cámara bloqueado en el navegador. Por favor haga clic en el ícono de cámara/candado en la barra de direcciones de su navegador y elija "Permitir".');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No se encontró ninguna cámara conectada en su equipo.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert('La cámara está siendo usada por otra aplicación (ej: Zoom, Meet, Teams u otra pestaña). Ciérrela e intente de nuevo.');
      } else {
        alert('No se pudo acceder a la cámara: ' + (err.message || err.name));
      }
    }
  };

  const stopWebcam = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    personsRef.current.persons = [];
    setDetectedCount(0);
    setIsWebcamActive(false);
  };

  // Asegurar enlace de stream cuando la tarjeta se monte en el DOM
  useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(console.error);
    }
  }, [isWebcamActive]);

  // Real-time Multi-Person AI Vision Tracking Loop
  useEffect(() => {
    if (!isWebcamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    const trackLoop = () => {
      if (!video || video.paused || video.ended || video.readyState < 2 || !ctx) {
        animFrameRef.current = requestAnimationFrame(trackLoop);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        animFrameRef.current = requestAnimationFrame(trackLoop);
        return;
      }

      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      frameCount++;
      const state = personsRef.current;
      const detector = mpDetectorRef.current;

      // 1. MULTI-PERSON NEURAL INFERENCE (Zero Console Errors)
      if (detector && video.currentTime !== state.lastVideoTime) {
        state.lastVideoTime = video.currentTime;
        try {
          const startTimeMs = performance.now();
          const results = detector.detectForVideo(video, startTimeMs);

          if (results && results.detections) {
            const detections = results.detections;
            setDetectedCount(detections.length);

            const unmatchedDetections: any[] = [];

            detections.forEach((det: any) => {
              const b = det.boundingBox;
              if (!b || b.width < 10 || b.height < 10) return;

              const scalePadW = b.width * 0.18;
              const scalePadH = b.height * 0.22;
              const targetHeadX = Math.max(0, b.originX - scalePadW);
              const targetHeadY = Math.max(0, b.originY - scalePadH);
              const targetHeadW = Math.min(vw - targetHeadX, b.width + scalePadW * 2);
              const targetHeadH = Math.min(vh - targetHeadY, b.height + scalePadH * 2.2);

              const targetBodyW = Math.min(vw - 20, Math.max(targetHeadW * 2.1, targetHeadW + 60));
              const targetBodyH = Math.min(vh - targetHeadY - targetHeadH * 0.7, targetHeadH * 2.6);
              const targetBodyX = Math.max(10, Math.min(vw - targetBodyW - 10, (targetHeadX + targetHeadW / 2) - targetBodyW / 2));
              const targetBodyY = Math.min(vh - 20, targetHeadY + targetHeadH * 0.88);

              const headCenterX = targetHeadX + targetHeadW / 2;
              const headCenterY = targetHeadY + targetHeadH / 2;

              const headRatio = targetHeadW / vw;
              const distLabel = headRatio > 0.36 ? 'Cercano (Zoom-In)' : headRatio < 0.16 ? 'Alejado (Zoom-Out)' : 'Media Distancia';
              const normX = headCenterX / vw;
              const zLabel = normX < 0.35 ? 'Sector Izquierdo' : normX > 0.65 ? 'Sector Derecho' : 'Sector Central';
              const conf = det.categories?.[0]?.score ? Math.round(det.categories[0].score * 100) : 98;

              // Match with existing tracked person
              let bestMatchIdx = -1;
              let bestDist = 99999;

              state.persons.forEach((p, idx) => {
                const curCenterX = p.targetHeadX + p.targetHeadW / 2;
                const curCenterY = p.targetHeadY + p.targetHeadH / 2;
                const dist = Math.hypot(headCenterX - curCenterX, headCenterY - curCenterY);
                if (dist < bestDist && dist < vw * 0.4) {
                  bestDist = dist;
                  bestMatchIdx = idx;
                }
              });

              if (bestMatchIdx >= 0) {
                const p = state.persons[bestMatchIdx];
                p.targetHeadX = targetHeadX;
                p.targetHeadY = targetHeadY;
                p.targetHeadW = targetHeadW;
                p.targetHeadH = targetHeadH;
                p.targetBodyX = targetBodyX;
                p.targetBodyY = targetBodyY;
                p.targetBodyW = targetBodyW;
                p.targetBodyH = targetBodyH;
                p.confidence = conf;
                p.distanceLabel = distLabel;
                p.zoneLabel = zLabel;
                p.lastSeen = frameCount;
              } else {
                unmatchedDetections.push({
                  targetHeadX,
                  targetHeadY,
                  targetHeadW,
                  targetHeadH,
                  targetBodyX,
                  targetBodyY,
                  targetBodyW,
                  targetBodyH,
                  confidence: conf,
                  distanceLabel: distLabel,
                  zoneLabel: zLabel,
                });
              }
            });

            // Register newly detected people
            unmatchedDetections.forEach((u) => {
              const newId = state.nextId++;
              const colorTheme = PERSON_COLORS[(newId - 1) % PERSON_COLORS.length];

              state.persons.push({
                id: newId,
                headX: u.targetHeadX,
                headY: u.targetHeadY,
                headW: u.targetHeadW,
                headH: u.targetHeadH,
                targetHeadX: u.targetHeadX,
                targetHeadY: u.targetHeadY,
                targetHeadW: u.targetHeadW,
                targetHeadH: u.targetHeadH,
                bodyX: u.targetBodyX,
                bodyY: u.targetBodyY,
                bodyW: u.targetBodyW,
                bodyH: u.targetBodyH,
                targetBodyX: u.targetBodyX,
                targetBodyY: u.targetBodyY,
                targetBodyW: u.targetBodyW,
                targetBodyH: u.targetBodyH,
                confidence: u.confidence,
                colorHead: colorTheme.head,
                colorBody: colorTheme.body,
                distanceLabel: u.distanceLabel,
                zoneLabel: u.zoneLabel,
                lastSeen: frameCount,
              });
            });

            // Remove lost persons (not seen in last 12 frames)
            state.persons = state.persons.filter((p) => frameCount - p.lastSeen < 12);

            // Update UI status
            if (state.persons.length > 0) {
              const p1 = state.persons[0];
              setCurrentZoneLabel(p1.zoneLabel);
              setDistanceScaleLabel(p1.distanceLabel);
              setConfidenceScore(p1.confidence);
            }
          }
        } catch {
          // Silent catch to prevent console issue pollution
        }
      }

      // ----------------------------------------------------
      // RENDER ALL TRACKED PERSONS ON CANVAS (No phantom wall boxes)
      // ----------------------------------------------------
      ctx.clearRect(0, 0, vw, vh);

      state.persons.forEach((person, index) => {
        // Fluid lerp tracking per person
        const alpha = 0.45;
        person.headX += (person.targetHeadX - person.headX) * alpha;
        person.headY += (person.targetHeadY - person.headY) * alpha;
        person.headW += (person.targetHeadW - person.headW) * alpha;
        person.headH += (person.targetHeadH - person.headH) * alpha;

        person.bodyX += (person.targetBodyX - person.bodyX) * 0.35;
        person.bodyY += (person.targetBodyY - person.bodyY) * 0.35;
        person.bodyW += (person.targetBodyW - person.bodyW) * 0.35;
        person.bodyH += (person.targetBodyH - person.bodyH) * 0.35;

        const hX = Math.round(person.headX);
        const hY = Math.round(person.headY);
        const hW = Math.round(person.headW);
        const hH = Math.round(person.headH);

        const bX = Math.round(person.bodyX);
        const bY = Math.round(person.bodyY);
        const bW = Math.round(person.bodyW);
        const bH = Math.round(person.bodyH);

        const pHeadColor = index === 0 ? headColor : person.colorHead;
        const pBodyColor = index === 0 ? bodyColor : person.colorBody;

        // 1. CUERPO / TORSO: Bold Square Box
        ctx.strokeStyle = pBodyColor;
        ctx.lineWidth = boxThickness;
        ctx.lineJoin = 'miter';
        ctx.strokeRect(bX, bY, bW, bH);

        // Body Corner Highlights
        const cLenB = Math.min(26, bW * 0.2);
        ctx.lineWidth = boxThickness + 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(bX, bY + cLenB);
        ctx.lineTo(bX, bY);
        ctx.lineTo(bX + cLenB, bY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bX + bW - cLenB, bY + bH);
        ctx.lineTo(bX + bW, bY + bH);
        ctx.lineTo(bX + bW, bY + bH - cLenB);
        ctx.stroke();

        // Body Badge Tag
        const bodyTagText = `CUERPO • #P-${person.id}`;
        ctx.fillStyle = pBodyColor;
        const bTagW = bodyTagText.length * 8.5 + 16;
        ctx.fillRect(bX, Math.max(0, bY - 26), bTagW, 26);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(bodyTagText, bX + 8, Math.max(18, bY - 8));

        // Body Zone & Distance Tag
        const zoneTagText = `#P-${person.id}: ${person.zoneLabel.toUpperCase()} • ${person.distanceLabel.toUpperCase()}`;
        ctx.fillStyle = '#FF9900';
        const zTagW = zoneTagText.length * 7.5 + 14;
        ctx.fillRect(bX + bW - zTagW, bY + bH - 24, zTagW, 24);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(zoneTagText, bX + bW - zTagW + 7, bY + bH - 7);

        // 2. CABEZA / ROSTRO: Bold Square Box
        ctx.strokeStyle = pHeadColor;
        ctx.lineWidth = boxThickness;
        ctx.strokeRect(hX, hY, hW, hH);

        // Head Corner Highlights
        const cLenH = Math.min(20, hW * 0.25);
        ctx.lineWidth = boxThickness + 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(hX, hY + cLenH);
        ctx.lineTo(hX, hY);
        ctx.lineTo(hX + cLenH, hY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hX + hW - cLenH, hY);
        ctx.lineTo(hX + hW, hY);
        ctx.lineTo(hX + hW, hY + cLenH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hX, hY + hH - cLenH);
        ctx.lineTo(hX, hY + hH);
        ctx.lineTo(hX + cLenH, hY + hH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hX + hW - cLenH, hY + hH);
        ctx.lineTo(hX + hW, hY + hH);
        ctx.lineTo(hX + hW, hY + hH - cLenH);
        ctx.stroke();

        // Head Badge Tag
        const headTagText = `PERSONA #${person.id} [ROSTRO ${person.confidence}%]`;
        ctx.fillStyle = pHeadColor;
        const hTagW = headTagText.length * 8 + 14;
        const hTagY = Math.max(0, hY - 24);
        ctx.fillRect(hX, hTagY, hTagW, 24);
        ctx.fillStyle = pHeadColor === '#00FF66' || pHeadColor === '#FFE600' || pHeadColor === '#00E5FF' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(headTagText, hX + 7, hTagY + 16);
      });

      animFrameRef.current = requestAnimationFrame(trackLoop);
    };

    animFrameRef.current = requestAnimationFrame(trackLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isWebcamActive, headColor, bodyColor, boxThickness]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Layout Controls */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Streaming Operacional
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Vista en Vivo
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Matriz de visualización multi-cámara con telemetría de visión artificial agregada en tiempo real.
          </p>
        </div>

        {/* Action & Layout Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Direct Webcam Test Button */}
          {!isWebcamActive ? (
            <button
              onClick={startWebcam}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Video size={16} />
              <span>Activar Cámara Local (PC)</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Box Color Pickers */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600">Cabeza:</span>
                <button
                  onClick={() => setHeadColor('#FF0033')}
                  className={`w-5 h-5 rounded-md bg-[#FF0033] border transition-transform ${headColor === '#FF0033' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Rojo Intenso"
                />
                <button
                  onClick={() => setHeadColor('#00FF66')}
                  className={`w-5 h-5 rounded-md bg-[#00FF66] border transition-transform ${headColor === '#00FF66' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Verde Neón"
                />
                <button
                  onClick={() => setHeadColor('#00E5FF')}
                  className={`w-5 h-5 rounded-md bg-[#00E5FF] border transition-transform ${headColor === '#00E5FF' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Cyan"
                />
                <button
                  onClick={() => setHeadColor('#FFE600')}
                  className={`w-5 h-5 rounded-md bg-[#FFE600] border transition-transform ${headColor === '#FFE600' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Amarillo"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600">Cuerpo:</span>
                <button
                  onClick={() => setBodyColor('#0066FF')}
                  className={`w-5 h-5 rounded-md bg-[#0066FF] border transition-transform ${bodyColor === '#0066FF' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Azul Eléctrico"
                />
                <button
                  onClick={() => setBodyColor('#9333EA')}
                  className={`w-5 h-5 rounded-md bg-[#9333EA] border transition-transform ${bodyColor === '#9333EA' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Púrpura"
                />
                <button
                  onClick={() => setBodyColor('#FF6600')}
                  className={`w-5 h-5 rounded-md bg-[#FF6600] border transition-transform ${bodyColor === '#FF6600' ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                  title="Naranja"
                />
              </div>

              {/* Line Thickness */}
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600">Grosor:</span>
                <button
                  onClick={() => setBoxThickness(4)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${boxThickness === 4 ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  4px
                </button>
                <button
                  onClick={() => setBoxThickness(6)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${boxThickness === 6 ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  6px
                </button>
                <button
                  onClick={() => setBoxThickness(8)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${boxThickness === 8 ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  8px
                </button>
              </div>

              <button
                onClick={stopWebcam}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <VideoOff size={15} />
                <span>Detener</span>
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Layout buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLayoutGrid('1x1')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                layoutGrid === '1x1'
                  ? 'bg-[#0070F2] text-white border-[#0070F2]'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Vista Individual (1x1)"
            >
              <Square size={16} />
            </button>
            <button
              onClick={() => setLayoutGrid('2x2')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                layoutGrid === '2x2'
                  ? 'bg-[#0070F2] text-white border-[#0070F2]'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Cuadrícula 2x2"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayoutGrid('3x3')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                layoutGrid === '3x3'
                  ? 'bg-[#0070F2] text-white border-[#0070F2]'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Matriz 3x3"
            >
              <Grid3X3 size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* Grid Container */}
      <div
        className={`grid gap-4 ${
          layoutGrid === '1x1'
            ? 'grid-cols-1'
            : layoutGrid === '2x2'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {/* WEBCAM CARD (If active) */}
        {isWebcamActive && (
          <div className="bg-[#1C2D42] border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-xl flex flex-col relative group">
            {/* Top Bar */}
            <div className="px-3.5 py-2.5 bg-slate-900/95 backdrop-blur-xs flex items-center justify-between z-10 text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <p className="text-xs font-bold">Cámara Local (PC / Wi-Fi)</p>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                  EN VIVO
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded font-bold">
                30 FPS • 720p HD
              </span>
            </div>

            {/* Video Surface & Interactive High-Contrast Canvas Overlay */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play().catch(console.error);
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Dynamic Tracking Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />

              {/* Live Detection Info Badge */}
              <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-xs border border-emerald-500/60 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                <Users size={15} className="text-emerald-400 animate-pulse" />
                <span>IA Multi-Persona: {Math.max(1, detectedCount)} {Math.max(1, detectedCount) === 1 ? 'persona' : 'personas'} detectadas • {distanceScaleLabel}</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: headColor }}>
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: headColor }} />
                  Rostro / Cabeza
                </span>
                <span className="flex items-center gap-1.5 font-bold" style={{ color: bodyColor }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bodyColor }} />
                  Cuerpo / Torso
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Sin biometría • Conteo agregado</span>
            </div>
          </div>
        )}

        {/* Registered Cameras */}
        {cameras.map((cam) => {
          const isOnline = cam.status === 'online';
          const isOffline = cam.status === 'offline' || cam.status === 'error';
          const isPending = cam.status === 'unconfigured';

          return (
            <div
              key={cam.id}
              className="bg-[#1C2D42] border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col group relative"
            >
              {/* Camera Top Bar Overlay */}
              <div className="px-3.5 py-2.5 bg-slate-900/90 backdrop-blur-xs flex items-center justify-between z-10 text-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline
                        ? 'bg-emerald-500 animate-pulse'
                        : isOffline
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <p className="text-xs font-bold truncate">{cam.name}</p>
                  <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                    • {cam.location}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOnline && (
                    <span className="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 font-bold">
                      {cam.config?.fps || 25} FPS
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedCam(cam)}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                    title="Pantalla completa"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>

              {/* Video Container / Canvas */}
              <div className="relative aspect-video bg-[#0F172A] flex items-center justify-center p-4">
                {isOnline ? (
                  <div className="w-full h-full relative flex flex-col items-center justify-center border border-slate-800/80 rounded-lg overflow-hidden bg-radial from-slate-800/50 to-slate-950">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                    
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 text-white px-2.5 py-1 rounded-md text-[11px] font-bold">
                      <Users size={12} className="text-[#0070F2]" />
                      <span>Detección: {cam.detectedPersonsCount || 0} personas</span>
                    </div>

                    <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
                      REC • {new Date().toLocaleTimeString()}
                    </div>

                    <div className="text-center text-slate-400 z-10 space-y-1">
                      <Cctv size={32} className="mx-auto text-[#0070F2]" />
                      <p className="text-xs font-semibold text-slate-200">Recepción WebRTC / Gateway</p>
                      <p className="text-[10px] text-slate-400 font-mono">Stream: {cam.config?.ip}:{cam.config?.port}</p>
                    </div>
                  </div>
                ) : isOffline ? (
                  <div className="text-center space-y-2 text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                      <AlertCircle size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Cámara Sin Conexión</p>
                    <p className="text-[10px] text-slate-500 max-w-[200px]">
                      No se pudo contactar el host {cam.config?.ip}. Verifique energía y red.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                      <Tv size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Esperando Señal de Cámara</p>
                    <p className="text-[10px] text-slate-500 max-w-[240px]">
                      Cámara registrada ({cam.config?.ip}). En espera de flujo de video RTSP.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="px-3.5 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Protocolo: {cam.config?.protocol || 'RTSP'}</span>
                  <span>•</span>
                  <span>Zonas: {cam.zones?.length || 0}</span>
                </div>
                <Link
                  href="/monitor/zones"
                  className="text-[#0070F2] hover:underline font-bold text-[10px]"
                >
                  Ver Zonas →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* EXPANDED FULLSCREEN MODAL */}
      {expandedCam && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col p-4 sm:p-8">
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Cctv size={22} className="text-[#0070F2]" />
              <div>
                <h3 className="text-sm font-bold">{expandedCam.name}</h3>
                <p className="text-xs text-slate-400">{expandedCam.location} • {expandedCam.config?.ip}</p>
              </div>
            </div>
            <button
              onClick={() => setExpandedCam(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 my-4 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 relative overflow-hidden">
            <div className="text-center space-y-2 text-slate-400">
              <Cctv size={48} className="mx-auto text-[#0070F2]" />
              <p className="text-sm font-bold text-white">Stream Principal Expandido</p>
              <p className="text-xs text-slate-400">
                Resolución: {expandedCam.config?.resolution || '1080p'} • Protocolo: {expandedCam.config?.protocol}
              </p>
              <div className="inline-flex items-center gap-1.5 bg-[#0070F2]/20 border border-[#0070F2]/40 text-[#0070F2] px-3 py-1 rounded-full text-xs font-bold mt-2">
                <Users size={14} />
                <span>{expandedCam.detectedPersonsCount || 0} personas detectadas</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

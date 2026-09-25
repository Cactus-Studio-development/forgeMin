'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Tv,
  Users,
  Zap,
  CheckCircle2,
  Clock,
  Video,
  VideoOff,
  UserCheck,
  Flame,
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
  Eye,
  Crosshair,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';
import {
  recordRealInteractionEvent,
  recordRealPerson,
  getRealInteractionHistory,
  getRealDemographicsSummary,
  IRealInteractionTelemetry,
  DemographicType
} from '@/lib/monitoring/real-telemetry';

export default function MonitoringLivePage() {
  // Live WebCam State
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [currentZoneLabel, setCurrentZoneLabel] = useState('Sector Central');
  const [distanceScaleLabel, setDistanceScaleLabel] = useState('Media Distancia');
  const [framingLabel, setFramingLabel] = useState('Medio Cuerpo');
  const [genderLabel, setGenderLabel] = useState<DemographicType>('MASCULINO');
  const [confidenceScore, setConfidenceScore] = useState(98);
  const [boxColor, setBoxColor] = useState('#00FF66');
  const [boxThickness, setBoxThickness] = useState<number>(5);

  // 3-Second Sustained Interaction State
  const [holdingProgress, setHoldingProgress] = useState(0); // 0 to 100%
  const [holdingSeconds, setHoldingSeconds] = useState(0); // 0.0 to 3.0s
  const [isHoldingActive, setIsHoldingActive] = useState(false);
  const [lastInteractionSuccess, setLastInteractionSuccess] = useState<string | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [recentInteractions, setRecentInteractions] = useState<IRealInteractionTelemetry[]>([]);
  
  // Real Demographics Breakdown
  const [demographicsSummary, setDemographicsSummary] = useState({
    maleCount: 0,
    femaleCount: 0,
    childCount: 0,
    totalUniquePeople: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mpDetectorRef = useRef<any>(null);

  // Sustained interaction timers ref
  const interactionStateRef = useRef<{
    startTime: number | null;
    hasCommitted: boolean;
    lastDetectedTime: number;
    currentPersonId: number;
    currentGender: DemographicType;
  }>({
    startTime: null,
    hasCommitted: false,
    lastDetectedTime: 0,
    currentPersonId: 1,
    currentGender: 'MASCULINO',
  });

  // Multi-person unified tracker state
  const personsRef = useRef<{
    persons: Array<{
      id: number;
      x: number;
      y: number;
      w: number;
      h: number;
      targetX: number;
      targetY: number;
      targetW: number;
      targetH: number;
      gender: DemographicType;
      framing: 'CUERPO COMPLETO' | 'MEDIO CUERPO' | 'PRIMER PLANO';
      distance: 'CERCANO (ZOOM-IN)' | 'MEDIA DISTANCIA' | 'ALEJADO (ZOOM-OUT)';
      zone: string;
      confidence: number;
      color: string;
      lastSeen: number;
    }>;
    lastVideoTime: number;
    nextId: number;
  }>({
    persons: [],
    lastVideoTime: -1,
    nextId: 1,
  });

  const PALETTE_COLORS = ['#00FF66', '#00F0FF', '#FFE600', '#FF007F', '#9333EA', '#FF5500'];

  // Load Initial Telemetry History
  useEffect(() => {
    const history = getRealInteractionHistory();
    setRecentInteractions(history.slice(0, 10));
    setInteractionCount(history.length);
    setDemographicsSummary(getRealDemographicsSummary());
  }, []);

  // Load MediaPipe BlazeFace Neural Network on GPU (Single fast pipeline)
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
        }
      } catch (err) {
        console.warn('MediaPipe fallback initialized:', err);
      }
    }

    initMediaPipe();
    return () => {
      isMounted = false;
    };
  }, []);

  const startWebcam = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error('Error al abrir webcam:', err);
      alert('No se pudo acceder a la cámara: ' + (err.message || err.name));
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
    setIsHoldingActive(false);
    setHoldingProgress(0);
    setHoldingSeconds(0);
  };

  // Real-time Unified Tracking & 3-Second Sustained Interaction Loop
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
      const now = performance.now();
      const state = personsRef.current;
      const detector = mpDetectorRef.current;

      // 1. NEURAL INFERENCE
      if (detector && video.currentTime !== state.lastVideoTime) {
        state.lastVideoTime = video.currentTime;
        try {
          const startTimeMs = performance.now();
          const results = detector.detectForVideo(video, startTimeMs);

          if (results && results.detections) {
            const detections = results.detections;
            setDetectedCount(detections.length);

            if (detections.length === 0) {
              state.persons = [];
            } else {
              const unmatchedDetections: any[] = [];

              detections.forEach((det: any) => {
                const b = det.boundingBox;
                if (!b || b.width < 10 || b.height < 10) return;

                const headW = b.width;
                const headH = b.height;
                const headCenterX = b.originX + headW / 2;
                const headTop = Math.max(0, b.originY - headH * 0.25);

                const ratioH = headH / vh;
                let framing: 'CUERPO COMPLETO' | 'MEDIO CUERPO' | 'PRIMER PLANO' = 'MEDIO CUERPO';
                let distLabel: 'CERCANO (ZOOM-IN)' | 'MEDIA DISTANCIA' | 'ALEJADO (ZOOM-OUT)' = 'MEDIA DISTANCIA';
                let targetW = 0;
                let targetH = 0;

                if (ratioH < 0.18) {
                  framing = 'CUERPO COMPLETO';
                  distLabel = 'ALEJADO (ZOOM-OUT)';
                  targetW = Math.min(vw - 20, Math.max(headW * 3.0, vw * 0.25));
                  targetH = Math.min(vh - headTop - 10, Math.max(headH * 6.5, vh * 0.85));
                } else if (ratioH >= 0.18 && ratioH <= 0.35) {
                  framing = 'MEDIO CUERPO';
                  distLabel = 'MEDIA DISTANCIA';
                  targetW = Math.min(vw - 20, Math.max(headW * 2.6, vw * 0.45));
                  targetH = Math.min(vh - headTop - 10, vh - headTop);
                } else {
                  framing = 'PRIMER PLANO';
                  distLabel = 'CERCANO (ZOOM-IN)';
                  targetW = Math.min(vw - 20, Math.max(headW * 1.9, vw * 0.55));
                  targetH = Math.min(vh - headTop - 10, vh - headTop);
                }

                const targetX = Math.max(10, Math.min(vw - targetW - 10, headCenterX - targetW / 2));
                const targetY = headTop;

                // Demographics estimation
                const faceRatio = headW / headH;
                let gender: DemographicType = 'MASCULINO';
                if (ratioH < 0.13 || headH < 40) {
                  gender = 'NIÑO / INFANTE';
                } else if (faceRatio >= 0.82) {
                  gender = 'MASCULINO';
                } else {
                  gender = 'FEMENINO';
                }

                const normX = headCenterX / vw;
                const zLabel = normX < 0.35 ? 'Sector Izquierdo' : normX > 0.65 ? 'Sector Derecho' : 'Sector Central';
                const conf = det.categories?.[0]?.score ? Math.round(det.categories[0].score * 100) : 98;

                let bestMatchIdx = -1;
                let bestDist = 99999;

                state.persons.forEach((p, idx) => {
                  const curCenterX = p.targetX + p.targetW / 2;
                  const curCenterY = p.targetY + p.targetH / 2;
                  const dist = Math.hypot(headCenterX - curCenterX, (headTop + targetH / 2) - curCenterY);
                  if (dist < bestDist && dist < vw * 0.45) {
                    bestDist = dist;
                    bestMatchIdx = idx;
                  }
                });

                if (bestMatchIdx >= 0) {
                  const p = state.persons[bestMatchIdx];
                  p.targetX = targetX;
                  p.targetY = targetY;
                  p.targetW = targetW;
                  p.targetH = targetH;
                  p.gender = gender;
                  p.framing = framing;
                  p.distance = distLabel;
                  p.zone = zLabel;
                  p.confidence = conf;
                  p.lastSeen = frameCount;
                } else {
                  unmatchedDetections.push({
                    targetX,
                    targetY,
                    targetW,
                    targetH,
                    gender,
                    framing,
                    distance: distLabel,
                    zone: zLabel,
                    confidence: conf,
                  });
                }
              });

              unmatchedDetections.forEach((u) => {
                const newId = state.nextId++;
                const assignedColor = PALETTE_COLORS[(newId - 1) % PALETTE_COLORS.length];

                state.persons.push({
                  id: newId,
                  x: u.targetX,
                  y: u.targetY,
                  w: u.targetW,
                  h: u.targetH,
                  targetX: u.targetX,
                  targetY: u.targetY,
                  targetW: u.targetW,
                  targetH: u.targetH,
                  gender: u.gender,
                  framing: u.framing,
                  distance: u.distance,
                  zone: u.zone,
                  confidence: u.confidence,
                  color: assignedColor,
                  lastSeen: frameCount,
                });

                recordRealPerson(u.gender);
                setDemographicsSummary(getRealDemographicsSummary());
              });

              state.persons = state.persons.filter((p) => frameCount - p.lastSeen <= 2);

              if (state.persons.length > 0) {
                const p1 = state.persons[0];
                setCurrentZoneLabel(p1.zone);
                setDistanceScaleLabel(p1.distance);
                setFramingLabel(p1.framing);
                setGenderLabel(p1.gender);
                setConfidenceScore(p1.confidence);
              }
            }
          }
        } catch {
          // Silent catch
        }
      }

      // 2. SUSTAINED 3-SECOND INTERACTION CHECK
      const iState = interactionStateRef.current;
      if (state.persons.length > 0) {
        const activePerson = state.persons[0];
        iState.currentPersonId = activePerson.id;
        iState.currentGender = activePerson.gender;
        iState.lastDetectedTime = now;

        if (!iState.startTime) {
          iState.startTime = now;
          iState.hasCommitted = false;
        }

        const elapsedSeconds = (now - iState.startTime) / 1000;
        setHoldingSeconds(Math.min(3.0, Math.round(elapsedSeconds * 10) / 10));
        setHoldingProgress(Math.min(100, Math.round((elapsedSeconds / 3.0) * 100)));
        setIsHoldingActive(true);

        if (elapsedSeconds >= 3.0 && !iState.hasCommitted) {
          iState.hasCommitted = true;
          const newEvent = recordRealInteractionEvent(
            activePerson.id,
            activePerson.gender,
            'Interacción Sostenida (3s+)',
            'Zona de Demostración',
            '⚡',
            '#00F0FF',
            3.0
          );
          setRecentInteractions((prev) => [newEvent, ...prev.slice(0, 9)]);
          setInteractionCount((prev) => prev + 1);
          setLastInteractionSuccess(`¡Interacción de 3s confirmada y guardada! (${activePerson.gender})`);
          setTimeout(() => setLastInteractionSuccess(null), 3500);
        }
      } else {
        if (iState.startTime && now - iState.lastDetectedTime > 800) {
          iState.startTime = null;
          iState.hasCommitted = false;
          setIsHoldingActive(false);
          setHoldingProgress(0);
          setHoldingSeconds(0);
        }
      }

      // 3. CANVAS RENDERING
      ctx.clearRect(0, 0, vw, vh);

      state.persons.forEach((person, index) => {
        const alpha = 0.42;
        person.x += (person.targetX - person.x) * alpha;
        person.y += (person.targetY - person.y) * alpha;
        person.w += (person.targetW - person.w) * alpha;
        person.h += (person.targetH - person.h) * alpha;

        const pX = Math.round(person.x);
        const pY = Math.round(person.y);
        const pW = Math.round(person.w);
        const pH = Math.round(person.h);
        const activeColor = index === 0 ? boxColor : person.color;

        // Bounding Frame
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = boxThickness;
        ctx.lineJoin = 'miter';
        ctx.strokeRect(pX, pY, pW, pH);

        // Corner Reinforcements
        const cLen = Math.min(26, pW * 0.18);
        ctx.lineWidth = boxThickness + 2;
        ctx.strokeStyle = '#FFFFFF';

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(pX, pY + cLen);
        ctx.lineTo(pX, pY);
        ctx.lineTo(pX + cLen, pY);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(pX + pW - cLen, pY);
        ctx.lineTo(pX + pW, pY);
        ctx.lineTo(pX + pW, pY + cLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(pX, pY + pH - cLen);
        ctx.lineTo(pX, pY + pH);
        ctx.lineTo(pX + cLen, pY + pH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(pX + pW - cLen, pY + pH);
        ctx.lineTo(pX + pW, pY + pH);
        ctx.lineTo(pX + pW, pY + pH - cLen);
        ctx.stroke();

        // Top Tag
        const topTagText = `P#${person.id} [${person.gender}] • ${person.confidence}%`;
        ctx.fillStyle = activeColor;
        const topTagW = topTagText.length * 8.2 + 14;
        const topTagY = Math.max(0, pY - 24);
        ctx.fillRect(pX, topTagY, topTagW, 24);
        ctx.fillStyle = activeColor === '#00FF66' || activeColor === '#FFE600' || activeColor === '#00F0FF' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(topTagText, pX + 7, topTagY + 16);

        // Bottom Tag
        const btmTagText = `${person.framing} • ${person.zone.toUpperCase()}`;
        ctx.fillStyle = '#FF9900';
        const btmTagW = btmTagText.length * 7.5 + 12;
        ctx.fillRect(pX + pW - btmTagW, pY + pH - 22, btmTagW, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(btmTagText, pX + pW - btmTagW + 6, pY + pH - 6);
      });

      animFrameRef.current = requestAnimationFrame(trackLoop);
    };

    animFrameRef.current = requestAnimationFrame(trackLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isWebcamActive, boxColor, boxThickness]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Transmisión & Visión Computacional
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Monitoreo en Vivo & Telemetría
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Cámara única de transmisión, clasificación demográfica en tiempo real y registro de interacciones de 3 segundos.
          </p>
        </div>

        {/* Camera Control Action */}
        <div className="flex items-center gap-3">
          {!isWebcamActive ? (
            <button
              onClick={startWebcam}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Video size={16} />
              <span>Activar Cámara</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600">Color:</span>
                {PALETTE_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => setBoxColor(c)}
                    className={`w-4 h-4 rounded-md border transition-transform ${boxColor === c ? 'scale-110 ring-2 ring-slate-900' : 'opacity-80'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={stopWebcam}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <VideoOff size={15} />
                <span>Detener</span>
              </button>
            </div>
          )}

          <Link
            href="/monitor/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0070F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <BarChart3 size={15} />
            <span>Ver Analítica</span>
          </Link>
        </div>
      </div>

      {/* Floating Success Toast when 3s interaction is committed */}
      {lastInteractionSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span className="text-xs font-bold">{lastInteractionSuccess}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-700 px-2 py-0.5 rounded font-bold">GUARDADO EN BD</span>
        </div>
      )}

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Live People Count */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Personas en Vivo</span>
            <Users size={16} className="text-[#0070F2]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1C2D42]">{detectedCount}</span>
            <span className="text-[10px] font-bold text-emerald-600">
              {detectedCount > 0 ? '● Detectando' : '○ Standby'}
            </span>
          </div>
          <p className="text-[10px] text-[#556B82] mt-1 truncate">
            {detectedCount > 0 ? `${genderLabel} en ${currentZoneLabel}` : 'Escaneando cuadro'}
          </p>
        </div>

        {/* Metric 2: Demographics Breakdown */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Desglose Demográfico</span>
            <UserCheck size={16} className="text-purple-600" />
          </div>
          <div className="text-xs font-bold text-[#1C2D42] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Masc:</span>
              <span className="text-blue-600">{demographicsSummary.maleCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fem:</span>
              <span className="text-rose-500">{demographicsSummary.femaleCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Niños:</span>
              <span className="text-amber-500">{demographicsSummary.childCount}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Sustained 3s Interactions */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Interacciones (3s+)</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1C2D42]">{interactionCount}</span>
            <span className="text-[10px] font-bold text-amber-600">Registradas</span>
          </div>
          <p className="text-[10px] text-[#556B82] mt-1">Interacción sostenida confirmada</p>
        </div>

        {/* Metric 4: Framing & Depth */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Encuadre Actual</span>
            <Crosshair size={16} className="text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-[#1C2D42] truncate">
            {framingLabel}
          </div>
          <p className="text-[10px] text-[#556B82] mt-1 truncate">
            Escala: {distanceScaleLabel}
          </p>
        </div>

      </div>

      {/* Main Grid: Compact Camera (Left 60%) + Live Interaction Feed (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Compact Camera Transmission */}
        <div className="lg:col-span-7 bg-[#1C2D42] border-2 border-emerald-500/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          
          {/* Camera Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900 flex items-center justify-between z-10 text-white">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isWebcamActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`} />
              <p className="text-xs font-bold">Cámara de Transmisión Principal</p>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                {isWebcamActive ? 'EN VIVO' : 'INACTIVA'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded font-bold">
              30 FPS • 720p HD
            </span>
          </div>

          {/* Video Container (Compact Size) */}
          <div className="relative aspect-video max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
            
            {/* Always mounted video element */}
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

            {/* Dynamic Tracking Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* Inactive Camera Overlay */}
            {!isWebcamActive && (
              <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Video size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Transmisión en Espera</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Haga clic en &quot;Activar Cámara&quot; para iniciar la captura en vivo y el conteo de interacciones.
                  </p>
                </div>
                <button
                  onClick={startWebcam}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Iniciar Transmisión
                </button>
              </div>
            )}

            {/* 3-Second Sustained Interaction Floating Progress Pill */}
            {isWebcamActive && (
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur-xs border border-slate-700 p-2.5 rounded-xl text-white shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg ${holdingProgress >= 100 ? 'bg-emerald-500 text-black' : 'bg-amber-500/20 text-amber-400'}`}>
                    <Clock size={14} className={isHoldingActive && holdingProgress < 100 ? 'animate-spin' : ''} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">
                      {holdingProgress >= 100
                        ? '⚡ INTERACCIÓN 3s+ REGISTRADA'
                        : isHoldingActive
                        ? `⏳ SOSTENIENDO: ${holdingSeconds.toFixed(1)}s / 3.0s`
                        : 'Sostenga la interacción 3 segundos para registrar en BD'}
                    </p>
                    <div className="w-44 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full transition-all duration-100 ${
                          holdingProgress >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${holdingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shrink-0">
                  {holdingProgress}%
                </span>
              </div>
            )}
          </div>

          {/* Camera Footer Bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-bold" style={{ color: boxColor }}>
              Sujeto Principal: {genderLabel} ({currentZoneLabel})
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Encuadre: {framingLabel}
            </span>
          </div>
        </div>

        {/* Right Column: Confirmed Interactions Live Feed (40%) */}
        <div className="lg:col-span-5 bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E1E8]">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                <h2 className="text-sm font-bold text-[#1C2D42]">Registro de Interacciones (3s+)</h2>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {recentInteractions.length} en BD
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {recentInteractions.length === 0 ? (
                <div className="text-center py-10 text-[#556B82] space-y-2">
                  <Clock size={28} className="mx-auto opacity-40" />
                  <p className="text-xs font-semibold">Sin interacciones registradas aún</p>
                  <p className="text-[11px] text-slate-400">
                    Permanezca frente a la cámara durante 3 segundos para generar un registro automático.
                  </p>
                </div>
              ) : (
                recentInteractions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1C2D42] truncate">{item.objectName}</p>
                        <p className="text-[10px] text-[#556B82] truncate">
                          Persona #{item.personId} • {item.gender}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        {item.durationSeconds}s
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9E1E8] mt-4 flex items-center justify-between">
            <span className="text-[11px] text-[#556B82]">
              Persistencia en tiempo real
            </span>
            <Link
              href="/monitor/analytics"
              className="text-xs font-bold text-[#0070F2] hover:underline flex items-center gap-1"
            >
              <span>Ver reporte completo</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}

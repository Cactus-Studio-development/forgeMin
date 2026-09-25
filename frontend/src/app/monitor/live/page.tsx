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
  Crosshair,
  Package,
  Layers,
  Trash2,
  Activity,
  Cpu,
  RefreshCw,
  Sliders,
  Smartphone,
  QrCode,
  Copy,
  ExternalLink,
  Camera,
  Check,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  recordRealInteractionEvent,
  updateRealDemographicsSnapshot,
  getRealInteractionHistory,
  getRealDemographicsSummary,
  clearRealTelemetry,
  IRealInteractionTelemetry,
  DemographicType
} from '@/lib/monitoring/real-telemetry';
import { createReceiverSession } from '@/lib/monitoring/webrtc-streamer';

// Dictionary mapping COCO labels to Spanish with icons & categories
const OBJECT_MAP: Record<string, { label: string; icon: string; category: string; color: string }> = {
  'cell phone': { label: 'Teléfono Móvil', icon: '📱', category: 'Dispositivos', color: '#00F0FF' },
  'bottle': { label: 'Botella / Bebida', icon: '🥤', category: 'Bebidas', color: '#00FF66' },
  'cup': { label: 'Taza / Vaso', icon: '☕', category: 'Bebidas', color: '#FFE600' },
  'book': { label: 'Libro / Folleto', icon: '📖', category: 'Material Impreso', color: '#FF007F' },
  'laptop': { label: 'Laptop / Portátil', icon: '💻', category: 'Tecnología', color: '#9333EA' },
  'mouse': { label: 'Mouse / Ratón', icon: '🖱️', category: 'Tecnología', color: '#38BDF8' },
  'keyboard': { label: 'Teclado', icon: '⌨️', category: 'Tecnología', color: '#F472B6' },
  'remote': { label: 'Control Remoto', icon: '📺', category: 'Dispositivos', color: '#FB923C' },
  'backpack': { label: 'Mochila / Bolso', icon: '🎒', category: 'Accesorios', color: '#FACC15' },
  'handbag': { label: 'Cartera / Bolso', icon: '👜', category: 'Accesorios', color: '#E879F9' },
  'scissors': { label: 'Herramienta / Tijeras', icon: '✂️', category: 'Herramientas', color: '#F87171' },
  'clock': { label: 'Reloj', icon: '⏰', category: 'Accesorios', color: '#4ADE80' },
  'wine glass': { label: 'Copa', icon: '🍷', category: 'Bebidas', color: '#F43F5E' },
  'umbrella': { label: 'Paraguas', icon: '☂️', category: 'Accesorios', color: '#818CF8' },
};

// Filter internal Emscripten / MediaPipe / TFLite WASM logs that trigger Next.js dev error overlays
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const isInternalWasmLog = (...args: any[]) => {
    const text = args
      .map((a) => (typeof a === 'string' ? a : (a?.message || JSON.stringify(a) || '')))
      .join(' ');
    return (
      text.includes('INFO: Created TensorFlow Lite') ||
      text.includes('XNNPACK delegate') ||
      text.includes('OpenGL error checking is disabled') ||
      text.includes('gl_context.cc') ||
      text.includes('vision_wasm_internal')
    );
  };

  console.error = (...args: any[]) => {
    if (isInternalWasmLog(...args)) return;
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (isInternalWasmLog(...args)) return;
    originalConsoleWarn.apply(console, args);
  };
}

export default function MonitoringLivePage() {
  // Live WebCam & Source Selection State
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState<'local' | 'remote_mobile'>('local');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Remote Mobile QR Code Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [mobileSessionId, setMobileSessionId] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [remoteStreamUrl, setRemoteStreamUrl] = useState('');
  const [remoteConnectionStatus, setRemoteConnectionStatus] = useState<'waiting' | 'connecting' | 'connected' | 'disconnected'>('waiting');
  const [copiedLink, setCopiedLink] = useState(false);
  const remoteReceiverCleanupRef = useRef<(() => void) | null>(null);

  // Vision State
  const [detectedCount, setDetectedCount] = useState(0);
  const [currentZoneLabel, setCurrentZoneLabel] = useState('Sector Central');
  const [distanceScaleLabel, setDistanceScaleLabel] = useState('Media Distancia');
  const [framingLabel, setFramingLabel] = useState('Medio Cuerpo');
  const [genderLabel, setGenderLabel] = useState<DemographicType>('MASCULINO');
  const [confidenceScore, setConfidenceScore] = useState(98);
  const [boxColor, setBoxColor] = useState('#00FF66');
  const [boxThickness, setBoxThickness] = useState<number>(5);

  // Active Held Object State
  const [activeHeldObject, setActiveHeldObject] = useState<{
    label: string;
    icon: string;
    category: string;
    confidence: number;
    color: string;
  } | null>(null);

  // Live Technical Telemetry State
  const [liveFps, setLiveFps] = useState(30);
  const [spatialData, setSpatialData] = useState({
    faceWidth: 0,
    faceHeight: 0,
    targetW: 0,
    targetH: 0,
    centerX: 0,
    centerY: 0,
    ratio: '1:1',
  });

  // 3-Second Sustained Interaction State
  const [holdingProgress, setHoldingProgress] = useState(0);
  const [holdingSeconds, setHoldingSeconds] = useState(0);
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

  // Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  
  // MediaPipe Detectors (Face on GPU, Objects on CPU)
  const mpFaceDetectorRef = useRef<any>(null);
  const mpObjectDetectorRef = useRef<any>(null);

  // Sustained interaction timers ref
  const interactionStateRef = useRef<{
    startTime: number | null;
    hasCommitted: boolean;
    lastDetectedTime: number;
    currentPersonId: number;
    currentGender: DemographicType;
    currentObject: { label: string; icon: string; category: string; color: string } | null;
  }>({
    startTime: null,
    hasCommitted: false,
    lastDetectedTime: 0,
    currentPersonId: 1,
    currentGender: 'MASCULINO',
    currentObject: null,
  });

  // Multi-person tracker state
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
    objects: Array<{
      id: string;
      label: string;
      icon: string;
      category: string;
      color: string;
      x: number;
      y: number;
      w: number;
      h: number;
      confidence: number;
      lastSeen: number;
    }>;
    lastVideoTime: number;
    lastObjectScanTime: number;
    nextId: number;
  }>({
    persons: [],
    objects: [],
    lastVideoTime: -1,
    lastObjectScanTime: 0,
    nextId: 1,
  });

  const PALETTE_COLORS = ['#00FF66', '#00F0FF', '#FFE600', '#FF007F', '#9333EA', '#FF5500'];

  // Enumerate Connected Camera Devices (Integrated & USB External)
  const refreshAvailableCameras = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate video devices:', err);
    }
  };

  // Load Initial Telemetry History & Camera Devices
  useEffect(() => {
    const history = getRealInteractionHistory();
    setRecentInteractions(history.slice(0, 10));
    setInteractionCount(history.length);
    setDemographicsSummary(getRealDemographicsSummary());
    refreshAvailableCameras();
  }, []);

  // Clear Telemetry Handler
  const confirmClearTelemetry = () => {
    clearRealTelemetry();
    setRecentInteractions([]);
    setInteractionCount(0);
    setDemographicsSummary({ maleCount: 0, femaleCount: 0, childCount: 0, totalUniquePeople: 0 });
    setActiveHeldObject(null);
    setIsClearModalOpen(false);
    setLastInteractionSuccess('✓ Toda la telemetría ha sido limpiada y restablecida a cero.');
    setTimeout(() => setLastInteractionSuccess(null), 3500);
  };

  // Initialize MediaPipe BlazeFace (GPU) & ObjectDetector (CPU/WASM)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        const { FilesetResolver, FaceDetector, ObjectDetector } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );
        if (!isMounted) return;

        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          minDetectionConfidence: 0.4,
          runningMode: 'VIDEO',
        });

        if (isMounted) {
          mpFaceDetectorRef.current = faceDetector;
        }

        try {
          const objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
              delegate: 'CPU',
            },
            scoreThreshold: 0.35,
            runningMode: 'VIDEO',
          });

          if (isMounted) {
            mpObjectDetectorRef.current = objectDetector;
          }
        } catch (objErr) {
          console.warn('ObjectDetector CPU init error:', objErr);
        }
      } catch (err) {
        console.warn('MediaPipe initialization warning:', err);
      }
    }

    initMediaPipe();
    return () => {
      isMounted = false;
    };
  }, []);

  // Open Local Camera (Integrated or External USB)
  const startLocalCamera = async (deviceId?: string) => {
    try {
      if (remoteReceiverCleanupRef.current) {
        remoteReceiverCleanupRef.current();
        remoteReceiverCleanupRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setVideoSourceType('local');
      setIsWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      refreshAvailableCameras();
    } catch (err: any) {
      console.error('Error opening camera:', err);
      alert('No se pudo acceder a la cámara: ' + (err.message || err.name));
    }
  };

  // Generate QR Code with specified Base URL (Ngrok, Localtunnel or Local IP)
  const generateQrWithBase = async (baseUrl: string, sessionId: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const targetUrl = `${cleanBase}/monitor/remote-camera?session=${sessionId}`;
    setRemoteStreamUrl(targetUrl);

    try {
      const qrData = await QRCode.toDataURL(targetUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrData);
    } catch (qrErr) {
      console.error('Error generating QR code:', qrErr);
    }
  };

  // Open Remote QR Modal & Create WebRTC Receiver Session
  const openRemoteCameraModal = async () => {
    const sessionId = `cam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setMobileSessionId(sessionId);
    setRemoteConnectionStatus('waiting');

    // Default base URL: if customBaseUrl is set, use it; otherwise prefer local IP (192.168.100.9:3000) or origin
    const defaultBase = customBaseUrl || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://192.168.100.9:3000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));
    setCustomBaseUrl(defaultBase);

    await generateQrWithBase(defaultBase, sessionId);
    setIsQrModalOpen(true);

    // Initialize WebRTC Receiver
    if (remoteReceiverCleanupRef.current) {
      remoteReceiverCleanupRef.current();
    }

    const { cleanup } = await createReceiverSession(
      sessionId,
      (remoteStream) => {
        streamRef.current = remoteStream;
        setVideoSourceType('remote_mobile');
        setIsWebcamActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play().catch(console.error);
        }
        setRemoteConnectionStatus('connected');
        setIsQrModalOpen(false);
        setLastInteractionSuccess('📱 ¡Celular conectado exitosamente a la transmisión en vivo!');
        setTimeout(() => setLastInteractionSuccess(null), 4000);
      },
      (status) => {
        setRemoteConnectionStatus(status);
      }
    );

    remoteReceiverCleanupRef.current = cleanup;
  };

  const stopCamera = () => {
    if (remoteReceiverCleanupRef.current) {
      remoteReceiverCleanupRef.current();
      remoteReceiverCleanupRef.current = null;
    }
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
      videoRef.current.pause();
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    personsRef.current = {
      persons: [],
      objects: [],
      lastTime: 0,
      nextId: 1,
      lastFaceScanTime: 0,
      lastObjectScanTime: 0,
      lastVideoTime: -1,
    };
    interactionStateRef.current = {
      startTime: null,
      currentPersonId: null,
      currentGender: null,
      currentObject: null,
      lastDetectedTime: 0,
      hasCommitted: false,
    };
    setDetectedCount(0);
    setActiveHeldObject(null);
    setIsWebcamActive(false);
    setIsHoldingActive(false);
    setHoldingProgress(0);
    setHoldingSeconds(0);
    setLiveFps(0);
    setCurrentZoneLabel(null);
    setDistanceScaleLabel(null);
    setFramingLabel(null);
    setGenderLabel(null);
    setConfidenceScore(0);
    setRemoteConnectionStatus('waiting');
  };

  // Real-time Unified Tracking Loop (Person + Discrete Object Recognition + Telemetry)
  useEffect(() => {
    if (!isWebcamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let currentFpsCount = 0;

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
      currentFpsCount++;
      const now = performance.now();

      if (now - lastFpsTime >= 1000) {
        setLiveFps(currentFpsCount);
        currentFpsCount = 0;
        lastFpsTime = now;
      }

      const state = personsRef.current;
      const faceDetector = mpFaceDetectorRef.current;
      const objectDetector = mpObjectDetectorRef.current;

      // 1. PERSON & FACE DETECTION
      if (faceDetector && video.currentTime !== state.lastVideoTime) {
        state.lastVideoTime = video.currentTime;
        try {
          const startTimeMs = performance.now();
          const results = faceDetector.detectForVideo(video, startTimeMs);

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

                // Demographic Estimation
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

                setSpatialData({
                  faceWidth: Math.round(headW),
                  faceHeight: Math.round(headH),
                  targetW: Math.round(targetW),
                  targetH: Math.round(targetH),
                  centerX: Math.round(headCenterX),
                  centerY: Math.round(headTop),
                  ratio: `${headW.toFixed(0)}x${headH.toFixed(0)}`,
                });
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
              });

              state.persons = state.persons.filter((p) => frameCount - p.lastSeen <= 2);

              // Concurrent unique individuals count (1 person = 1 count)
              const concurrentMales = state.persons.filter((p) => p.gender === 'MASCULINO').length;
              const concurrentFemales = state.persons.filter((p) => p.gender === 'FEMENINO').length;
              const concurrentChildren = state.persons.filter((p) => p.gender === 'NIÑO / INFANTE').length;

              if (state.persons.length > 0) {
                const updatedSummary = updateRealDemographicsSnapshot(concurrentMales, concurrentFemales, concurrentChildren);
                if (updatedSummary) {
                  setDemographicsSummary(updatedSummary);
                }
              }

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

      // 2. DISCRETE OBJECT DETECTION
      if (objectDetector && now - state.lastObjectScanTime > 120) {
        state.lastObjectScanTime = now;
        try {
          const objResults = objectDetector.detectForVideo(video, now);
          if (objResults && objResults.detections) {
            const currentObjs: any[] = [];

            objResults.detections.forEach((det: any) => {
              const category = det.categories?.[0];
              if (!category) return;
              const rawName = category.categoryName?.toLowerCase();
              if (!rawName || rawName === 'person') return;

              const mapped = OBJECT_MAP[rawName] || {
                label: category.categoryName,
                icon: '📦',
                category: 'Objeto General',
                color: '#00F0FF',
              };

              const b = det.boundingBox;
              if (!b) return;

              currentObjs.push({
                id: `${rawName}_${Math.round(b.originX)}_${Math.round(b.originY)}`,
                label: mapped.label,
                icon: mapped.icon,
                category: mapped.category,
                color: mapped.color,
                x: b.originX,
                y: b.originY,
                w: b.width,
                h: b.height,
                confidence: Math.round(category.score * 100),
                lastSeen: frameCount,
              });
            });

            state.objects = currentObjs;

            if (currentObjs.length > 0) {
              const topObj = currentObjs[0];
              setActiveHeldObject({
                label: topObj.label,
                icon: topObj.icon,
                category: topObj.category,
                confidence: topObj.confidence,
                color: topObj.color,
              });
            } else {
              setActiveHeldObject(null);
            }
          }
        } catch {
          // Silent catch
        }
      }

      // 3. SUSTAINED 3-SECOND INTERACTION CHECK
      const iState = interactionStateRef.current;
      if (state.persons.length > 0) {
        const activePerson = state.persons[0];
        iState.currentPersonId = activePerson.id;
        iState.currentGender = activePerson.gender;
        iState.lastDetectedTime = now;

        if (state.objects.length > 0) {
          const topObj = state.objects[0];
          iState.currentObject = {
            label: topObj.label,
            icon: topObj.icon,
            category: topObj.category,
            color: topObj.color,
          };
        }

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
          const objectName = iState.currentObject?.label || 'Interacción Sostenida';
          const objectCategory = iState.currentObject?.category || 'Interacción en Stand';
          const objectIcon = iState.currentObject?.icon || '⚡';
          const objectColor = iState.currentObject?.color || '#00F0FF';

          const newEvent = recordRealInteractionEvent(
            activePerson.id,
            activePerson.gender,
            objectName,
            objectCategory,
            objectIcon,
            objectColor,
            3.0
          );

          setRecentInteractions((prev) => [newEvent, ...prev.slice(0, 9)]);
          setInteractionCount((prev) => prev + 1);
          setLastInteractionSuccess(`¡Interacción confirmada de 3s con ${objectIcon} ${objectName}!`);
          setTimeout(() => setLastInteractionSuccess(null), 4000);
        }
      } else {
        if (iState.startTime && now - iState.lastDetectedTime > 800) {
          iState.startTime = null;
          iState.hasCommitted = false;
          iState.currentObject = null;
          setIsHoldingActive(false);
          setHoldingProgress(0);
          setHoldingSeconds(0);
        }
      }

      // 4. CANVAS RENDERING
      ctx.clearRect(0, 0, vw, vh);

      // Render Person Boxes
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

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = boxThickness;
        ctx.lineJoin = 'miter';
        ctx.strokeRect(pX, pY, pW, pH);

        const cLen = Math.min(26, pW * 0.18);
        ctx.lineWidth = boxThickness + 2;
        ctx.strokeStyle = '#FFFFFF';

        ctx.beginPath();
        ctx.moveTo(pX, pY + cLen);
        ctx.lineTo(pX, pY);
        ctx.lineTo(pX + cLen, pY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pX + pW - cLen, pY);
        ctx.lineTo(pX + pW, pY);
        ctx.lineTo(pX + pW, pY + cLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pX, pY + pH - cLen);
        ctx.lineTo(pX, pY + pH);
        ctx.lineTo(pX + cLen, pY + pH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pX + pW - cLen, pY + pH);
        ctx.lineTo(pX + pW, pY + pH);
        ctx.lineTo(pX + pW, pY + pH - cLen);
        ctx.stroke();

        const topTagText = `👤 PERSONA #${person.id} [${person.gender}] • ${person.confidence}%`;
        ctx.fillStyle = activeColor;
        const topTagW = topTagText.length * 8.2 + 14;
        const topTagY = Math.max(0, pY - 24);
        ctx.fillRect(pX, topTagY, topTagW, 24);
        ctx.fillStyle = activeColor === '#00FF66' || activeColor === '#FFE600' || activeColor === '#00F0FF' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(topTagText, pX + 7, topTagY + 16);

        const btmTagText = `${person.framing} • ${person.zone.toUpperCase()}`;
        ctx.fillStyle = '#FF9900';
        const btmTagW = btmTagText.length * 7.5 + 12;
        ctx.fillRect(pX + pW - btmTagW, pY + pH - 22, btmTagW, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(btmTagText, pX + pW - btmTagW + 6, pY + pH - 6);
      });

      // Render Distinct Object Boxes
      state.objects.forEach((obj) => {
        const oX = Math.round(obj.x);
        const oY = Math.round(obj.y);
        const oW = Math.round(obj.w);
        const oH = Math.round(obj.h);

        ctx.strokeStyle = obj.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(oX, oY, oW, oH);
        ctx.setLineDash([]);

        const objTag = `${obj.icon} ${obj.label.toUpperCase()} (${obj.confidence}%)`;
        ctx.fillStyle = obj.color;
        const objTagW = objTag.length * 7.6 + 14;
        const objTagY = Math.max(0, oY - 22);
        ctx.fillRect(oX, objTagY, objTagW, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(objTag, oX + 6, objTagY + 15);
      });

      animFrameRef.current = requestAnimationFrame(trackLoop);
    };

    animFrameRef.current = requestAnimationFrame(trackLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
  }, [isWebcamActive, boxColor, boxThickness]);

  const copyQrLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(remoteStreamUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

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
            Soporta cámara integrada de PC, cámara externa USB o vincular la cámara de tu celular vía código QR.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Source Selector: QR Mobile */}
          <button
            onClick={openRemoteCameraModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#0070F2] border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Usar la cámara de tu celular con código QR"
          >
            <Smartphone size={15} />
            <span>Vincular Celular (QR)</span>
          </button>

          {/* Clear Telemetry Button */}
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-300 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Borrar todas las interacciones y restablecer telemetría"
          >
            <Trash2 size={15} />
            <span>Limpiar Telemetría</span>
          </button>

          {!isWebcamActive ? (
            <button
              onClick={() => startLocalCamera(selectedDeviceId)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Video size={16} />
              <span>Activar Cámara</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
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
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <VideoOff size={15} />
                <span>Detener</span>
              </button>
            </div>
          )}

          <Link
            href="/monitor/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0070F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <BarChart3 size={15} />
            <span>Ver Analítica</span>
          </Link>
        </div>
      </div>

      {/* Floating Success Toast */}
      {lastInteractionSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span className="text-xs font-bold">{lastInteractionSuccess}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-700 px-2 py-0.5 rounded font-bold">ESTADO ACTUALIZADO</span>
        </div>
      )}

      {/* Camera Source Switcher Bar */}
      {availableCameras.length > 1 && (
        <div className="bg-white border border-[#D9E1E8] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-[#0070F2]" />
            <span className="font-bold text-slate-700">Seleccionar Dispositivo de Video:</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                if (isWebcamActive && videoSourceType === 'local') {
                  startLocalCamera(e.target.value);
                }
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0070F2]"
            >
              {availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `Cámara ${idx + 1} (${cam.deviceId.slice(0, 8)}...)`}
                </option>
              ))}
            </select>
            {videoSourceType === 'remote_mobile' && (
              <button
                onClick={() => startLocalCamera(selectedDeviceId)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Volver a Cámara PC
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
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
          <p className="text-[10px] text-[#556B82] mt-1">Total persistido en BD</p>
        </div>

        {/* Metric 4: Active Held Object */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Objeto Distinguido</span>
            <Package size={16} className="text-cyan-600" />
          </div>
          <div className="text-sm font-bold text-[#1C2D42] truncate flex items-center gap-1.5">
            {activeHeldObject ? (
              <>
                <span>{activeHeldObject.icon}</span>
                <span className="truncate">{activeHeldObject.label}</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal text-xs">Sin objeto detectado</span>
            )}
          </div>
          <p className="text-[10px] text-[#556B82] mt-1 truncate">
            {activeHeldObject ? `Confianza: ${activeHeldObject.confidence}%` : 'Sostenga un objeto en cuadro'}
          </p>
        </div>

      </div>

      {/* Main Grid: Compact Camera (Left 60%) + Live Interaction Feed (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Compact Camera Transmission */}
        <div className="lg:col-span-7 bg-[#1C2D42] border-2 border-emerald-500/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          
          {/* Camera Header Bar */}
          <div className="px-3.5 sm:px-4 py-2 bg-slate-900 flex items-center justify-between z-10 text-white">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isWebcamActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              <p className="text-xs font-bold truncate">
                {videoSourceType === 'remote_mobile' ? '📱 Cámara Móvil (WebRTC P2P)' : 'Cámara de Transmisión'}
              </p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isWebcamActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700/50 text-slate-400 border-slate-600'
                }`}
              >
                {isWebcamActive ? 'EN VIVO' : 'INACTIVA'}
              </span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                isWebcamActive ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 bg-slate-800/60'
              }`}
            >
              {isWebcamActive ? `${liveFps} FPS • 720p HD` : '0 FPS • Inactiva'}
            </span>
          </div>

          {/* Video Container (Clean & Unobstructed) */}
          <div className="relative aspect-video max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
            
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

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {!isWebcamActive && (
              <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Video size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Transmisión en Espera</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Inicie la cámara de la PC o vincule la cámara de su celular escaneando el código QR.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => startLocalCamera(selectedDeviceId)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Usar Cámara PC
                  </button>
                  <button
                    onClick={openRemoteCameraModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode size={14} />
                    <span>Escanear QR Celular</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Footer Bar (Responsive) */}
          <div className="px-3.5 sm:px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-300">
            <span
              className={`truncate ${
                isWebcamActive && genderLabel ? 'font-bold' : 'text-slate-500 font-medium'
              }`}
              style={{ color: isWebcamActive && genderLabel ? boxColor : undefined }}
            >
              {isWebcamActive && genderLabel
                ? `Sujeto: ${genderLabel} (${currentZoneLabel || 'Sector Central'}) • ${framingLabel || 'Primer Plano'}`
                : 'Cámara inactiva • Sin transmisión activa'}
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
              {isWebcamActive && isHoldingActive ? (
                <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                  ⏳ 3s: {holdingSeconds.toFixed(1)}s ({holdingProgress}%)
                </span>
              ) : null}
              {isWebcamActive && activeHeldObject ? (
                <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
                  {activeHeldObject.icon} {activeHeldObject.label}
                </span>
              ) : null}
            </div>
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
                    Sostenga un objeto (celular, botella, taza, libro) o permanezca frente a la cámara 3s.
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

      {/* COMPREHENSIVE TELEMETRY & SYSTEM CONSOLE PANEL */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E1E8] gap-3">
          <div className="flex items-center gap-2.5">
            <Activity size={18} className="text-[#0070F2]" />
            <div>
              <h2 className="text-sm font-bold text-[#1C2D42]">Panel Global de Telemetría & Diagnóstico IA</h2>
              <p className="text-xs text-[#556B82]">Matriz antropométrica, rendimiento de inferencia y estado de memoria local.</p>
            </div>
          </div>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Limpiar Todos los Datos</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Motor de Inferencia & Rendimiento */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Cpu size={14} className="text-emerald-600" />
                Pipeline de Inferencia
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-bold">
                OPERACIONAL
              </span>
            </div>
            
            <div className="text-xs text-slate-600 space-y-1 font-mono pt-1">
              <div className="flex justify-between">
                <span>Rastreador Facial:</span>
                <span className="font-bold text-slate-800">BlazeFace (GPU / WebGL)</span>
              </div>
              <div className="flex justify-between">
                <span>Detector Objetos:</span>
                <span className="font-bold text-slate-800">EfficientDet (CPU / WASM)</span>
              </div>
              <div className="flex justify-between">
                <span>Frecuencia Actual:</span>
                <span className="font-bold text-emerald-600">{liveFps} FPS</span>
              </div>
              <div className="flex justify-between">
                <span>Latencia de Frame:</span>
                <span className="font-bold text-slate-800">~{liveFps > 0 ? (1000 / liveFps).toFixed(1) : 33.3} ms</span>
              </div>
            </div>
          </div>

          {/* Card 2: Matriz Antropométrica & Encuadre */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Crosshair size={14} className="text-blue-600" />
                Matriz Espacial de Sujeto
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-bold">
                EN VIVO
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 font-mono pt-1">
              <div className="flex justify-between">
                <span>Caja de Rostro:</span>
                <span className="font-bold text-slate-800">{spatialData.ratio} px</span>
              </div>
              <div className="flex justify-between">
                <span>Caja de Cuerpo Estimado:</span>
                <span className="font-bold text-slate-800">{spatialData.targetW}x{spatialData.targetH} px</span>
              </div>
              <div className="flex justify-between">
                <span>Centroide (X, Y):</span>
                <span className="font-bold text-slate-800">[{spatialData.centerX}, {spatialData.centerY}]</span>
              </div>
              <div className="flex justify-between">
                <span>Confiabilidad IA:</span>
                <span className="font-bold text-emerald-600">{confidenceScore}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Estado de Persistencia & Telemetría BD */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-purple-600" />
                Almacenamiento Local (BD)
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-mono px-1.5 py-0.5 rounded font-bold">
                SINCRONIZADO
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 font-mono pt-1">
              <div className="flex justify-between">
                <span>Eventos 3s Guardados:</span>
                <span className="font-bold text-amber-600">{interactionCount} registros</span>
              </div>
              <div className="flex justify-between">
                <span>Sujetos Únicos:</span>
                <span className="font-bold text-slate-800">{demographicsSummary.totalUniquePeople} personas</span>
              </div>
              <div className="flex justify-between">
                <span>Ratio Masc / Fem:</span>
                <span className="font-bold text-slate-800">
                  {demographicsSummary.totalUniquePeople > 0
                    ? `${Math.round((demographicsSummary.maleCount / demographicsSummary.totalUniquePeople) * 100)}% / ${Math.round((demographicsSummary.femaleCount / demographicsSummary.totalUniquePeople) * 100)}%`
                    : '0% / 0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estado de Almacenamiento:</span>
                <span className="font-bold text-emerald-600">Activo (Local/Cloud)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: QR CODE REMOTE MOBILE CAMERA */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 space-y-4 text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0070F2] flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C2D42]">Vincular Cámara de Celular</h3>
                  <p className="text-[11px] text-slate-500">Transmisión WebRTC P2P en tiempo real</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-[#0070F2] px-2 py-0.5 rounded font-bold">
                EN VIVO
              </span>
            </div>

            {/* Base URL / Tunnel Input */}
            <div className="text-left space-y-1.5 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Dirección de Acceso Móvil (Túnel / IP):</span>
                <span className="text-[10px] text-[#0070F2] font-mono">HTTPS Recomendado</span>
              </div>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => {
                  setCustomBaseUrl(e.target.value);
                  generateQrWithBase(e.target.value, mobileSessionId);
                }}
                placeholder="https://tu-tunel.loca.lt o http://192.168.100.9:3000"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0070F2]"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => {
                    const localIp = 'http://192.168.100.9:3000';
                    setCustomBaseUrl(localIp);
                    generateQrWithBase(localIp, mobileSessionId);
                  }}
                  className="px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-semibold transition-colors"
                >
                  Wi-Fi (192.168.100.9)
                </button>
                <button
                  onClick={() => {
                    const localHost = 'http://localhost:3000';
                    setCustomBaseUrl(localHost);
                    generateQrWithBase(localHost, mobileSessionId);
                  }}
                  className="px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-semibold transition-colors"
                >
                  Localhost
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl inline-block mx-auto shadow-inner">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code Transmisor Celular"
                  className="w-52 h-52 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  Generando código QR...
                </div>
              )}
            </div>

            {/* Quick Tunnel Tip */}
            <div className="p-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl text-[11px] text-[#0052B4] text-left leading-relaxed">
              <strong>💡 Túnel HTTPS instantáneo:</strong> Para habilitar la cámara en el navegador del celular con HTTPS seguro, puedes ejecutar en tu terminal: <code className="bg-blue-100 px-1 rounded font-mono text-[10px]">npx localtunnel --port 3000</code> y pegar la URL generada en el campo superior.
            </div>

            {/* Direct Link Copy */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={remoteStreamUrl}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-600 truncate focus:outline-none"
              />
              <button
                onClick={copyQrLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Status & Close */}
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${remoteConnectionStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
                <span>{remoteConnectionStatus === 'connected' ? 'Celular conectado' : 'Esperando escaneo...'}</span>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 text-center space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1C2D42]">
                ¿Limpiar Telemetría & Registros?
              </h3>
              <p className="text-xs text-[#556B82] mt-1.5 leading-relaxed">
                Esta acción eliminará de forma irreversible el historial de <strong>{interactionCount} interacciones</strong> registradas, las estadísticas demográficas y reiniciará los contadores a cero.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 text-left flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <span>La base de datos local y el caché de transmisión se reestablecerán inmediatamente.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearTelemetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Sí, Limpiar Todo</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

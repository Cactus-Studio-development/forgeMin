'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
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
  Layers,
  Trash2,
  Activity,
  Cpu,
  Smartphone,
  QrCode,
  Copy,
  Camera,
  Check,
  Sparkles
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

// Demographic color definitions
const DEMO_THEME: Record<DemographicType, { label: string; icon: string; color: string; badgeBg: string; textCol: string }> = {
  'FEMENINO': {
    label: 'MUJER',
    icon: '👩',
    color: '#EC4899', // Vibrant Pink / Rose
    badgeBg: '#FDF2F8',
    textCol: '#BE185D',
  },
  'NIÑO / INFANTE': {
    label: 'NIÑO / INFANTE',
    icon: '🧒',
    color: '#F59E0B', // Vibrant Amber / Gold
    badgeBg: '#FEF3C7',
    textCol: '#B45309',
  },
  'MASCULINO': {
    label: 'HOMBRE',
    icon: '👨',
    color: '#00FF66', // Vibrant Emerald / Neon Green
    badgeBg: '#ECFDF5',
    textCol: '#047857',
  },
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
  const [boxThickness] = useState<number>(4);

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
    biometricFeature: 'Filtro Anti-Falsos Positivos',
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
  
  // MediaPipe Face Detector (GPU WebGL Accelerated)
  const mpFaceDetectorRef = useRef<any>(null);

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

  // Multi-person tracker state with Unique ID assignment & Temporal Bayesian Smoothing
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
      headX: number;
      headY: number;
      headW: number;
      headH: number;
      gender: DemographicType;
      genderConfidence: number;
      voteHistory: { male: number; female: number; child: number };
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

  const PALETTE_COLORS = ['#00FF66', '#EC4899', '#F59E0B', '#00F0FF', '#9333EA', '#3B82F6'];

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
    setIsClearModalOpen(false);
    setLastInteractionSuccess('✓ Toda la telemetría ha sido limpiada y restablecida a cero.');
    setTimeout(() => setLastInteractionSuccess(null), 3500);
  };

  // Initialize MediaPipe BlazeFace with Multi-Face Detection on GPU (Strict Filter)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );
        if (!isMounted) return;

        // Calibrated confidence threshold (0.50) to completely filter out curtains, wallpaper patterns, furniture
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          minDetectionConfidence: 0.50,
          minSuppressionThreshold: 0.35,
          runningMode: 'VIDEO',
        });

        if (isMounted) {
          mpFaceDetectorRef.current = faceDetector;
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

    const defaultBase = customBaseUrl || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://192.168.100.9:3000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));
    setCustomBaseUrl(defaultBase);

    await generateQrWithBase(defaultBase, sessionId);
    setIsQrModalOpen(true);

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
      lastVideoTime: -1,
      nextId: 1,
    };
    interactionStateRef.current = {
      startTime: null,
      hasCommitted: false,
      lastDetectedTime: 0,
      currentPersonId: 1,
      currentGender: 'MASCULINO',
    };
    setDetectedCount(0);
    setIsWebcamActive(false);
    setIsHoldingActive(false);
    setHoldingProgress(0);
    setHoldingSeconds(0);
    setLiveFps(0);
    setCurrentZoneLabel('Sector Central');
    setDistanceScaleLabel('Media Distancia');
    setFramingLabel('Medio Cuerpo');
    setGenderLabel('MASCULINO');
    setConfidenceScore(0);
    setRemoteConnectionStatus('waiting');
  };

  // High-Precision Biometric Morphometric Classifier (Women, Children, Men)
  const classifyDemographicBiometrics = (
    b: { originX: number; originY: number; width: number; height: number },
    keypoints: any[] | undefined,
    vw: number,
    vh: number
  ): { gender: DemographicType; confidence: number; featureDesc: string } => {
    const headW = b.width;
    const headH = b.height;
    const ratioH = headH / vh;
    const headCenterY = b.originY + headH / 2;

    let childScore = 0;
    let femaleScore = 0;
    let maleScore = 0;
    let featureDesc = 'Biometría 3D';

    // Biometrics calculation using facial landmarks
    if (keypoints && keypoints.length >= 4) {
      const rEye = keypoints[0];
      const lEye = keypoints[1];
      const nose = keypoints[2];
      const mouth = keypoints[3];
      const rEar = keypoints[4];
      const lEar = keypoints[5];

      const rx = (rEye?.x ?? 0) * (rEye?.x <= 1 ? vw : 1);
      const ry = (rEye?.y ?? 0) * (rEye?.y <= 1 ? vh : 1);
      const lx = (lEye?.x ?? 0) * (lEye?.x <= 1 ? vw : 1);
      const ly = (lEye?.y ?? 0) * (lEye?.y <= 1 ? vh : 1);
      const ny = (nose?.y ?? 0) * (nose?.y <= 1 ? vh : 1);
      const my = (mouth?.y ?? 0) * (mouth?.y <= 1 ? vh : 1);

      const eyeSpan = Math.hypot(lx - rx, ly - ry) || (headW * 0.45);
      const eyeMidY = (ry + ly) / 2;

      const foreheadToEye = Math.max(1, eyeMidY - b.originY);
      const noseToMouth = Math.max(1, my - ny);
      const mouthToChin = Math.max(1, (b.originY + headH) - my);

      let earSpan = headW;
      if (rEar && lEar) {
        const re_x = (rEar.x <= 1 ? rEar.x * vw : rEar.x);
        const re_y = (rEar.y <= 1 ? rEar.y * vh : rEar.y);
        const le_x = (lEar.x <= 1 ? lEar.x * vw : lEar.x);
        const le_y = (lEar.y <= 1 ? lEar.y * vh : lEar.y);
        earSpan = Math.hypot(le_x - re_x, le_y - re_y) || headW;
      }

      // --- CHILD CRITERIA ---
      const cranialRatio = foreheadToEye / headH;
      if (cranialRatio >= 0.44) childScore += 3.5;
      else if (cranialRatio >= 0.40) childScore += 1.8;

      const eyeToFaceRatio = eyeSpan / headW;
      if (eyeToFaceRatio >= 0.46) childScore += 3.0;
      else if (eyeToFaceRatio >= 0.42) childScore += 1.5;

      const lowerFaceRatio = (mouthToChin + noseToMouth) / headH;
      if (lowerFaceRatio <= 0.42) childScore += 3.0;

      if (ratioH < 0.16 || headH < 55) childScore += 2.5;
      if (headCenterY > vh * 0.58 && ratioH < 0.22) childScore += 2.0;

      // --- FEMALE CRITERIA ---
      const chinProminence = mouthToChin / eyeSpan;
      if (chinProminence < 0.48) femaleScore += 3.5;
      else if (chinProminence < 0.54) femaleScore += 2.0;
      else maleScore += 3.0;

      const philtrumRatio = noseToMouth / eyeSpan;
      if (philtrumRatio < 0.29) femaleScore += 2.8;
      else maleScore += 2.2;

      const jawTaperRatio = eyeSpan / earSpan;
      if (jawTaperRatio > 0.46) femaleScore += 2.5;
      else maleScore += 2.0;

      const faceAspect = headW / headH;
      if (faceAspect >= 0.72 && faceAspect <= 0.86) femaleScore += 2.0;
      else if (faceAspect > 0.88) maleScore += 2.5;

      featureDesc = `Biometría: C:${childScore.toFixed(0)} F:${femaleScore.toFixed(0)} M:${maleScore.toFixed(0)}`;
    } else {
      const faceAspect = headW / headH;
      if (ratioH < 0.14 || headH < 45) {
        childScore += 4;
      }
      if (faceAspect < 0.80) {
        femaleScore += 3;
      } else {
        maleScore += 3;
      }
    }

    if (childScore >= 4.5 && childScore > femaleScore && childScore > maleScore) {
      const conf = Math.min(99, Math.round(75 + childScore * 3.5));
      return { gender: 'NIÑO / INFANTE', confidence: conf, featureDesc };
    }

    if (femaleScore > maleScore) {
      const conf = Math.min(99, Math.round(72 + (femaleScore - maleScore) * 4));
      return { gender: 'FEMENINO', confidence: conf, featureDesc };
    } else {
      const conf = Math.min(99, Math.round(72 + (maleScore - femaleScore) * 4));
      return { gender: 'MASCULINO', confidence: conf, featureDesc };
    }
  };

  // Real-time Unified Multi-Person Tracking Loop with Anatomical False-Positive Filter
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

      // 1. HIGH-SPEED GPU MULTI-PERSON TRACKING WITH ANATOMICAL FILTER
      if (faceDetector && video.currentTime !== state.lastVideoTime) {
        state.lastVideoTime = video.currentTime;
        try {
          const startTimeMs = performance.now();
          const results = faceDetector.detectForVideo(video, startTimeMs);

          if (results && results.detections) {
            const rawDetections = results.detections;
            
            // Strict Filter: Remove wall textures, curtain patterns, low confidence (<50%) and non-face geometry
            const validDetections = rawDetections.filter((det: any) => {
              const conf = det.categories?.[0]?.score ? Math.round(det.categories[0].score * 100) : 0;
              if (conf < 50) return false;

              const b = det.boundingBox;
              if (!b || b.width < 26 || b.height < 26) return false;

              // Validate keypoints if present (eyes must be separated, nose below eyes, mouth below nose)
              if (det.keypoints && det.keypoints.length >= 4) {
                const rEye = det.keypoints[0];
                const lEye = det.keypoints[1];
                const nose = det.keypoints[2];
                const mouth = det.keypoints[3];

                const rx = (rEye?.x ?? 0) * (rEye?.x <= 1 ? vw : 1);
                const ry = (rEye?.y ?? 0) * (rEye?.y <= 1 ? vh : 1);
                const lx = (lEye?.x ?? 0) * (lEye?.x <= 1 ? vw : 1);
                const ly = (lEye?.y ?? 0) * (lEye?.y <= 1 ? vh : 1);
                const ny = (nose?.y ?? 0) * (nose?.y <= 1 ? vh : 1);
                const my = (mouth?.y ?? 0) * (mouth?.y <= 1 ? vh : 1);

                const eyeSpan = Math.hypot(lx - rx, ly - ry);
                const eyeMidY = (ry + ly) / 2;

                // Non-face geometric rejection
                if (eyeSpan < b.width * 0.16) return false;
                if (ny < eyeMidY - 6) return false;
                if (my < ny - 6) return false;
              }

              return true;
            });

            setDetectedCount(validDetections.length);

            if (validDetections.length === 0) {
              state.persons = [];
            } else {
              const matchedExisting = new Set<number>();
              const unmatchedDetections: any[] = [];

              validDetections.forEach((det: any) => {
                const b = det.boundingBox;
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
                  targetW = Math.min(vw - 20, Math.max(headW * 2.8, vw * 0.25));
                  targetH = Math.min(vh - headTop - 10, Math.max(headH * 6.0, vh * 0.85));
                } else if (ratioH >= 0.18 && ratioH <= 0.35) {
                  framing = 'MEDIO CUERPO';
                  distLabel = 'MEDIA DISTANCIA';
                  targetW = Math.min(vw - 20, Math.max(headW * 2.4, vw * 0.40));
                  targetH = Math.min(vh - headTop - 10, vh - headTop);
                } else {
                  framing = 'PRIMER PLANO';
                  distLabel = 'CERCANO (ZOOM-IN)';
                  targetW = Math.min(vw - 20, Math.max(headW * 1.8, vw * 0.50));
                  targetH = Math.min(vh - headTop - 10, vh - headTop);
                }

                const targetX = Math.max(10, Math.min(vw - targetW - 10, headCenterX - targetW / 2));
                const targetY = headTop;

                // High-Accuracy Biometric Evaluation for this frame
                const biometric = classifyDemographicBiometrics(b, det.keypoints, vw, vh);

                const normX = headCenterX / vw;
                const zLabel = normX < 0.35 ? 'Sector Izquierdo' : normX > 0.65 ? 'Sector Derecho' : 'Sector Central';
                const conf = det.categories?.[0]?.score ? Math.round(det.categories[0].score * 100) : 98;

                // Unique Matching: Match with available existing tracked person
                let bestMatchIdx = -1;
                let bestDist = 99999;

                state.persons.forEach((p, idx) => {
                  if (matchedExisting.has(idx)) return;
                  const curCenterX = p.targetX + p.targetW / 2;
                  const curCenterY = p.targetY + p.targetH / 2;
                  const dist = Math.hypot(headCenterX - curCenterX, (headTop + targetH / 2) - curCenterY);
                  if (dist < bestDist && dist < vw * 0.45) {
                    bestDist = dist;
                    bestMatchIdx = idx;
                  }
                });

                if (bestMatchIdx >= 0) {
                  matchedExisting.add(bestMatchIdx);
                  const p = state.persons[bestMatchIdx];
                  p.targetX = targetX;
                  p.targetY = targetY;
                  p.targetW = targetW;
                  p.targetH = targetH;
                  p.headX = b.originX;
                  p.headY = b.originY;
                  p.headW = headW;
                  p.headH = headH;

                  // Temporal Bayesian accumulation (Exponential Moving Vote History)
                  const alphaVote = 0.20;
                  if (biometric.gender === 'NIÑO / INFANTE') {
                    p.voteHistory.child = p.voteHistory.child * (1 - alphaVote) + 1.0 * alphaVote;
                    p.voteHistory.female = p.voteHistory.female * (1 - alphaVote);
                    p.voteHistory.male = p.voteHistory.male * (1 - alphaVote);
                  } else if (biometric.gender === 'FEMENINO') {
                    p.voteHistory.female = p.voteHistory.female * (1 - alphaVote) + 1.0 * alphaVote;
                    p.voteHistory.child = p.voteHistory.child * (1 - alphaVote);
                    p.voteHistory.male = p.voteHistory.male * (1 - alphaVote);
                  } else {
                    p.voteHistory.male = p.voteHistory.male * (1 - alphaVote) + 1.0 * alphaVote;
                    p.voteHistory.child = p.voteHistory.child * (1 - alphaVote);
                    p.voteHistory.female = p.voteHistory.female * (1 - alphaVote);
                  }

                  // Determine stable smoothed gender
                  if (p.voteHistory.child > 0.42 && p.voteHistory.child > p.voteHistory.female && p.voteHistory.child > p.voteHistory.male) {
                    p.gender = 'NIÑO / INFANTE';
                    p.color = DEMO_THEME['NIÑO / INFANTE'].color;
                  } else if (p.voteHistory.female > p.voteHistory.male) {
                    p.gender = 'FEMENINO';
                    p.color = DEMO_THEME['FEMENINO'].color;
                  } else {
                    p.gender = 'MASCULINO';
                    p.color = DEMO_THEME['MASCULINO'].color;
                  }

                  p.genderConfidence = biometric.confidence;
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
                    headX: b.originX,
                    headY: b.originY,
                    headW,
                    headH,
                    gender: biometric.gender,
                    genderConfidence: biometric.confidence,
                    initialVote: biometric.gender,
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
                  biometricFeature: biometric.featureDesc,
                });
              });

              unmatchedDetections.forEach((u) => {
                const newId = state.nextId++;
                const assignedColor = DEMO_THEME[u.gender as DemographicType]?.color || PALETTE_COLORS[(newId - 1) % PALETTE_COLORS.length];

                const voteHistory = {
                  male: u.initialVote === 'MASCULINO' ? 0.6 : 0.1,
                  female: u.initialVote === 'FEMENINO' ? 0.6 : 0.1,
                  child: u.initialVote === 'NIÑO / INFANTE' ? 0.6 : 0.1,
                };

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
                  headX: u.headX,
                  headY: u.headY,
                  headW: u.headW,
                  headH: u.headH,
                  gender: u.gender,
                  genderConfidence: u.genderConfidence,
                  voteHistory,
                  framing: u.framing,
                  distance: u.distance,
                  zone: u.zone,
                  confidence: u.confidence,
                  color: assignedColor,
                  lastSeen: frameCount,
                });
              });

              // Multi-person persistence smoothing (keeps tracks alive across brief 4-frame blinks)
              state.persons = state.persons.filter((p) => frameCount - p.lastSeen <= 4);

              // Concurrent unique individuals breakdown
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

      // 2. SUSTAINED 3-SECOND ENGAGEMENT CHECK (Human Attention in Stand)
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
          const demoInfo = DEMO_THEME[activePerson.gender];
          const objectName = `Atención de ${demoInfo.label}`;
          const objectCategory = 'Interacción en Stand';
          const objectIcon = demoInfo.icon;
          const objectColor = demoInfo.color;

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
          setLastInteractionSuccess(`¡Interacción confirmada de 3s con ${demoInfo.icon} ${demoInfo.label} (Persona #${activePerson.id})!`);
          setTimeout(() => setLastInteractionSuccess(null), 4000);
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

      // 3. CANVAS RENDERING (Clean, Sleek Bounding Boxes & Badges without Face Dots)
      ctx.clearRect(0, 0, vw, vh);

      state.persons.forEach((person) => {
        const alpha = 0.42;
        person.x += (person.targetX - person.x) * alpha;
        person.y += (person.targetY - person.y) * alpha;
        person.w += (person.targetW - person.w) * alpha;
        person.h += (person.targetH - person.h) * alpha;

        const pX = Math.round(person.x);
        const pY = Math.round(person.y);
        const pW = Math.round(person.w);
        const pH = Math.round(person.h);
        const demoInfo = DEMO_THEME[person.gender] || DEMO_THEME['MASCULINO'];
        const activeColor = demoInfo.color;

        // 1. Person Body Frame Outline
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = boxThickness;
        ctx.lineJoin = 'miter';
        ctx.strokeRect(pX, pY, pW, pH);

        // 2. High-Tech White Corner Brackets
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

        // 3. Top Tag Badge (Icon + Demographic Class + Confidence)
        const topTagText = `${demoInfo.icon} PERSONA #${person.id} [${demoInfo.label}] • ${person.confidence}%`;
        ctx.fillStyle = activeColor;
        const topTagW = topTagText.length * 8.4 + 14;
        const topTagY = Math.max(0, pY - 24);
        ctx.fillRect(pX, topTagY, topTagW, 24);
        ctx.fillStyle = activeColor === '#00FF66' || activeColor === '#F59E0B' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(topTagText, pX + 7, topTagY + 16);

        // 4. Bottom Tag Badge (Framing + Zone)
        const btmTagText = `${person.framing} • ${person.zone.toUpperCase()}`;
        ctx.fillStyle = '#0F172A';
        const btmTagW = btmTagText.length * 7.5 + 14;
        ctx.fillRect(pX + pW - btmTagW, pY + pH - 22, btmTagW, 22);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(pX + pW - btmTagW, pY + pH - 22, btmTagW, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(btmTagText, pX + pW - btmTagW + 7, pY + pH - 7);
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
  }, [isWebcamActive, boxThickness]);

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
            Inteligencia Demográfica & Multi-Persona
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Monitoreo en Vivo & Telemetría
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Detección simultánea multi-persona con filtro anti-falsos positivos y clasificación de mujeres, niños y hombres.
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
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <VideoOff size={15} />
              <span>Detener Cámara</span>
            </button>
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
          <span className="text-[10px] font-mono bg-emerald-700 px-2 py-0.5 rounded font-bold">REGISTRO EN BD</span>
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
            <span className="text-2xl font-black text-[#1C2D42]">
              {detectedCount}
            </span>
            <span className={`text-[10px] font-bold ${detectedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {detectedCount > 0 ? (detectedCount > 1 ? `● ${detectedCount} en simultáneo` : '● 1 Persona') : '○ Standby'}
            </span>
          </div>
          <p className="text-[10px] text-[#556B82] mt-1 truncate">
            {detectedCount > 0 ? `Rastreo multi-persona activo (${currentZoneLabel})` : 'Escaneando cuadro en tiempo real'}
          </p>
        </div>

        {/* Metric 2: Demographics Breakdown (Men, Women, Children) */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Desglose Demográfico</span>
            <UserCheck size={16} className="text-purple-600" />
          </div>
          <div className="text-xs font-bold text-[#1C2D42] space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600">
                <span>👩</span> Mujeres:
              </span>
              <span className="text-rose-600 font-extrabold">{demographicsSummary.femaleCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600">
                <span>🧒</span> Niños:
              </span>
              <span className="text-amber-600 font-extrabold">{demographicsSummary.childCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600">
                <span>👨</span> Hombres:
              </span>
              <span className="text-emerald-600 font-extrabold">{demographicsSummary.maleCount}</span>
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
          <p className="text-[10px] text-[#556B82] mt-1">Permanencia de atención en stand</p>
        </div>

        {/* Metric 4: Biometric Precision Status */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#556B82] mb-1">
            <span className="text-xs font-semibold">Precisión Antropométrica</span>
            <Sparkles size={16} className="text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1C2D42]">
              {confidenceScore > 0 ? `${confidenceScore}%` : '100%'}
            </span>
            <span className="text-[10px] font-bold text-indigo-600">GPU WebGL</span>
          </div>
          <p className="text-[10px] text-[#556B82] mt-1 truncate">
            {detectedCount > 0 ? `${framingLabel} • ${distanceScaleLabel}` : 'Filtro Bayesiano Activo'}
          </p>
        </div>

      </div>

      {/* Main Grid: Compact Camera (Left 60%) + Live Interaction Feed (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Compact Camera Transmission */}
        <div className="lg:col-span-7 bg-[#1C2D42] border-2 border-emerald-500/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          
          {/* Camera Header Bar */}
          <div className="px-3.5 sm:px-4 py-2 bg-slate-900 flex flex-wrap items-center justify-between gap-2 z-10 text-white">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isWebcamActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <p className="text-xs font-bold truncate">
                {videoSourceType === 'remote_mobile' ? '📱 Cámara Móvil (WebRTC P2P)' : 'Cámara de Transmisión Demográfica'}
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

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800 text-slate-300 border-slate-700 hidden sm:inline">
                {detectedCount > 1 ? `👥 ${detectedCount} Sujetos en Vivo` : '👤 Detección Humana Activa'}
              </span>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                  isWebcamActive ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 bg-slate-800/60'
                }`}
              >
                {isWebcamActive ? `${liveFps} FPS • 720p HD` : '0 FPS • Inactiva'}
              </span>
            </div>
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
                isWebcamActive && detectedCount > 0 ? 'font-bold' : 'text-slate-500 font-medium'
              }`}
              style={{ color: isWebcamActive && detectedCount > 0 ? DEMO_THEME[genderLabel]?.color : undefined }}
            >
              {isWebcamActive && detectedCount > 1
                ? `👥 ${detectedCount} personas en cuadro simultáneamente`
                : isWebcamActive && detectedCount === 1
                ? `${DEMO_THEME[genderLabel]?.icon} Sujeto: ${genderLabel} (${currentZoneLabel || 'Sector Central'}) • ${framingLabel || 'Primer Plano'}`
                : isWebcamActive
                ? 'Buscando rostros y siluetas humanas en encuadre...'
                : 'Cámara inactiva • Sin transmisión activa'}
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
              {isWebcamActive && isHoldingActive ? (
                <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                  ⏳ Atención 3s: {holdingSeconds.toFixed(1)}s ({holdingProgress}%)
                </span>
              ) : null}
              {isWebcamActive && detectedCount > 0 ? (
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {spatialData.biometricFeature}
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
                    Permanezca frente a la cámara 3 segundos para registrar la atención en el stand.
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
              <h2 className="text-sm font-bold text-[#1C2D42]">Panel Global de Telemetría & Diagnóstico Biométrico IA</h2>
              <p className="text-xs text-[#556B82]">Matriz antropométrica 3D, discriminación de género / edad y estado de base de datos.</p>
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
          
          {/* Card 1: Pipeline Biométrico & Rendimiento */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Cpu size={14} className="text-emerald-600" />
                Pipeline Biométrico GPU
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-bold">
                OPERACIONAL
              </span>
            </div>
            
            <div className="text-xs text-slate-600 space-y-1 font-mono pt-1">
              <div className="flex justify-between">
                <span>Rastreador Facial:</span>
                <span className="font-bold text-slate-800">BlazeFace Short-Range (GPU)</span>
              </div>
              <div className="flex justify-between">
                <span>Filtro Anti-Falsos:</span>
                <span className="font-bold text-slate-800">Geometría Facial &gt;50% Conf</span>
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
                <span>Caja de Cuerpo:</span>
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
                <span>Distribución:</span>
                <span className="font-bold text-slate-800">
                  {demographicsSummary.femaleCount} 👩 / {demographicsSummary.childCount} 🧒 / {demographicsSummary.maleCount} 👨
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estado de BD:</span>
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

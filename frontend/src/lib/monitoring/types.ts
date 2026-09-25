export type CameraProtocol = 'RTSP' | 'ONVIF' | 'WEBRTC' | 'HTTP_MJPEG';
export type CameraStatus = 'online' | 'offline' | 'connecting' | 'error' | 'unconfigured';
export type StreamHealth = 'stable' | 'degraded' | 'disconnected' | 'unknown';

export type EventType =
  | 'PERSON_ENTERED'
  | 'PERSON_EXITED'
  | 'HIGH_OCCUPANCY'
  | 'EXTENDED_DWELL'
  | 'CAMERA_OFFLINE'
  | 'CAMERA_ONLINE'
  | 'STREAM_DEGRADED'
  | 'ZONE_INTRUSION';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface ICameraZone {
  id: string;
  name: string;
  polygon?: Array<{ x: number; y: number }>;
  type: 'entry' | 'exit' | 'dwell' | 'general' | 'restricted';
  color?: string;
}

export interface ICameraConfig {
  ip: string;
  port: number;
  protocol: CameraProtocol;
  username?: string;
  password?: string;
  rtspPath?: string;
  onvifProfile?: string;
  fps?: number;
  resolution?: string;
  codec?: string;
  model?: string;
  manufacturer?: string;
}

export interface ICamera {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  description?: string;
  status: CameraStatus;
  streamHealth: StreamHealth;
  config: ICameraConfig;
  zones: ICameraZone[];
  lastConnection?: string | null;
  lastPing?: string | null;
  detectedPersonsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IVideoEvent {
  id: string;
  organizationId: string;
  cameraId: string;
  cameraName?: string;
  zoneId?: string;
  zoneName?: string;
  type: EventType;
  severity: EventSeverity;
  payload: Record<string, any>;
  timestamp: string;
  acknowledged?: boolean;
}

export interface IAlertRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  cameraIds: string[];
  zoneIds: string[];
  eventType: EventType;
  threshold?: number;
  durationSeconds?: number;
  cooldownMinutes?: number;
  severity: EventSeverity;
  enabled: boolean;
  notifyChannels: Array<'app' | 'email' | 'webhook'>;
  createdAt: string;
  updatedAt: string;
}

export interface IAlertIncident {
  id: string;
  organizationId: string;
  ruleId: string;
  ruleName: string;
  cameraId: string;
  cameraName: string;
  zoneId?: string;
  zoneName?: string;
  severity: EventSeverity;
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IZoneAnalytics {
  zoneId: string;
  zoneName: string;
  cameraId: string;
  cameraName: string;
  currentCount: number;
  avgDwellMinutes: number;
  totalEntriesToday: number;
  totalExitsToday: number;
  occupancyPeak: number;
}

export interface IDashboardOverview {
  realtime: {
    totalCameras: number;
    connectedCameras: number;
    disconnectedCameras: number;
    unconfiguredCameras: number;
    currentDetectedPersons: number;
    activeAlertsCount: number;
  };
  historicalToday: {
    entriesToday: number;
    exitsToday: number;
    netTraffic: number;
    avgDwellMinutes: number;
    peakHour: string;
    peakOccupancy: number;
    eventsTodayCount: number;
  };
  hourlyTraffic: Array<{
    hour: string;
    entries: number;
    exits: number;
    avgOccupancy: number;
  }>;
  zoneCirculation: IZoneAnalytics[];
  recentEvents: IVideoEvent[];
  recentAlerts: IAlertIncident[];
}

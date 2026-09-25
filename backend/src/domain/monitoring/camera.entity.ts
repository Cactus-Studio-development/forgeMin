export type CameraProtocol = 'RTSP' | 'ONVIF' | 'WEBRTC' | 'HTTP_MJPEG';
export type CameraStatus = 'online' | 'offline' | 'connecting' | 'error' | 'unconfigured';
export type StreamHealth = 'stable' | 'degraded' | 'disconnected' | 'unknown';

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
  lastConnection?: Date | null;
  lastPing?: Date | null;
  detectedPersonsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Camera implements ICamera {
  constructor(
    public id: string,
    public organizationId: string,
    public name: string,
    public location: string,
    public status: CameraStatus,
    public streamHealth: StreamHealth,
    public config: ICameraConfig,
    public zones: ICameraZone[],
    public detectedPersonsCount: number,
    public createdAt: Date,
    public updatedAt: Date,
    public description?: string,
    public lastConnection?: Date | null,
    public lastPing?: Date | null,
  ) {}
}

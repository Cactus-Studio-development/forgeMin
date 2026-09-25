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
  timestamp: Date;
  acknowledged?: boolean;
}

export class VideoEvent implements IVideoEvent {
  constructor(
    public id: string,
    public organizationId: string,
    public cameraId: string,
    public type: EventType,
    public severity: EventSeverity,
    public payload: Record<string, any>,
    public timestamp: Date,
    public cameraName?: string,
    public zoneId?: string,
    public zoneName?: string,
    public acknowledged?: boolean,
  ) {}
}

export interface IAlertRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  cameraIds: string[]; // empty means all cameras
  zoneIds: string[];
  eventType: EventType;
  threshold?: number; // e.g. more than 15 people or 10 min dwell
  durationSeconds?: number;
  cooldownMinutes?: number;
  severity: EventSeverity;
  enabled: boolean;
  notifyChannels: Array<'app' | 'email' | 'webhook'>;
  createdAt: Date;
  updatedAt: Date;
}

export class AlertRule implements IAlertRule {
  constructor(
    public id: string,
    public organizationId: string,
    public name: string,
    public cameraIds: string[],
    public zoneIds: string[],
    public eventType: EventType,
    public severity: EventSeverity,
    public enabled: boolean,
    public notifyChannels: Array<'app' | 'email' | 'webhook'>,
    public createdAt: Date,
    public updatedAt: Date,
    public description?: string,
    public threshold?: number,
    public durationSeconds?: number,
    public cooldownMinutes?: number,
  ) {}
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
  createdAt: Date;
  resolvedAt?: Date | null;
}

export class AlertIncident implements IAlertIncident {
  constructor(
    public id: string,
    public organizationId: string,
    public ruleId: string,
    public ruleName: string,
    public cameraId: string,
    public cameraName: string,
    public severity: EventSeverity,
    public message: string,
    public details: Record<string, any>,
    public status: 'active' | 'acknowledged' | 'resolved',
    public createdAt: Date,
    public zoneId?: string,
    public zoneName?: string,
    public resolvedAt?: Date | null,
  ) {}
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

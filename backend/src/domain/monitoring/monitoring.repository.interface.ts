import { Camera } from './camera.entity';
import { VideoEvent, AlertRule, AlertIncident } from './monitoring-events.entity';

export const CAMERA_REPOSITORY = 'ICameraRepository';
export const VIDEO_EVENT_REPOSITORY = 'IVideoEventRepository';
export const ALERT_RULE_REPOSITORY = 'IAlertRuleRepository';
export const ALERT_INCIDENT_REPOSITORY = 'IAlertIncidentRepository';

export interface ICameraRepository {
  findById(id: string): Promise<Camera | null>;
  findByOrganizationId(organizationId: string): Promise<Camera[]>;
  create(camera: Camera): Promise<Camera>;
  update(id: string, camera: Partial<Camera>): Promise<Camera>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: Camera['status'], streamHealth?: Camera['streamHealth'], lastPing?: Date): Promise<void>;
  updateDetectedPersons(id: string, count: number): Promise<void>;
}

export interface IVideoEventRepository {
  findById(id: string): Promise<VideoEvent | null>;
  findByOrganization(
    organizationId: string,
    filters?: {
      cameraId?: string;
      zoneId?: string;
      type?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<VideoEvent[]>;
  create(event: VideoEvent): Promise<VideoEvent>;
  createBatch(events: VideoEvent[]): Promise<void>;
  acknowledge(id: string): Promise<void>;
}

export interface IAlertRuleRepository {
  findById(id: string): Promise<AlertRule | null>;
  findByOrganizationId(organizationId: string): Promise<AlertRule[]>;
  create(rule: AlertRule): Promise<AlertRule>;
  update(id: string, rule: Partial<AlertRule>): Promise<AlertRule>;
  delete(id: string): Promise<void>;
  toggleEnabled(id: string, enabled: boolean): Promise<void>;
}

export interface IAlertIncidentRepository {
  findById(id: string): Promise<AlertIncident | null>;
  findByOrganizationId(organizationId: string, status?: 'active' | 'acknowledged' | 'resolved'): Promise<AlertIncident[]>;
  create(incident: AlertIncident): Promise<AlertIncident>;
  updateStatus(id: string, status: 'active' | 'acknowledged' | 'resolved', resolvedAt?: Date): Promise<void>;
}

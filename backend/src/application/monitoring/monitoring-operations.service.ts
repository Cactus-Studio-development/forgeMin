import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  VIDEO_EVENT_REPOSITORY,
  ALERT_RULE_REPOSITORY,
  ALERT_INCIDENT_REPOSITORY,
  CAMERA_REPOSITORY,
  IVideoEventRepository,
  IAlertRuleRepository,
  IAlertIncidentRepository,
  ICameraRepository,
} from '../../domain/monitoring/monitoring.repository.interface';
import {
  VideoEvent,
  AlertRule,
  AlertIncident,
  EventType,
  EventSeverity,
  IZoneAnalytics,
} from '../../domain/monitoring/monitoring-events.entity';
import * as crypto from 'crypto';

export interface CreateEventDto {
  organizationId: string;
  cameraId: string;
  cameraName?: string;
  zoneId?: string;
  zoneName?: string;
  type: EventType;
  severity?: EventSeverity;
  payload?: Record<string, any>;
  timestamp?: string | Date;
}

export interface CreateAlertRuleDto {
  organizationId: string;
  name: string;
  description?: string;
  cameraIds?: string[];
  zoneIds?: string[];
  eventType: EventType;
  threshold?: number;
  durationSeconds?: number;
  cooldownMinutes?: number;
  severity: EventSeverity;
  enabled?: boolean;
  notifyChannels?: Array<'app' | 'email' | 'webhook'>;
}

export interface IngestVisionPayloadDto {
  organizationId: string;
  cameraId: string;
  frameTimestamp: string;
  currentDetections: {
    personsCount: number;
    tracks: Array<{
      trackId: number;
      zoneId?: string;
      dwellSeconds: number;
      box?: [number, number, number, number];
    }>;
  };
  eventsTriggered?: Array<{
    type: EventType;
    zoneId?: string;
    zoneName?: string;
    severity?: EventSeverity;
    payload?: Record<string, any>;
  }>;
}

@Injectable()
export class MonitoringOperationsService {
  constructor(
    @Inject(VIDEO_EVENT_REPOSITORY)
    private readonly eventRepository: IVideoEventRepository,
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    @Inject(ALERT_INCIDENT_REPOSITORY)
    private readonly incidentRepository: IAlertIncidentRepository,
    @Inject(CAMERA_REPOSITORY)
    private readonly cameraRepository: ICameraRepository,
  ) {}

  // ----------------------------------------------------
  // EVENTS
  // ----------------------------------------------------
  async listEvents(
    organizationId: string,
    filters?: {
      cameraId?: string;
      zoneId?: string;
      type?: string;
      severity?: string;
      limit?: number;
    },
  ): Promise<VideoEvent[]> {
    return this.eventRepository.findByOrganization(organizationId, filters);
  }

  async createEvent(dto: CreateEventDto): Promise<VideoEvent> {
    const id = 'evt_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const ts = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const event = new VideoEvent(
      id,
      dto.organizationId || 'default-org',
      dto.cameraId,
      dto.type,
      dto.severity || 'info',
      dto.payload || {},
      ts,
      dto.cameraName,
      dto.zoneId,
      dto.zoneName,
      false,
    );

    const saved = await this.eventRepository.create(event);

    // Check alert rules triggered by this event
    await this.evaluateAlertRulesForEvent(saved);

    return saved;
  }

  async acknowledgeEvent(id: string): Promise<void> {
    await this.eventRepository.acknowledge(id);
  }

  // ----------------------------------------------------
  // ALERT RULES
  // ----------------------------------------------------
  async listAlertRules(organizationId: string): Promise<AlertRule[]> {
    return this.alertRuleRepository.findByOrganizationId(organizationId);
  }

  async createAlertRule(dto: CreateAlertRuleDto): Promise<AlertRule> {
    const id = 'rule_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const now = new Date();

    const rule = new AlertRule(
      id,
      dto.organizationId || 'default-org',
      dto.name,
      dto.cameraIds || [],
      dto.zoneIds || [],
      dto.eventType,
      dto.severity || 'warning',
      dto.enabled ?? true,
      dto.notifyChannels || ['app'],
      now,
      now,
      dto.description || '',
      dto.threshold,
      dto.durationSeconds,
      dto.cooldownMinutes,
    );

    return this.alertRuleRepository.create(rule);
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    return this.alertRuleRepository.update(id, { ...updates, updatedAt: new Date() });
  }

  async deleteAlertRule(id: string): Promise<void> {
    await this.alertRuleRepository.delete(id);
  }

  async toggleAlertRule(id: string, enabled: boolean): Promise<void> {
    await this.alertRuleRepository.toggleEnabled(id, enabled);
  }

  // ----------------------------------------------------
  // INCIDENTS
  // ----------------------------------------------------
  async listIncidents(organizationId: string, status?: 'active' | 'acknowledged' | 'resolved'): Promise<AlertIncident[]> {
    return this.incidentRepository.findByOrganizationId(organizationId, status);
  }

  async updateIncidentStatus(id: string, status: 'active' | 'acknowledged' | 'resolved'): Promise<void> {
    const resolvedAt = status === 'resolved' ? new Date() : undefined;
    await this.incidentRepository.updateStatus(id, status, resolvedAt);
  }

  private async evaluateAlertRulesForEvent(event: VideoEvent): Promise<void> {
    const rules = await this.alertRuleRepository.findByOrganizationId(event.organizationId);
    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.eventType !== event.type) continue;

      if (rule.cameraIds && rule.cameraIds.length > 0 && !rule.cameraIds.includes(event.cameraId)) {
        continue;
      }

      if (rule.zoneIds && rule.zoneIds.length > 0 && event.zoneId && !rule.zoneIds.includes(event.zoneId)) {
        continue;
      }

      // Trigger incident
      const incidentId = 'inc_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const incident = new AlertIncident(
        incidentId,
        event.organizationId,
        rule.id,
        rule.name,
        event.cameraId,
        event.cameraName || 'Cámara',
        rule.severity,
        `Regla activada: ${rule.name} detectó evento de tipo ${event.type}`,
        event.payload,
        'active',
        new Date(),
        event.zoneId,
        event.zoneName,
      );

      await this.incidentRepository.create(incident);
    }
  }

  // ----------------------------------------------------
  // COMPUTER VISION INGESTION GATEWAY
  // ----------------------------------------------------
  async ingestVisionTelemetry(dto: IngestVisionPayloadDto): Promise<{ success: boolean; eventsLogged: number }> {
    // 1. Update camera detected persons count & online health
    await this.cameraRepository.updateDetectedPersons(dto.cameraId, dto.currentDetections.personsCount);
    await this.cameraRepository.updateStatus(dto.cameraId, 'online', 'stable', new Date());

    let logged = 0;
    // 2. Process events
    if (dto.eventsTriggered && dto.eventsTriggered.length > 0) {
      for (const rawEvt of dto.eventsTriggered) {
        await this.createEvent({
          organizationId: dto.organizationId,
          cameraId: dto.cameraId,
          type: rawEvt.type,
          severity: rawEvt.severity || 'info',
          zoneId: rawEvt.zoneId,
          zoneName: rawEvt.zoneName,
          payload: rawEvt.payload || {},
        });
        logged++;
      }
    }

    return { success: true, eventsLogged: logged };
  }
}

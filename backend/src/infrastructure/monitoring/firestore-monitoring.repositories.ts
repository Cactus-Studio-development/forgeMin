import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import { Camera } from '../../domain/monitoring/camera.entity';
import { VideoEvent, AlertRule, AlertIncident } from '../../domain/monitoring/monitoring-events.entity';
import {
  ICameraRepository,
  IVideoEventRepository,
  IAlertRuleRepository,
  IAlertIncidentRepository,
} from '../../domain/monitoring/monitoring.repository.interface';

const parseDate = (d: any) => (d?.toDate ? d.toDate() : d ? new Date(d) : new Date());

@Injectable()
export class FirestoreCameraRepository implements ICameraRepository {
  private collectionName = 'monitoring_cameras';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  private toEntity(data: any): Camera {
    if (!data) return data;
    return new Camera(
      data.id,
      data.organizationId || 'default-org',
      data.name,
      data.location || 'General',
      data.status || 'unconfigured',
      data.streamHealth || 'unknown',
      data.config || {},
      data.zones || [],
      data.detectedPersonsCount || 0,
      parseDate(data.createdAt),
      parseDate(data.updatedAt),
      data.description || '',
      data.lastConnection ? parseDate(data.lastConnection) : null,
      data.lastPing ? parseDate(data.lastPing) : null,
    );
  }

  async findById(id: string): Promise<Camera | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByOrganizationId(organizationId: string): Promise<Camera[]> {
    const snap = await this.collection.where('organizationId', '==', organizationId).get();
    return snap.docs.map((doc) => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async create(camera: Camera): Promise<Camera> {
    await this.collection.doc(camera.id).set(JSON.parse(JSON.stringify(camera)));
    return camera;
  }

  async update(id: string, camera: Partial<Camera>): Promise<Camera> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Camera with id ${id} not found`);
    const merged = { ...existing, ...camera, updatedAt: new Date() };
    await this.collection.doc(id).set(JSON.parse(JSON.stringify(merged)), { merge: true });
    return this.toEntity(merged);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async updateStatus(
    id: string,
    status: Camera['status'],
    streamHealth?: Camera['streamHealth'],
    lastPing?: Date,
  ): Promise<void> {
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };
    if (streamHealth) updatePayload.streamHealth = streamHealth;
    if (lastPing) updatePayload.lastPing = lastPing;
    if (status === 'online') updatePayload.lastConnection = new Date();

    await this.collection.doc(id).set(updatePayload, { merge: true });
  }

  async updateDetectedPersons(id: string, count: number): Promise<void> {
    await this.collection.doc(id).set({ detectedPersonsCount: count, updatedAt: new Date() }, { merge: true });
  }
}

@Injectable()
export class FirestoreVideoEventRepository implements IVideoEventRepository {
  private collectionName = 'monitoring_events';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  private toEntity(data: any): VideoEvent {
    if (!data) return data;
    return new VideoEvent(
      data.id,
      data.organizationId,
      data.cameraId,
      data.type,
      data.severity || 'info',
      data.payload || {},
      parseDate(data.timestamp),
      data.cameraName,
      data.zoneId,
      data.zoneName,
      data.acknowledged ?? false,
    );
  }

  async findById(id: string): Promise<VideoEvent | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByOrganization(
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
  ): Promise<VideoEvent[]> {
    let query: any = this.collection.where('organizationId', '==', organizationId);

    if (filters?.cameraId) {
      query = query.where('cameraId', '==', filters.cameraId);
    }
    if (filters?.type) {
      query = query.where('type', '==', filters.type);
    }
    if (filters?.severity) {
      query = query.where('severity', '==', filters.severity);
    }

    const limitCount = filters?.limit || 100;
    const snapshot = await query.limit(limitCount).get();
    let events: VideoEvent[] = snapshot.docs.map((doc: any) => this.toEntity({ id: doc.id, ...doc.data() }));

    if (filters?.zoneId) {
      events = events.filter((e: VideoEvent) => e.zoneId === filters.zoneId);
    }
    if (filters?.startDate) {
      events = events.filter((e: VideoEvent) => e.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      events = events.filter((e: VideoEvent) => e.timestamp <= filters.endDate!);
    }

    return events.sort((a: VideoEvent, b: VideoEvent) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async create(event: VideoEvent): Promise<VideoEvent> {
    await this.collection.doc(event.id).set(JSON.parse(JSON.stringify(event)));
    return event;
  }

  async createBatch(events: VideoEvent[]): Promise<void> {
    const batch = this.collection.firestore.batch();
    events.forEach((evt) => {
      const ref = this.collection.doc(evt.id);
      batch.set(ref, JSON.parse(JSON.stringify(evt)));
    });
    await batch.commit();
  }

  async acknowledge(id: string): Promise<void> {
    await this.collection.doc(id).set({ acknowledged: true }, { merge: true });
  }
}

@Injectable()
export class FirestoreAlertRuleRepository implements IAlertRuleRepository {
  private collectionName = 'monitoring_alert_rules';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  private toEntity(data: any): AlertRule {
    if (!data) return data;
    return new AlertRule(
      data.id,
      data.organizationId,
      data.name,
      data.cameraIds || [],
      data.zoneIds || [],
      data.eventType,
      data.severity || 'warning',
      data.enabled ?? true,
      data.notifyChannels || ['app'],
      parseDate(data.createdAt),
      parseDate(data.updatedAt),
      data.description,
      data.threshold,
      data.durationSeconds,
      data.cooldownMinutes,
    );
  }

  async findById(id: string): Promise<AlertRule | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByOrganizationId(organizationId: string): Promise<AlertRule[]> {
    const snap = await this.collection.where('organizationId', '==', organizationId).get();
    return snap.docs.map((doc) => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async create(rule: AlertRule): Promise<AlertRule> {
    await this.collection.doc(rule.id).set(JSON.parse(JSON.stringify(rule)));
    return rule;
  }

  async update(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Alert rule with id ${id} not found`);
    const merged = { ...existing, ...rule, updatedAt: new Date() };
    await this.collection.doc(id).set(JSON.parse(JSON.stringify(merged)), { merge: true });
    return this.toEntity(merged);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async toggleEnabled(id: string, enabled: boolean): Promise<void> {
    await this.collection.doc(id).set({ enabled, updatedAt: new Date() }, { merge: true });
  }
}

@Injectable()
export class FirestoreAlertIncidentRepository implements IAlertIncidentRepository {
  private collectionName = 'monitoring_alert_incidents';

  private get collection() {
    return getFirestore().collection(this.collectionName);
  }

  private toEntity(data: any): AlertIncident {
    if (!data) return data;
    return new AlertIncident(
      data.id,
      data.organizationId,
      data.ruleId,
      data.ruleName,
      data.cameraId,
      data.cameraName,
      data.severity || 'warning',
      data.message,
      data.details || {},
      data.status || 'active',
      parseDate(data.createdAt),
      data.zoneId,
      data.zoneName,
      data.resolvedAt ? parseDate(data.resolvedAt) : null,
    );
  }

  async findById(id: string): Promise<AlertIncident | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.toEntity({ id: doc.id, ...doc.data() });
  }

  async findByOrganizationId(organizationId: string, status?: 'active' | 'acknowledged' | 'resolved'): Promise<AlertIncident[]> {
    let query: any = this.collection.where('organizationId', '==', organizationId);
    if (status) {
      query = query.where('status', '==', status);
    }
    const snap = await query.get();
    return snap.docs.map((doc: any) => this.toEntity({ id: doc.id, ...doc.data() }));
  }

  async create(incident: AlertIncident): Promise<AlertIncident> {
    await this.collection.doc(incident.id).set(JSON.parse(JSON.stringify(incident)));
    return incident;
  }

  async updateStatus(id: string, status: 'active' | 'acknowledged' | 'resolved', resolvedAt?: Date): Promise<void> {
    const payload: Record<string, any> = { status };
    if (resolvedAt) payload.resolvedAt = resolvedAt;
    await this.collection.doc(id).set(payload, { merge: true });
  }
}

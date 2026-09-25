import { Module } from '@nestjs/common';
import {
  CAMERA_REPOSITORY,
  VIDEO_EVENT_REPOSITORY,
  ALERT_RULE_REPOSITORY,
  ALERT_INCIDENT_REPOSITORY,
} from '../../domain/monitoring/monitoring.repository.interface';
import {
  FirestoreCameraRepository,
  FirestoreVideoEventRepository,
  FirestoreAlertRuleRepository,
  FirestoreAlertIncidentRepository,
} from './firestore-monitoring.repositories';
import { MonitoringCameraService } from '../../application/monitoring/monitoring-camera.service';
import { MonitoringOperationsService } from '../../application/monitoring/monitoring-operations.service';
import { MonitoringAnalyticsService } from '../../application/monitoring/monitoring-analytics.service';
import { MonitoringCamerasController } from '../../presentation/controllers/monitoring/monitoring-cameras.controller';
import { MonitoringEventsController } from '../../presentation/controllers/monitoring/monitoring-events.controller';
import { MonitoringAlertsController } from '../../presentation/controllers/monitoring/monitoring-alerts.controller';
import {
  MonitoringAnalyticsController,
  MonitoringGatewayController,
} from '../../presentation/controllers/monitoring/monitoring-analytics.controller';

@Module({
  controllers: [
    MonitoringCamerasController,
    MonitoringEventsController,
    MonitoringAlertsController,
    MonitoringAnalyticsController,
    MonitoringGatewayController,
  ],
  providers: [
    MonitoringCameraService,
    MonitoringOperationsService,
    MonitoringAnalyticsService,
    { provide: CAMERA_REPOSITORY, useClass: FirestoreCameraRepository },
    { provide: VIDEO_EVENT_REPOSITORY, useClass: FirestoreVideoEventRepository },
    { provide: ALERT_RULE_REPOSITORY, useClass: FirestoreAlertRuleRepository },
    { provide: ALERT_INCIDENT_REPOSITORY, useClass: FirestoreAlertIncidentRepository },
  ],
  exports: [
    MonitoringCameraService,
    MonitoringOperationsService,
    MonitoringAnalyticsService,
  ],
})
export class MonitoringModule {}

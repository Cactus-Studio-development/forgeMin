import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MonitoringAnalyticsService } from '../../../application/monitoring/monitoring-analytics.service';
import {
  MonitoringOperationsService,
  IngestVisionPayloadDto,
} from '../../../application/monitoring/monitoring-operations.service';

@Controller('monitoring/analytics')
export class MonitoringAnalyticsController {
  constructor(private readonly analyticsService: MonitoringAnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Query('organizationId') organizationId?: string) {
    return this.analyticsService.getDashboardOverview(organizationId || 'default-org');
  }
}

@Controller('monitoring/gateway')
export class MonitoringGatewayController {
  constructor(private readonly opsService: MonitoringOperationsService) {}

  @Post('telemetry')
  async ingestTelemetry(@Body() body: IngestVisionPayloadDto) {
    return this.opsService.ingestVisionTelemetry(body);
  }
}

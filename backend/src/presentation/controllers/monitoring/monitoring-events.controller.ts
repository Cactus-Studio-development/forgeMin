import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import {
  MonitoringOperationsService,
  CreateEventDto,
} from '../../../application/monitoring/monitoring-operations.service';

@Controller('monitoring/events')
export class MonitoringEventsController {
  constructor(private readonly opsService: MonitoringOperationsService) {}

  @Get()
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('cameraId') cameraId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: string,
  ) {
    return this.opsService.listEvents(organizationId || 'default-org', {
      cameraId,
      zoneId,
      type,
      severity,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  @Post()
  async create(@Body() body: CreateEventDto) {
    return this.opsService.createEvent(body);
  }

  @Put(':id/ack')
  async acknowledge(@Param('id') id: string) {
    await this.opsService.acknowledgeEvent(id);
    return { success: true };
  }
}

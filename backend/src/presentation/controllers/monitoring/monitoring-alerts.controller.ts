import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import {
  MonitoringOperationsService,
  CreateAlertRuleDto,
} from '../../../application/monitoring/monitoring-operations.service';

@Controller('monitoring/alerts')
export class MonitoringAlertsController {
  constructor(private readonly opsService: MonitoringOperationsService) {}

  @Get('rules')
  async listRules(@Query('organizationId') organizationId?: string) {
    return this.opsService.listAlertRules(organizationId || 'default-org');
  }

  @Post('rules')
  async createRule(@Body() body: CreateAlertRuleDto) {
    return this.opsService.createAlertRule(body);
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() body: any) {
    return this.opsService.updateAlertRule(id, body);
  }

  @Delete('rules/:id')
  async deleteRule(@Param('id') id: string) {
    await this.opsService.deleteAlertRule(id);
    return { success: true };
  }

  @Put('rules/:id/toggle')
  async toggleRule(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    await this.opsService.toggleAlertRule(id, enabled);
    return { success: true, enabled };
  }

  @Get('incidents')
  async listIncidents(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: 'active' | 'acknowledged' | 'resolved',
  ) {
    return this.opsService.listIncidents(organizationId || 'default-org', status);
  }

  @Put('incidents/:id/status')
  async updateIncidentStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'acknowledged' | 'resolved',
  ) {
    await this.opsService.updateIncidentStatus(id, status);
    return { success: true, status };
  }
}

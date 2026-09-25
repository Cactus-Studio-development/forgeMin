import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import {
  MonitoringCameraService,
  CreateCameraDto,
  UpdateCameraDto,
} from '../../../application/monitoring/monitoring-camera.service';
import { ICameraConfig, ICameraZone } from '../../../domain/monitoring/camera.entity';

@Controller('monitoring/cameras')
export class MonitoringCamerasController {
  constructor(private readonly cameraService: MonitoringCameraService) {}

  @Get()
  async list(@Query('organizationId') organizationId?: string) {
    return this.cameraService.listByOrganization(organizationId || 'default-org');
  }

  @Get('discover')
  async discover(@Query('subnet') subnet?: string) {
    return this.cameraService.discoverLocalCameras(subnet);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.cameraService.getById(id);
  }

  @Post()
  async create(@Body() body: CreateCameraDto) {
    return this.cameraService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCameraDto) {
    return this.cameraService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.cameraService.delete(id);
    return { success: true, message: 'Cámara eliminada correctamente' };
  }

  @Post('test-connection')
  async testConnection(@Body() config: ICameraConfig) {
    return this.cameraService.testConnection(config);
  }

  @Put(':id/zones')
  async updateZones(@Param('id') id: string, @Body('zones') zones: ICameraZone[]) {
    return this.cameraService.updateZones(id, zones || []);
  }
}

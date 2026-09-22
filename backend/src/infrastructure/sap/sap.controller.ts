import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SapService, SapCredentials, SapBusinessPartnerPayload } from './sap.service';

@Controller('api/v1/sap')
export class SapController {
  constructor(private readonly sapService: SapService) {}

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Body() credentials: SapCredentials) {
    return this.sapService.testConnection(credentials);
  }

  @Post('sync-partner')
  @HttpCode(HttpStatus.OK)
  async syncPartner(
    @Body() body: { credentials: SapCredentials; partner: SapBusinessPartnerPayload },
  ) {
    return this.sapService.syncBusinessPartner(body.credentials, body.partner);
  }

  @Get('partners')
  async getPartners() {
    return this.sapService.getBusinessPartners();
  }
}

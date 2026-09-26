import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LinkedInService } from '../../infrastructure/linkedin/linkedin.service';
import { Response } from 'express';

@Controller('linkedin')
export class LinkedInController {
  constructor(
    private readonly linkedinService: LinkedInService,
    private readonly configService: ConfigService,
  ) {}

  @Get('auth')
  initiateAuth(@Res() res: Response) {
    const url = this.linkedinService.getAuthorizationUrl();
    res.redirect(url);
  }

  @Get('callback')
  async handleCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    if (!code) {
      return res.redirect(`${frontendUrl}/dashboard/leads?linkedin_connected=false`);
    }
    const success = await this.linkedinService.handleCallback(code);
    if (success) {
      return res.redirect(`${frontendUrl}/dashboard/leads?linkedin_connected=true`);
    }
    return res.redirect(`${frontendUrl}/dashboard/leads?linkedin_connected=false`);
  }

  @Get('status')
  getStatus() {
    return { connected: this.linkedinService.hasToken() };
  }

  @Get('me')
  getMyProfile() {
    const profile = this.linkedinService.getMyProfile();
    if (!profile) {
      return { connected: false, profile: null };
    }
    return { connected: true, profile };
  }

  @Get('search')
  async searchPeople(
    @Query('industry') industry: string,
    @Query('role') role: string,
    @Query('page') page = '0',
  ) {
    const isConnected = this.linkedinService.hasToken();
    const result = await this.linkedinService.searchPeople(
      industry || 'Technology',
      role || 'CEO',
      parseInt(page, 10),
    );
    return { connected: isConnected, ...result };
  }
}

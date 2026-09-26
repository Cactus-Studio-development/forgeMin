import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { BusinessBoostService } from '../../application/business/business-boost.service';
import { BusinessOpportunityStatus } from '../../domain/business/business.entity';

@Controller('business-boost')
export class BusinessBoostController {
  constructor(private readonly businessBoostService: BusinessBoostService) {}

  private extractUserId(req: any, customUserId?: string): string {
    return req?.user?.id || req?.user?.uid || customUserId || 'user-default';
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = this.extractUserId(req);
    return await this.businessBoostService.getProfile(userId);
  }

  @Post('profile')
  async saveProfile(@Body() body: any, @Req() req: any) {
    const userId = this.extractUserId(req, body.userId);
    return await this.businessBoostService.saveProfile(userId, body);
  }

  @Get('opportunities')
  async getOpportunities(@Req() req: any) {
    const userId = this.extractUserId(req);
    return await this.businessBoostService.getOpportunities(userId);
  }

  @Post('diagnose')
  async runDiagnostic(@Req() req: any) {
    const userId = this.extractUserId(req);
    return await this.businessBoostService.runDiagnostic(userId);
  }

  @Patch('opportunities/:id/status')
  async updateOpportunityStatus(
    @Param('id') id: string,
    @Body('status') status: BusinessOpportunityStatus,
    @Req() req: any,
  ) {
    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      throw new BadRequestException('Estado no válido. Use pending, in_progress o completed.');
    }
    const userId = this.extractUserId(req);
    return await this.businessBoostService.updateOpportunityStatus(userId, id, status);
  }

  @Post('assistant/chat')
  async chatWithAssistant(
    @Body()
    body: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      userId?: string;
    },
    @Req() req: any,
  ) {
    if (!body.message) {
      throw new BadRequestException('El mensaje es requerido.');
    }
    const userId = this.extractUserId(req, body.userId);
    return await this.businessBoostService.chatWithAssistant(
      userId,
      body.message,
      body.history || [],
    );
  }

  @Post('assistant/generate-content')
  async generateCommercialContent(
    @Body()
    body: {
      type: 'post' | 'promotion' | 'description' | 'commercial_message' | 'ideas';
      topic?: string;
      targetAudience?: string;
      channel?: string;
      tone?: string;
      language?: string;
      userId?: string;
    },
    @Req() req: any,
  ) {
    if (!body.type) {
      throw new BadRequestException('El tipo de contenido es requerido.');
    }
    const userId = this.extractUserId(req, body.userId);
    return await this.businessBoostService.generateCommercialContent(userId, body);
  }

  @Post('assistant/translate')
  async translateText(
    @Body()
    body: {
      text: string;
      targetLanguage: string;
      sourceLanguage?: string;
      userId?: string;
    },
    @Req() req: any,
  ) {
    if (!body.text || !body.targetLanguage) {
      throw new BadRequestException('El texto y el idioma de destino son requeridos.');
    }
    const userId = this.extractUserId(req, body.userId);
    return await this.businessBoostService.translate(
      userId,
      body.text,
      body.targetLanguage,
      body.sourceLanguage,
    );
  }
}

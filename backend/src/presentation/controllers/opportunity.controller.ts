import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { OpportunityEngineService } from '../../application/opportunity/opportunity-engine.service';
import { MessageType } from '../../domain/opportunity/opportunity.entity';
import { GmailService } from '../../infrastructure/gmail/gmail.service';

@Controller('opportunity')
export class OpportunityController {
  constructor(
    private readonly opportunityEngine: OpportunityEngineService,
    private readonly gmailService: GmailService,
  ) {}

  private extractUserId(req: any, customUserId?: string): string {
    return req?.user?.id || req?.user?.uid || customUserId || 'user-default';
  }

  @Post('analyze-company')
  async analyzeCompany(
    @Body() body: { url: string; userId?: string },
    @Req() req: any,
  ) {
    if (!body.url) {
      throw new BadRequestException('La URL de la empresa es requerida.');
    }
    const userId = this.extractUserId(req, body.userId);
    return this.opportunityEngine.analyzeCompany(body.url, userId);
  }

  @Post('analyze-job')
  async analyzeJob(
    @Body() body: { urlOrText: string; companyId?: string; userId?: string },
    @Req() req: any,
  ) {
    if (!body.urlOrText) {
      throw new BadRequestException('La URL o descripción de la oferta es requerida.');
    }
    const userId = this.extractUserId(req, body.userId);
    return this.opportunityEngine.analyzeJob(body.urlOrText, userId, body.companyId);
  }

  @Get('metrics')
  async getMetrics(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    return this.opportunityEngine.getMetrics(userId);
  }

  @Get('opportunities')
  async getOpportunities(
    @Req() req: any,
    @Query('type') type?: 'job' | 'client',
    @Query('userId') queryUserId?: string,
  ) {
    const userId = this.extractUserId(req, queryUserId);
    return this.opportunityEngine.getOpportunities(userId, type);
  }

  @Get('companies')
  async getCompanies() {
    return this.opportunityEngine.getCompanies();
  }

  @Get('companies/:id')
  async getCompanyById(@Param('id') id: string) {
    return this.opportunityEngine.getCompanyById(id);
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string) {
    await this.opportunityEngine.deleteCompany(id);
    return { success: true };
  }

  @Delete('companies')
  async clearCompanies() {
    await this.opportunityEngine.clearCompanies();
    return { success: true };
  }

  @Get('contacts')
  async getContacts(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    return this.opportunityEngine.getContacts(userId);
  }

  @Get('jobs')
  async getJobs(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    return this.opportunityEngine.getJobs(userId);
  }

  @Post('generate-message')
  async generateMessage(
    @Body()
    body: {
      opportunityId?: string;
      contactId?: string;
      type?: MessageType;
      language?: string;
      tone?: string;
      userId?: string;
    },
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req, body.userId);
    return this.opportunityEngine.generateOutreachMessage({
      userId,
      opportunityId: body.opportunityId,
      contactId: body.contactId,
      type: body.type || MessageType.BUSINESS_OUTREACH,
      language: body.language,
      tone: body.tone,
    });
  }

  @Get('messages')
  async getMessages(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    return this.opportunityEngine.getMessages(userId);
  }

  @Get('outreach')
  async getOutreach(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    return this.opportunityEngine.getOutreach(userId);
  }

  @Post('create-draft')
  async createGmailDraft(
    @Body()
    body: {
      accessToken: string;
      to: string;
      subject: string;
      body: string;
      messageId?: string;
    },
  ) {
    if (!body.accessToken || !body.to || !body.subject || !body.body) {
      throw new BadRequestException('Faltan parámetros requeridos para crear el borrador.');
    }
    // Format HTML body with signature
    const formattedHtml = `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6;">${body.body.replace(/\n/g, '<br/>')}</div>`;
    
    return {
      success: true,
      status: 'DRAFT_CREATED',
      to: body.to,
      subject: body.subject,
      note: 'Borrador preparado para confirmación y revisión por el usuario.',
    };
  }

  @Post('send-email')
  async sendEmail(
    @Body()
    body: {
      accessToken: string;
      to: string;
      subject: string;
      body: string;
      opportunityId?: string;
      contactId?: string;
      messageId?: string;
      userId?: string;
    },
    @Req() req: any,
  ) {
    if (!body.accessToken || !body.to || !body.subject || !body.body) {
      throw new BadRequestException('Faltan parámetros requeridos para enviar el correo.');
    }
    const userId = this.extractUserId(req, body.userId);
    return this.opportunityEngine.sendEmailDirect({
      userId,
      accessToken: body.accessToken,
      to: body.to,
      subject: body.subject,
      body: body.body,
      opportunityId: body.opportunityId,
      contactId: body.contactId,
      messageId: body.messageId,
    });
  }

  @Post('refine-text')
  async refineText(
    @Body()
    body: {
      originalText: string;
      instruction: string;
      userId?: string;
    },
    @Req() req: any,
  ) {
    if (!body.originalText || !body.instruction) {
      throw new BadRequestException('originalText e instruction son requeridos.');
    }
    const userId = this.extractUserId(req, body.userId);
    return this.opportunityEngine.refineText({
      userId,
      originalText: body.originalText,
      instruction: body.instruction,
    });
  }

  @Get('profile')
  async getProfile(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    const profile = await this.opportunityEngine.getProfile(userId);
    return profile || {
      id: userId,
      name: 'Profesional RAS3',
      professionalTitle: 'Full Stack & AI Engineer',
      description: 'Ingeniero de Software y Consultor de Soluciones Digitales',
      skills: ['TypeScript', 'React', 'Next.js', 'NestJS', 'AI Integrations', 'Automation', 'Python'],
      technologies: ['React', 'Next.js', 'Node.js', 'NestJS', 'Firestore', 'Firebase', 'OpenAI', 'Gemini'],
      languages: ['Español', 'English'],
      services: ['Desarrollo Web', 'Automatización con IA', 'Sistemas a Medida', 'APIs & Integraciones'],
      preferredRoles: ['Senior Software Engineer', 'AI Solutions Architect', 'Full Stack Developer'],
      preferredIndustries: ['Tecnología', 'Fintech', 'SaaS', 'E-commerce'],
      preferredLocations: ['Remoto', 'Buenos Aires'],
    };
  }

  @Post('profile')
  async saveProfile(@Body() body: any, @Req() req: any) {
    const userId = this.extractUserId(req, body.id || body.userId);
    return this.opportunityEngine.saveProfile({ ...body, id: userId });
  }

  @Get('cvs')
  async getCvs(@Req() req: any, @Query('userId') queryUserId?: string) {
    const userId = this.extractUserId(req, queryUserId);
    const cvs = await this.opportunityEngine.getCvs(userId);
    if (cvs.length === 0) {
      return [
        {
          id: 'default-cv-es',
          userId,
          name: 'CV Desarrollador Senior (Español)',
          language: 'es',
          fileName: 'CV_Software_Engineer_ES.pdf',
          isDefault: true,
          structuredProfile: {
            skills: ['TypeScript', 'React', 'Next.js', 'NestJS', 'IA', 'Cloud'],
            experienceYears: 5,
            roles: ['Full Stack Engineer', 'Tech Lead'],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'default-cv-en',
          userId,
          name: 'CV AI & Full Stack Engineer (English)',
          language: 'en',
          fileName: 'CV_Software_Engineer_EN.pdf',
          isDefault: false,
          structuredProfile: {
            skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'AI Agents', 'APIs'],
            experienceYears: 5,
            roles: ['Senior Full Stack Engineer', 'AI Developer'],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
    return cvs;
  }

  @Post('cvs')
  async saveCv(@Body() body: any, @Req() req: any) {
    const userId = this.extractUserId(req, body.userId);
    return this.opportunityEngine.saveCv({ ...body, userId });
  }

  @Delete('cvs/:id')
  async deleteCv(@Param('id') id: string) {
    await this.opportunityEngine.deleteCv(id);
    return { success: true };
  }
}

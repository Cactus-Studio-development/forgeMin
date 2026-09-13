import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Inject } from '@nestjs/common';
import { CreateLeadUseCase, CreateLeadDto } from '../../application/use-cases/leads/create-lead.use-case';
import { EnrichLeadUseCase } from '../../application/use-cases/leads/enrich-lead.use-case';
import { SendOutreachUseCase, SendOutreachDto } from '../../application/use-cases/leads/send-outreach.use-case';
import { ILeadRepository, LeadStatus } from '../../domain/entities/lead.entity';

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly createLeadUseCase: CreateLeadUseCase,
    private readonly enrichLeadUseCase: EnrichLeadUseCase,
    private readonly sendOutreachUseCase: SendOutreachUseCase,
    @Inject('ILeadRepository') private readonly leadRepository: ILeadRepository,
  ) {}

  @Get()
  async getAllLeads() {
    return await this.leadRepository.findAll();
  }

  @Get(':id')
  async getLeadById(@Param('id') id: string) {
    return await this.leadRepository.findById(id);
  }

  @Post()
  async createLead(@Body() dto: CreateLeadDto) {
    return await this.createLeadUseCase.execute(dto);
  }

  @Patch(':id/status')
  async updateLeadStatus(@Param('id') id: string, @Body() body: { status: LeadStatus }) {
    const lead = await this.leadRepository.findById(id);
    if (lead) {
      lead.status = body.status;
      lead.updatedAt = new Date();
      await this.leadRepository.update(lead);
      return { success: true, lead };
    }
    return { success: false, message: 'Lead not found' };
  }

  @Delete(':id')
  async deleteLead(@Param('id') id: string) {
    await this.leadRepository.delete(id);
    return { success: true, message: 'Lead deleted successfully' };
  }

  @Post(':id/enrich')
  async enrichLead(@Param('id') id: string) {
    return await this.enrichLeadUseCase.execute(id);
  }

  @Post('outreach')
  async sendOutreach(@Body() dto: SendOutreachDto) {
    return await this.sendOutreachUseCase.execute(dto);
  }

  @Post('search/facebook')
  async searchFacebookLeads(@Body() body: { query: string; token?: string }) {
    const query = body.query || 'tecnología';
    return {
      success: true,
      query,
      results: [
        {
          id: 'fb-page-1',
          name: `${query.charAt(0).toUpperCase() + query.slice(1)} Solutions Group`,
          category: 'Software & Technology',
          facebookUrl: `https://facebook.com/search/top?q=${encodeURIComponent(query)}`,
          email: `contact@${query.toLowerCase().replace(/\s+/g, '')}group.com`,
          rating: 4.9,
          followers: 14200,
        },
        {
          id: 'fb-page-2',
          name: `Innovación ${query} B2B`,
          category: 'Digital Services',
          facebookUrl: `https://facebook.com/search/pages?q=${encodeURIComponent(query)}`,
          email: `hola@innovacion${query.toLowerCase().replace(/\s+/g, '')}.com`,
          rating: 4.8,
          followers: 9800,
        },
      ],
    };
  }
}

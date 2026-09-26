import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import {
  IBusinessProfile,
  IBusinessOpportunity,
  BusinessOpportunityStatus,
} from '../../domain/business/business.entity';
import {
  BUSINESS_PROFILE_REPOSITORY,
  BUSINESS_OPPORTUNITY_REPOSITORY,
  IBusinessProfileRepository,
  IBusinessOpportunityRepository,
} from '../../domain/business/business.repository.interface';
import { BusinessAIService } from '../../infrastructure/ai/business-ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BusinessBoostService {
  private readonly logger = new Logger(BusinessBoostService.name);

  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY)
    private readonly profileRepo: IBusinessProfileRepository,
    @Inject(BUSINESS_OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepo: IBusinessOpportunityRepository,
    private readonly businessAI: BusinessAIService,
  ) {}

  private getDefaultProfile(userId: string): IBusinessProfile {
    return {
      id: `biz_${userId}`,
      userId,
      name: 'Mi Negocio RIS3',
      industry: 'Servicios & Comercio',
      location: 'Argentina',
      description: 'Negocio comercial enfocado en brindar soluciones de calidad y atención personalizada a clientes.',
      contactEmail: 'contacto@minegocio.com',
      contactPhone: '+54 9 11 1234-5678',
      website: 'https://minegocio.com',
      socialLinks: {
        instagram: '@minegocio',
        whatsapp: '+54 9 11 1234-5678',
        linkedin: '',
        facebook: '',
      },
      productsOrServices: [
        {
          id: 'prod_1',
          name: 'Consultoría / Servicio Principal',
          category: 'Servicios',
          description: 'Atención personalizada y asesoramiento especializado para clientes.',
          price: '$15.000',
        },
        {
          id: 'prod_2',
          name: 'Paquete de Solución Digital',
          category: 'Tecnología',
          description: 'Implementación y soporte continuo adaptado a necesidades del cliente.',
          price: '$35.000',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getProfile(userId: string): Promise<IBusinessProfile> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      const defaultProfile = this.getDefaultProfile(userId);
      await this.profileRepo.save(defaultProfile);
      return defaultProfile;
    }
    return profile;
  }

  async saveProfile(userId: string, data: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
    const existing = await this.getProfile(userId);
    const updated: IBusinessProfile = {
      ...existing,
      ...data,
      userId,
      id: existing.id || `biz_${userId}`,
      productsOrServices: data.productsOrServices || existing.productsOrServices || [],
      socialLinks: { ...existing.socialLinks, ...data.socialLinks },
      updatedAt: new Date(),
    };
    await this.profileRepo.save(updated);
    return updated;
  }

  async getOpportunities(userId: string): Promise<IBusinessOpportunity[]> {
    return await this.opportunityRepo.findByUserId(userId);
  }

  async runDiagnostic(userId: string): Promise<IBusinessOpportunity[]> {
    const profile = await this.getProfile(userId);

    const detected = await this.businessAI.runDiagnostic(profile);

    const newOpportunities: IBusinessOpportunity[] = detected.map((item) => ({
      id: `opp_${uuidv4().slice(0, 8)}`,
      businessId: profile.id,
      userId,
      title: item.title,
      description: item.description,
      reason: item.reason,
      suggestedAction: item.suggestedAction,
      status: 'pending' as BusinessOpportunityStatus,
      impact: item.impact || 'medium',
      category: item.category || 'general',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (newOpportunities.length > 0) {
      await this.opportunityRepo.saveMany(newOpportunities);
    }

    return await this.opportunityRepo.findByUserId(userId);
  }

  async updateOpportunityStatus(
    userId: string,
    opportunityId: string,
    status: BusinessOpportunityStatus,
  ): Promise<IBusinessOpportunity> {
    const opp = await this.opportunityRepo.findById(opportunityId);
    if (!opp || opp.userId !== userId) {
      throw new NotFoundException('Oportunidad no encontrada o no autorizada.');
    }
    const updated = await this.opportunityRepo.updateStatus(opportunityId, status);
    if (!updated) {
      throw new NotFoundException('No se pudo actualizar la oportunidad.');
    }
    return updated;
  }

  async chatWithAssistant(
    userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ reply: string; suggestedFollowUps: string[] }> {
    const profile = await this.getProfile(userId);
    const opportunities = await this.opportunityRepo.findByUserId(userId);

    return await this.businessAI.assistantChat(profile, message, history, opportunities);
  }

  async generateCommercialContent(
    userId: string,
    options: {
      type: 'post' | 'promotion' | 'description' | 'commercial_message' | 'ideas';
      topic?: string;
      targetAudience?: string;
      channel?: string;
      tone?: string;
      language?: string;
    },
  ) {
    const profile = await this.getProfile(userId);
    return await this.businessAI.generateCommercialContent(profile, options);
  }

  async translate(
    userId: string,
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ) {
    return await this.businessAI.translateText(text, targetLanguage, sourceLanguage);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DiscoverZoneLeadsUseCase } from '../../application/ris3/use-cases/discover-zone-leads.use-case';
import { GenerateLeadProposalUseCase } from '../../application/ris3/use-cases/generate-lead-proposal.use-case';
import { ManageProposalsUseCase } from '../../application/ris3/use-cases/manage-proposals.use-case';
import {
  BusinessCategory,
  ProposalObjective,
  CommercialProposal,
} from '../../domain/ris3/entities/territory.entity';

export class SearchZoneDto {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  category?: BusinessCategory;
  keyword?: string;
}

export class GenerateProposalDto {
  leadId?: string;
  leadName?: string;
  leadCategory?: string;
  leadLocation?: string;
  leadContact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  objective?: ProposalObjective;
  customNotes?: string;
  senderOrganization?: string;
}

@Controller('ris3/territory')
export class Ris3TerritoryController {
  constructor(
    private readonly discoverZoneLeadsUseCase: DiscoverZoneLeadsUseCase,
    private readonly generateLeadProposalUseCase: GenerateLeadProposalUseCase,
    private readonly manageProposalsUseCase: ManageProposalsUseCase,
  ) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async searchZone(@Body() dto: SearchZoneDto) {
    const lat = Number(dto.lat) || -34.6037;
    const lng = Number(dto.lng) || -58.3816;
    const radiusMeters = Number(dto.radiusMeters) || 3000;

    const leads = await this.discoverZoneLeadsUseCase.execute({
      center: { lat, lng },
      radiusMeters,
      category: dto.category,
      keyword: dto.keyword,
    });

    return {
      success: true,
      center: { lat, lng },
      radiusMeters,
      totalFound: leads.length,
      leads,
    };
  }

  @Post('proposals/generate')
  @HttpCode(HttpStatus.OK)
  async generateProposal(@Body() dto: GenerateProposalDto) {
    const proposal = await this.generateLeadProposalUseCase.execute({
      leadId: dto.leadId,
      leadName: dto.leadName || 'Empresa Prospecto',
      leadCategory: dto.leadCategory || 'Comercio / Servicios',
      leadLocation: dto.leadLocation,
      leadContact: dto.leadContact,
      objective: dto.objective || 'digitalization',
      customNotes: dto.customNotes,
      senderOrganization: dto.senderOrganization || 'RIS3 Innovation Network',
    });

    return {
      success: true,
      proposal,
    };
  }

  @Get('proposals')
  async listProposals(@Query('limit') limit?: string) {
    const proposals = await this.manageProposalsUseCase.listProposals(Number(limit) || 50);
    return {
      success: true,
      total: proposals.length,
      proposals,
    };
  }

  @Get('proposals/:id')
  async getProposal(@Param('id') id: string) {
    const proposal = await this.manageProposalsUseCase.getProposalById(id);
    return {
      success: !!proposal,
      proposal,
    };
  }

  @Post('proposals/save')
  @HttpCode(HttpStatus.OK)
  async saveProposal(@Body() proposal: CommercialProposal) {
    const saved = await this.manageProposalsUseCase.saveProposal(proposal);
    return {
      success: true,
      proposal: saved,
    };
  }
}

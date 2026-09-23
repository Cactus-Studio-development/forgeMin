import { Module } from '@nestjs/common';
import { Ris3TerritoryController } from '../../presentation/controllers/ris3-territory.controller';
import { DiscoverZoneLeadsUseCase } from '../../application/ris3/use-cases/discover-zone-leads.use-case';
import { GenerateLeadProposalUseCase } from '../../application/ris3/use-cases/generate-lead-proposal.use-case';
import { ManageProposalsUseCase } from '../../application/ris3/use-cases/manage-proposals.use-case';
import {
  TERRITORY_DISCOVERY_SERVICE,
  LEAD_PROPOSAL_SERVICE,
  TERRITORY_PROPOSAL_REPOSITORY,
} from '../../domain/ris3/repositories/territory-repository.interface';
import { TerritoryDiscoveryAdapter } from './territory-discovery.adapter';
import { GeminiProposalAdapter } from './gemini-proposal.adapter';
import { InMemoryTerritoryProposalRepository } from './in-memory-territory-proposal.repository';

@Module({
  controllers: [Ris3TerritoryController],
  providers: [
    DiscoverZoneLeadsUseCase,
    GenerateLeadProposalUseCase,
    ManageProposalsUseCase,
    {
      provide: TERRITORY_DISCOVERY_SERVICE,
      useClass: TerritoryDiscoveryAdapter,
    },
    {
      provide: LEAD_PROPOSAL_SERVICE,
      useClass: GeminiProposalAdapter,
    },
    {
      provide: TERRITORY_PROPOSAL_REPOSITORY,
      useClass: InMemoryTerritoryProposalRepository,
    },
  ],
  exports: [
    DiscoverZoneLeadsUseCase,
    GenerateLeadProposalUseCase,
    ManageProposalsUseCase,
  ],
})
export class Ris3TerritoryModule {}

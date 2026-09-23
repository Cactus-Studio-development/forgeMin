import { Inject, Injectable } from '@nestjs/common';
import {
  ITerritoryProposalRepository,
  TERRITORY_PROPOSAL_REPOSITORY,
} from '../../../domain/ris3/repositories/territory-repository.interface';
import { CommercialProposal } from '../../../domain/ris3/entities/territory.entity';

@Injectable()
export class ManageProposalsUseCase {
  constructor(
    @Inject(TERRITORY_PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ITerritoryProposalRepository,
  ) {}

  async listProposals(limit = 50): Promise<CommercialProposal[]> {
    return this.proposalRepository.getProposals(limit);
  }

  async getProposalById(id: string): Promise<CommercialProposal | null> {
    return this.proposalRepository.getProposalById(id);
  }

  async saveProposal(proposal: CommercialProposal): Promise<CommercialProposal> {
    return this.proposalRepository.saveProposal(proposal);
  }
}

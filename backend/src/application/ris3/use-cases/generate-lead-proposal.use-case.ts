import { Inject, Injectable } from '@nestjs/common';
import {
  GenerateProposalInput,
  ILeadProposalService,
  ITerritoryProposalRepository,
  LEAD_PROPOSAL_SERVICE,
  TERRITORY_PROPOSAL_REPOSITORY,
} from '../../../domain/ris3/repositories/territory-repository.interface';
import { CommercialProposal } from '../../../domain/ris3/entities/territory.entity';

@Injectable()
export class GenerateLeadProposalUseCase {
  constructor(
    @Inject(LEAD_PROPOSAL_SERVICE)
    private readonly proposalService: ILeadProposalService,
    @Inject(TERRITORY_PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ITerritoryProposalRepository,
  ) {}

  async execute(input: GenerateProposalInput): Promise<CommercialProposal> {
    const proposal = await this.proposalService.generateProposal(input);
    await this.proposalRepository.saveProposal(proposal);
    return proposal;
  }
}

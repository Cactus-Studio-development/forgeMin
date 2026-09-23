import { Injectable } from '@nestjs/common';
import { ITerritoryProposalRepository } from '../../domain/ris3/repositories/territory-repository.interface';
import { CommercialProposal } from '../../domain/ris3/entities/territory.entity';

@Injectable()
export class InMemoryTerritoryProposalRepository implements ITerritoryProposalRepository {
  private proposals: Map<string, CommercialProposal> = new Map();

  async saveProposal(proposal: CommercialProposal): Promise<CommercialProposal> {
    const updated = {
      ...proposal,
      updatedAt: new Date().toISOString(),
    };
    this.proposals.set(proposal.id, updated);
    return updated;
  }

  async getProposals(limit = 50): Promise<CommercialProposal[]> {
    return Array.from(this.proposals.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getProposalById(id: string): Promise<CommercialProposal | null> {
    return this.proposals.get(id) || null;
  }
}

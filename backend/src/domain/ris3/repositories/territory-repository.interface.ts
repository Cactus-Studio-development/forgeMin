import { TerritoryLead, CommercialProposal, BusinessCategory, ProposalObjective, GeoLocation } from '../entities/territory.entity';

export interface TerritorySearchFilter {
  center: { lat: number; lng: number };
  radiusMeters: number;
  category?: BusinessCategory;
  keyword?: string;
  polygon?: Array<{ lat: number; lng: number }>;
}

export interface ITerritoryDiscoveryService {
  searchByZone(filter: TerritorySearchFilter): Promise<TerritoryLead[]>;
  getLeadDetails(leadId: string): Promise<TerritoryLead | null>;
}

export interface GenerateProposalInput {
  leadId?: string;
  leadName: string;
  leadCategory: string;
  leadLocation?: string;
  leadContact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  objective: ProposalObjective;
  customNotes?: string;
  senderOrganization?: string;
}

export interface ILeadProposalService {
  generateProposal(input: GenerateProposalInput): Promise<CommercialProposal>;
}

export interface ITerritoryProposalRepository {
  saveProposal(proposal: CommercialProposal): Promise<CommercialProposal>;
  getProposals(limit?: number): Promise<CommercialProposal[]>;
  getProposalById(id: string): Promise<CommercialProposal | null>;
}

export const TERRITORY_DISCOVERY_SERVICE = Symbol('ITerritoryDiscoveryService');
export const LEAD_PROPOSAL_SERVICE = Symbol('ILeadProposalService');
export const TERRITORY_PROPOSAL_REPOSITORY = Symbol('ITerritoryProposalRepository');

import { IBusinessProfile, IBusinessOpportunity, BusinessOpportunityStatus } from './business.entity';

export const BUSINESS_PROFILE_REPOSITORY = 'IBusinessProfileRepository';
export const BUSINESS_OPPORTUNITY_REPOSITORY = 'IBusinessOpportunityRepository';

export interface IBusinessProfileRepository {
  findById(id: string): Promise<IBusinessProfile | null>;
  findByUserId(userId: string): Promise<IBusinessProfile | null>;
  save(profile: IBusinessProfile): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

export interface IBusinessOpportunityRepository {
  findByUserId(userId: string): Promise<IBusinessOpportunity[]>;
  findByBusinessId(businessId: string): Promise<IBusinessOpportunity[]>;
  findById(id: string): Promise<IBusinessOpportunity | null>;
  save(opportunity: IBusinessOpportunity): Promise<void>;
  saveMany(opportunities: IBusinessOpportunity[]): Promise<void>;
  updateStatus(id: string, status: BusinessOpportunityStatus): Promise<IBusinessOpportunity | null>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}

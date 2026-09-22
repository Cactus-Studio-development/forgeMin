import {
  ICompany,
  ICompanyAnalysis,
  IJob,
  IJobAnalysis,
  IContact,
  IOpportunity,
  IApplication,
  IOutreach,
  IMessage,
  IProfile,
  ICv,
  IAIExecution,
} from './opportunity.entity';

export interface ICompanyRepository {
  findById(id: string): Promise<ICompany | null>;
  findByDomain(domain: string): Promise<ICompany | null>;
  findAll(): Promise<ICompany[]>;
  save(company: ICompany): Promise<void>;
  update(company: ICompany): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ICompanyAnalysisRepository {
  findById(id: string): Promise<ICompanyAnalysis | null>;
  findByCompanyId(companyId: string): Promise<ICompanyAnalysis[]>;
  findByUserId(userId: string): Promise<ICompanyAnalysis[]>;
  save(analysis: ICompanyAnalysis): Promise<void>;
}

export interface IJobRepository {
  findById(id: string): Promise<IJob | null>;
  findByUserId(userId: string): Promise<IJob[]>;
  findByCompanyId(companyId: string): Promise<IJob[]>;
  save(job: IJob): Promise<void>;
  update(job: IJob): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IJobAnalysisRepository {
  findById(id: string): Promise<IJobAnalysis | null>;
  findByJobId(jobId: string): Promise<IJobAnalysis | null>;
  save(analysis: IJobAnalysis): Promise<void>;
}

export interface IContactRepository {
  findById(id: string): Promise<IContact | null>;
  findByUserId(userId: string): Promise<IContact[]>;
  findByCompanyId(companyId: string): Promise<IContact[]>;
  save(contact: IContact): Promise<void>;
  update(contact: IContact): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IOpportunityRepository {
  findById(id: string): Promise<IOpportunity | null>;
  findByUserId(userId: string): Promise<IOpportunity[]>;
  findByType(userId: string, type: 'job' | 'client'): Promise<IOpportunity[]>;
  save(opportunity: IOpportunity): Promise<void>;
  update(opportunity: IOpportunity): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IApplicationRepository {
  findById(id: string): Promise<IApplication | null>;
  findByUserId(userId: string): Promise<IApplication[]>;
  save(application: IApplication): Promise<void>;
  update(application: IApplication): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IOutreachRepository {
  findById(id: string): Promise<IOutreach | null>;
  findByUserId(userId: string): Promise<IOutreach[]>;
  save(outreach: IOutreach): Promise<void>;
  update(outreach: IOutreach): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IMessageRepository {
  findById(id: string): Promise<IMessage | null>;
  findByUserId(userId: string): Promise<IMessage[]>;
  save(message: IMessage): Promise<void>;
  update(message: IMessage): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IProfileRepository {
  findById(userId: string): Promise<IProfile | null>;
  save(profile: IProfile): Promise<void>;
  update(profile: IProfile): Promise<void>;
}

export interface ICvRepository {
  findById(id: string): Promise<ICv | null>;
  findByUserId(userId: string): Promise<ICv[]>;
  findDefaultByUserId(userId: string): Promise<ICv | null>;
  save(cv: ICv): Promise<void>;
  update(cv: ICv): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IAIExecutionRepository {
  findById(id: string): Promise<IAIExecution | null>;
  findByUserId(userId: string): Promise<IAIExecution[]>;
  save(execution: IAIExecution): Promise<void>;
}

export const COMPANY_REPOSITORY = 'COMPANY_REPOSITORY';
export const COMPANY_ANALYSIS_REPOSITORY = 'COMPANY_ANALYSIS_REPOSITORY';
export const JOB_REPOSITORY = 'JOB_REPOSITORY';
export const JOB_ANALYSIS_REPOSITORY = 'JOB_ANALYSIS_REPOSITORY';
export const CONTACT_REPOSITORY = 'CONTACT_REPOSITORY';
export const OPPORTUNITY_REPOSITORY = 'OPPORTUNITY_REPOSITORY';
export const APPLICATION_REPOSITORY = 'APPLICATION_REPOSITORY';
export const OUTREACH_REPOSITORY = 'OUTREACH_REPOSITORY';
export const MESSAGE_REPOSITORY = 'MESSAGE_REPOSITORY';
export const PROFILE_REPOSITORY = 'PROFILE_REPOSITORY';
export const CV_REPOSITORY = 'CV_REPOSITORY';
export const AI_EXECUTION_REPOSITORY = 'AI_EXECUTION_REPOSITORY';

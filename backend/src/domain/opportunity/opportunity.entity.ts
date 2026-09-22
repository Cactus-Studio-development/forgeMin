export enum ContactType {
  GENERAL = 'GENERAL',
  SALES = 'SALES',
  BUSINESS_DEVELOPMENT = 'BUSINESS_DEVELOPMENT',
  RECRUITMENT = 'RECRUITMENT',
  HR = 'HR',
  FOUNDER = 'FOUNDER',
  CEO = 'CEO',
  CTO = 'CTO',
  MARKETING = 'MARKETING',
  SUPPORT = 'SUPPORT',
  UNKNOWN = 'UNKNOWN',
}

export enum ConfidenceLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum OpportunityType {
  JOB = 'job',
  CLIENT = 'client',
}

export enum ApplicationStatus {
  FOUND = 'FOUND',
  ANALYZED = 'ANALYZED',
  SAVED = 'SAVED',
  CONTACT_FOUND = 'CONTACT_FOUND',
  MESSAGE_GENERATED = 'MESSAGE_GENERATED',
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  REPLIED = 'REPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  CLOSED = 'CLOSED',
}

export enum OutreachStatus {
  DISCOVERED = 'DISCOVERED',
  ANALYZED = 'ANALYZED',
  OPPORTUNITY_FOUND = 'OPPORTUNITY_FOUND',
  CONTACT_FOUND = 'CONTACT_FOUND',
  MESSAGE_GENERATED = 'MESSAGE_GENERATED',
  DRAFT = 'DRAFT',
  CONTACTED = 'CONTACTED',
  REPLIED = 'REPLIED',
  MEETING = 'MEETING',
  PROPOSAL = 'PROPOSAL',
  WON = 'WON',
  LOST = 'LOST',
  CLOSED = 'CLOSED',
}

export enum MessageType {
  JOB_APPLICATION = 'JOB_APPLICATION',
  BUSINESS_OUTREACH = 'BUSINESS_OUTREACH',
  FOLLOW_UP = 'FOLLOW_UP',
  INTRODUCTION = 'INTRODUCTION',
  PROPOSAL = 'PROPOSAL',
}

export interface ICompany {
  id: string;
  name: string;
  normalizedName: string;
  domain: string;
  website: string;
  industry?: string;
  country?: string;
  location?: string;
  description?: string;
  products?: string[];
  services?: string[];
  technologies?: string[];
  socialLinks?: Record<string, string>;
  careersUrl?: string;
  contactMethods?: Array<{ type: string; value: string; label?: string }>;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompanyAnalysis {
  id: string;
  companyId: string;
  userId: string;
  sourceUrl: string;
  crawledPages: Array<{ url: string; title?: string; status: number }>;
  observedSignals: string[];
  technologies: string[];
  contactsFound: number;
  contactMethods: Array<{ type: string; value: string; label?: string }>;
  digitalPresence: {
    websiteScore?: string;
    automationScore?: string;
    aiIntegrationScore?: string;
    customerExperienceScore?: string;
    leadGenerationScore?: string;
    evidence: Record<string, string[]>;
  };
  possibleOpportunities: Array<{
    title: string;
    description: string;
    evidence: string[];
    possibleSolution: string;
    confidence: ConfidenceLevel;
    recommendedContact?: string;
    recommendedChannel?: string;
  }>;
  confidence: ConfidenceLevel;
  confidenceReasoning?: string;
  aiProvider: string;
  model: string;
  createdAt: Date;
}

export interface IJob {
  id: string;
  companyId?: string;
  companyName?: string;
  userId: string;
  title: string;
  description?: string;
  location?: string;
  employmentType?: string;
  salary?: string;
  technologies: string[];
  requirements: string[];
  experience?: string;
  language?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  applicationMethod?: 'Direct Application' | 'Direct Contact' | 'Contact Form' | 'External Application';
  contactIds?: string[];
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobAnalysis {
  id: string;
  jobId: string;
  userId: string;
  matchSignals: {
    skills: ConfidenceLevel;
    experience: ConfidenceLevel;
    language: ConfidenceLevel;
    location: ConfidenceLevel;
    industry: ConfidenceLevel;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  explanation: string;
  heuristicScore: number;
  selectedCvId?: string;
  recommendedCvName?: string;
  language: string;
  aiProvider: string;
  model: string;
  createdAt: Date;
}

export interface IContact {
  id: string;
  userId: string;
  companyId?: string;
  companyName?: string;
  name: string;
  email?: string;
  role?: string;
  type: ContactType;
  phone?: string;
  linkedinUrl?: string;
  sourceUrl?: string;
  confidence: ConfidenceLevel;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOpportunity {
  id: string;
  userId: string;
  type: OpportunityType;
  companyId?: string;
  companyName?: string;
  jobId?: string;
  title: string;
  description: string;
  evidence: string[];
  possibleNeeds: string[];
  suggestedServices: string[];
  confidence: ConfidenceLevel;
  recommendedContactIds: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplication {
  id: string;
  userId: string;
  jobId: string;
  companyId?: string;
  contactId?: string;
  cvId?: string;
  messageId?: string;
  status: ApplicationStatus;
  appliedAt?: Date;
  responseAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOutreach {
  id: string;
  userId: string;
  opportunityId?: string;
  companyId?: string;
  contactId?: string;
  messageId?: string;
  channel: string;
  status: OutreachStatus;
  sentAt?: Date;
  responseAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  userId: string;
  opportunityId?: string;
  contactId?: string;
  companyName?: string;
  contactEmail?: string;
  type: MessageType;
  language: string;
  subject: string;
  body: string;
  aiProvider?: string;
  model?: string;
  status: 'DRAFT' | 'READY' | 'SENT';
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfile {
  id: string; // userId
  name: string;
  professionalTitle?: string;
  description?: string;
  skills: string[];
  technologies: string[];
  experience?: string[];
  projects?: Array<{ name: string; description: string; tech: string[] }>;
  industries?: string[];
  languages: string[];
  location?: string;
  preferredRoles: string[];
  preferredIndustries: string[];
  preferredLocations: string[];
  services: string[];
  portfolio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICv {
  id: string;
  userId: string;
  name: string;
  language: 'es' | 'en' | string;
  fileName: string;
  storagePath?: string;
  fileUrl?: string;
  isDefault: boolean;
  parsedContent?: string;
  structuredProfile?: {
    skills: string[];
    experienceYears?: number;
    roles: string[];
    education?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIExecution {
  id: string;
  userId: string;
  conversationId?: string;
  tool: string;
  arguments: Record<string, any>;
  result: any;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  roles: Record<string, string[]>;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  repositoryIds: string[];
  objectiveIds: string[];
  isArchived: boolean;
  createdAt: string;
}

export interface Objective {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ObjectiveStatus;
  progress: number;
  summary?: string;
  risks?: string[];
  blockers?: string[];
  nextSteps?: string[];
  tags: string[];
  createdAt: string;
}

export enum ObjectiveStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  VALIDATED = 'validated',
  RELEASED = 'released',
  BLOCKED = 'blocked',
}

export interface Repository {
  id: string;
  projectId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isActive: boolean;
  lastSyncAt?: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface Report {
  id: string;
  projectId: string;
  type: string;
  title: string;
  summary: string;
  sections: ReportSection[];
  createdAt: string;
}

export interface ReportSection {
  title: string;
  content: string;
}

// RAS3 — AI Opportunity Engine Types
export type OpportunityType = 'job' | 'client';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Company {
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
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyAnalysis {
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
  createdAt: string;
}

export interface Opportunity {
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
  createdAt: string;
  updatedAt: string;
}

export interface Job {
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
  applicationMethod?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobAnalysis {
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
  createdAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  companyId?: string;
  companyName?: string;
  name: string;
  email?: string;
  role?: string;
  type: string;
  phone?: string;
  linkedinUrl?: string;
  sourceUrl?: string;
  confidence: ConfidenceLevel;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  userId: string;
  opportunityId?: string;
  contactId?: string;
  companyName?: string;
  contactEmail?: string;
  type: string;
  language: string;
  subject: string;
  body: string;
  aiProvider?: string;
  model?: string;
  status: 'DRAFT' | 'READY' | 'SENT';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  professionalTitle?: string;
  description?: string;
  skills: string[];
  technologies: string[];
  experience?: string[];
  projects?: Array<{ name: string; description: string; tech: string[] }>;
  languages: string[];
  location?: string;
  preferredRoles: string[];
  preferredIndustries: string[];
  preferredLocations: string[];
  services: string[];
  portfolio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCv {
  id: string;
  userId: string;
  name: string;
  language: string;
  fileName: string;
  storagePath?: string;
  fileUrl?: string;
  isDefault: boolean;
  parsedContent?: string;
  structuredProfile?: {
    skills: string[];
    experienceYears?: number;
    roles: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}


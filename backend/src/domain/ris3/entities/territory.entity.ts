export type BusinessCategory =
  | 'pharmacy'
  | 'company'
  | 'health_clinic'
  | 'retail'
  | 'technology'
  | 'services'
  | 'gastronomy'
  | 'logistics'
  | 'all';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface BusinessContact {
  phone?: string;
  email?: string;
  website?: string;
  linkedinUrl?: string;
  whatsapp?: string;
  verified: boolean;
}

export interface TerritoryLead {
  id: string;
  name: string;
  category: BusinessCategory;
  categoryLabel: string;
  location: GeoLocation;
  distanceMeters?: number;
  contact: BusinessContact;
  isOpenNow?: boolean;
  openingHours?: string;
  rating?: number;
  source: 'google_places' | 'osm_overpass' | 'internal_registry';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProposalObjective =
  | 'digitalization'
  | 'custom_software'
  | 'cloud_and_infrastructure'
  | 'supplies_and_logistics'
  | 'strategic_consulting'
  | 'cybersecurity'
  | 'ai_automation'
  | 'general_commercial';

export interface CommercialProposal {
  id: string;
  leadId?: string;
  leadName: string;
  leadCategory: string;
  leadLocation?: string;
  leadContact?: BusinessContact;
  objective: ProposalObjective;
  customNotes?: string;
  title: string;
  executiveSummary: string;
  painPointsIdentified: string[];
  proposedSolutions: Array<{
    name: string;
    description: string;
    impact: string;
  }>;
  deliverables: string[];
  estimatedTimeline: string;
  estimatedBudgetRange: string;
  callToAction: string;
  fullMarkdownProposal: string;
  status: 'draft' | 'reviewed' | 'sent' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

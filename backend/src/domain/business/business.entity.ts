export type BusinessOpportunityStatus = 'pending' | 'in_progress' | 'completed';

export interface IBusinessProductOrService {
  id: string;
  name: string;
  description?: string;
  price?: string;
  category?: string;
}

export interface IBusinessProfile {
  id: string; // userId or businessId
  userId: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  productsOrServices: IBusinessProductOrService[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessOpportunity {
  id: string;
  businessId: string;
  userId: string;
  title: string;
  description: string;
  reason: string;
  suggestedAction: string;
  status: BusinessOpportunityStatus;
  impact?: 'high' | 'medium' | 'low';
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

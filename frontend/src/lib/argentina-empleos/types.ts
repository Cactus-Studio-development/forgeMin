export type AERole = 'user' | 'superadmin';

export type AEMaritalStatus =
  | 'Soltero/a'
  | 'Casado/a'
  | 'En pareja'
  | 'Otro'
  | 'Prefiero no especificar';

export type AEEducationLevel =
  | 'Sin estudios formales'
  | 'Primario'
  | 'Secundario'
  | 'Terciario'
  | 'Universitario'
  | 'Posgrado / Máster'
  | 'Cursos / Certificaciones';

export type AEEducationStatus = 'En curso' | 'Finalizado' | 'Incompleto';

export type AEEmploymentGoal =
  | 'Estoy buscando trabajo'
  | 'Quiero publicar una oferta de trabajo'
  | 'Ambas';

export type AEModality = 'Presencial' | 'Híbrido' | 'Remoto';

export type AEContractType =
  | 'Relación de dependencia'
  | 'Contrato freelance'
  | 'Pasantía'
  | 'Por proyecto'
  | 'Otro';

export type AESourceType = 'REAL' | 'AI_GENERATED' | 'ADMIN_CREATED';

export type AEJobStatus = 'active' | 'paused' | 'closed' | 'draft';

export type AETransactionType =
  | 'welcome_credit'
  | 'admin_credit'
  | 'credit_purchase'
  | 'withdrawal'
  | 'adjustment';

export type AEWithdrawalStatus =
  | 'Pendiente'
  | 'En revisión'
  | 'Aprobado'
  | 'Rechazado'
  | 'Pagado';

export interface AEUserEducation {
  level: AEEducationLevel;
  institution?: string;
  career?: string;
  status?: AEEducationStatus;
}

export type AEUserType = 'candidato' | 'empresa' | 'reclutador' | 'ambos';

export interface AEUser {
  id: string;
  app?: string; // 'argentinaEmpleos'
  appType?: string; // 'argentinaEmpleos'
  userType?: AEUserType; // 'candidato' | 'empresa' | 'reclutador' | 'ambos'
  name: string;
  email: string;
  photoUrl?: string;
  age?: number;
  nationality: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  maritalStatus?: AEMaritalStatus;
  education?: AEUserEducation;
  employmentGoal?: AEEmploymentGoal;
  experienceSummary?: string;
  skills: string[];
  preferredModality?: AEModality;
  availability?: string;
  salaryExpectation?: string;
  categories: string[];
  role: AERole;
  isBlocked: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AEJob {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorEmail?: string;
  title: string;
  description: string;
  company: string;
  categoryId: string;
  categoryName: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  modality: AEModality;
  employmentType: AEContractType;
  workingDay?: string;
  requirements: string[];
  skills: string[];
  experienceLevel: string;
  educationLevel: string;
  salary?: string;
  contactInfo: string;
  isAnonymous: boolean;
  sourceType: AESourceType;
  status: AEJobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AELinkedMercadoPagoAccount {
  account: string; // CVU / Alias / Email
  email?: string;
  linkedAt: string;
  verified: boolean;
}

export interface AEWallet {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  internalCredits: number;
  realMoney: number;
  currency: 'ARS';
  welcomeCreditClaimed: boolean;
  linkedMercadoPagoAccount?: AELinkedMercadoPagoAccount;
  createdAt: string;
  updatedAt: string;
}

export interface AEWalletTransaction {
  id: string;
  userId: string;
  userEmail?: string;
  type: AETransactionType;
  amount: number;
  currency: 'ARS';
  source: 'system' | 'superadmin' | 'user';
  description: string;
  adminId?: string;
  adminEmail?: string;
  reason?: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'rejected';
}

export interface AEWithdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: 'Mercado Pago' | 'Transferencia Bancaria';
  destinationAccount: string;
  status: AEWithdrawalStatus;
  adminNotes?: string;
  reviewedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AEAdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AEJobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  creatorId: string;
  creatorEmail: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCityName?: string;
  candidateProvinceName?: string;
  message: string;
  status: 'pending' | 'viewed' | 'contacted' | 'rejected';
  createdAt: string;
}

export interface AECategory {
  id: string;
  name: string;
  icon?: string;
}

export interface CategorizedFeed {
  nearYou: AEJob[];
  sameProvince: AEJob[];
  otherProvinces: AEJob[];
  remote: AEJob[];
  allRanked: AEJob[];
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  newUsersThisWeek: number;
  totalJobs: number;
  activeJobs: number;
  aiJobs: number;
  adminCreatedJobs: number;
  totalCreditsIssued: number;
  welcomeCreditsCount: number;
  pendingWithdrawalsCount: number;
  totalPendingWithdrawalAmount: number;
  recentLogs: AEAdminLog[];
}

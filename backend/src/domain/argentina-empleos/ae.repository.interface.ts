import {
  AEUser,
  AEJob,
  AEWallet,
  AEWalletTransaction,
  AEWithdrawal,
  AEAdminLog,
  AECategory,
  AEJobApplication,
  AEMessage,
  AECreditRequest,
  AENotification,
} from './entities';

export const AE_USER_REPOSITORY = 'AE_USER_REPOSITORY';
export const AE_JOB_REPOSITORY = 'AE_JOB_REPOSITORY';
export const AE_WALLET_REPOSITORY = 'AE_WALLET_REPOSITORY';
export const AE_TRANSACTION_REPOSITORY = 'AE_TRANSACTION_REPOSITORY';
export const AE_WITHDRAWAL_REPOSITORY = 'AE_WITHDRAWAL_REPOSITORY';
export const AE_ADMIN_LOG_REPOSITORY = 'AE_ADMIN_LOG_REPOSITORY';
export const AE_CATEGORY_REPOSITORY = 'AE_CATEGORY_REPOSITORY';
export const AE_APPLICATION_REPOSITORY = 'AE_APPLICATION_REPOSITORY';
export const AE_MESSAGE_REPOSITORY = 'AE_MESSAGE_REPOSITORY';
export const AE_CREDIT_REQUEST_REPOSITORY = 'AE_CREDIT_REQUEST_REPOSITORY';
export const AE_NOTIFICATION_REPOSITORY = 'AE_NOTIFICATION_REPOSITORY';

export interface IAEUserRepository {
  findById(id: string): Promise<AEUser | null>;
  findByEmail(email: string): Promise<AEUser | null>;
  findAll(): Promise<AEUser[]>;
  save(user: AEUser): Promise<void>;
  update(id: string, partial: Partial<AEUser>): Promise<void>;
  setBlockStatus(id: string, isBlocked: boolean): Promise<void>;
}

export interface IAEJobRepository {
  findById(id: string): Promise<AEJob | null>;
  findAll(filters?: {
    provinceId?: string;
    cityId?: string;
    modality?: string;
    categoryId?: string;
    status?: string;
    sourceType?: string;
    creatorId?: string;
    query?: string;
  }): Promise<AEJob[]>;
  save(job: AEJob): Promise<void>;
  update(id: string, partial: Partial<AEJob>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IAEWalletRepository {
  findById(userId: string): Promise<AEWallet | null>;
  findAll(): Promise<AEWallet[]>;
  save(wallet: AEWallet): Promise<void>;
  updateCredits(
    userId: string,
    deltaCredits: number,
    deltaRealMoney?: number,
  ): Promise<AEWallet>;
}

export interface IAETransactionRepository {
  findById(id: string): Promise<AEWalletTransaction | null>;
  findByUserId(userId: string): Promise<AEWalletTransaction[]>;
  findAll(): Promise<AEWalletTransaction[]>;
  save(transaction: AEWalletTransaction): Promise<void>;
}

export interface IAEWithdrawalRepository {
  findById(id: string): Promise<AEWithdrawal | null>;
  findByUserId(userId: string): Promise<AEWithdrawal[]>;
  findAll(): Promise<AEWithdrawal[]>;
  save(withdrawal: AEWithdrawal): Promise<void>;
  updateStatus(
    id: string,
    status: string,
    adminNotes?: string,
    reviewedByAdminId?: string,
  ): Promise<void>;
}

export interface IAEAdminLogRepository {
  findAll(): Promise<AEAdminLog[]>;
  save(log: AEAdminLog): Promise<void>;
}

export interface IAECategoryRepository {
  findAll(): Promise<AECategory[]>;
  save(category: AECategory): Promise<void>;
}

export interface IAEApplicationRepository {
  findById(id: string): Promise<AEJobApplication | null>;
  findByJobId(jobId: string): Promise<AEJobApplication[]>;
  findByCandidateId(candidateId: string): Promise<AEJobApplication[]>;
  findByCreatorId(creatorId: string): Promise<AEJobApplication[]>;
  save(application: AEJobApplication): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
}

export interface IAEMessageRepository {
  findById(id: string): Promise<AEMessage | null>;
  findByUserId(userId: string): Promise<AEMessage[]>;
  save(message: AEMessage): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markThreadAsRead(userId: string, senderId: string): Promise<void>;
}

export interface IAECreditRequestRepository {
  findById(id: string): Promise<AECreditRequest | null>;
  findByUserId(userId: string): Promise<AECreditRequest[]>;
  findAll(): Promise<AECreditRequest[]>;
  save(req: AECreditRequest): Promise<void>;
  updateStatus(
    id: string,
    status: string,
    adminNotes?: string,
    reviewedByAdminId?: string,
  ): Promise<void>;
}

export interface IAENotificationRepository {
  findByUserId(userId: string): Promise<AENotification[]>;
  save(notification: AENotification): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

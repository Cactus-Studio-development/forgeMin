import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  AE_USER_REPOSITORY,
  AE_WALLET_REPOSITORY,
  AE_TRANSACTION_REPOSITORY,
  AE_ADMIN_LOG_REPOSITORY,
  IAEUserRepository,
  IAEWalletRepository,
  IAETransactionRepository,
  IAEAdminLogRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AEUser,
  AERole,
  AEWallet,
  AEWalletTransaction,
} from '../../domain/argentina-empleos/entities';
import * as crypto from 'crypto';

export interface AEAuthProfileInput {
  name?: string;
  app?: string;
  appType?: string;
  userType?: any;
  age?: number;
  nationality?: string;
  provinceId?: string;
  provinceName?: string;
  cityId?: string;
  cityName?: string;
  maritalStatus?: any;
  education?: any;
  employmentGoal?: any;
  experienceSummary?: string;
  skills?: string[];
  preferredModality?: any;
  availability?: string;
  salaryExpectation?: string;
  categories?: string[];
}

@Injectable()
export class AEAuthService {
  private readonly logger = new Logger(AEAuthService.name);

  // Designated superadmin emails or environment config
  private readonly superadminEmails = new Set([
    'admin@argentinaempleos.com.ar',
    'superadmin@forgemind.ai',
    'dantecreedar@gmail.com',
  ]);

  constructor(
    @Inject(AE_USER_REPOSITORY) private readonly userRepo: IAEUserRepository,
    @Inject(AE_WALLET_REPOSITORY) private readonly walletRepo: IAEWalletRepository,
    @Inject(AE_TRANSACTION_REPOSITORY)
    private readonly transactionRepo: IAETransactionRepository,
    @Inject(AE_ADMIN_LOG_REPOSITORY)
    private readonly adminLogRepo: IAEAdminLogRepository,
  ) {}

  async syncOrCreateUser(payload: {
    uid: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
  }): Promise<{ user: AEUser; wallet: AEWallet; isNewUser: boolean }> {
    const { uid, email, displayName, photoUrl } = payload;
    const now = new Date().toISOString();

    let user = await this.userRepo.findById(uid);
    let wallet = await this.walletRepo.findById(uid);
    let isNewUser = false;

    const emailLower = (email || '').toLowerCase().trim();
    const isDesignatedSuperadmin = this.superadminEmails.has(emailLower) || emailLower.includes('superadmin');
    const role: AERole = isDesignatedSuperadmin ? 'superadmin' : 'user';

    if (!user) {
      isNewUser = true;
      user = {
        id: uid,
        app: 'argentinaEmpleos',
        appType: 'argentinaEmpleos',
        userType: 'candidato',
        name: displayName || email.split('@')[0] || 'Usuario',
        email: emailLower,
        photoUrl: photoUrl || '',
        nationality: 'Argentina',
        provinceId: 'misiones',
        provinceName: 'Misiones',
        cityId: 'posadas',
        cityName: 'Posadas',
        skills: [],
        categories: [],
        role: role,
        isBlocked: false,
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
      };

      await this.userRepo.save(user);
    } else {
      // Ensure app and appType fields exist even for pre-existing documents
      const updates: Partial<AEUser> = {};
      if (!user.app) updates.app = 'argentinaEmpleos';
      if (!user.appType) updates.appType = 'argentinaEmpleos';
      if (!user.userType) updates.userType = 'candidato';
      if (isDesignatedSuperadmin && user.role !== 'superadmin') {
        updates.role = 'superadmin';
        user.role = 'superadmin';
      }
      if (Object.keys(updates).length > 0) {
        await this.userRepo.update(uid, updates);
        user = { ...user, ...updates };
      }
    }

    // Idempotent Wallet Creation and Welcome Credit Grant ($25.000 ARS)
    if (!wallet) {
      wallet = {
        id: uid,
        userId: uid,
        userEmail: emailLower,
        userName: user.name,
        internalCredits: 25000,
        realMoney: 0,
        currency: 'ARS',
        welcomeCreditClaimed: true,
        createdAt: now,
        updatedAt: now,
      };
      await this.walletRepo.save(wallet);

      // Record welcome_credit transaction
      const transaction: AEWalletTransaction = {
        id: `tx_welcome_${uid}_${crypto.randomBytes(4).toString('hex')}`,
        userId: uid,
        userEmail: emailLower,
        type: 'welcome_credit',
        amount: 25000,
        currency: 'ARS',
        source: 'system',
        description: 'Crédito inicial de bienvenida',
        createdAt: now,
        status: 'completed',
      };
      await this.transactionRepo.save(transaction);
    } else if (!wallet.welcomeCreditClaimed && wallet.internalCredits === 0) {
      // Safety guarantee for previously half-created wallets
      wallet = await this.walletRepo.updateCredits(uid, 25000);
      const transaction: AEWalletTransaction = {
        id: `tx_welcome_${uid}_${crypto.randomBytes(4).toString('hex')}`,
        userId: uid,
        userEmail: emailLower,
        type: 'welcome_credit',
        amount: 25000,
        currency: 'ARS',
        source: 'system',
        description: 'Crédito inicial de bienvenida',
        createdAt: now,
        status: 'completed',
      };
      await this.transactionRepo.save(transaction);
    }

    return { user, wallet, isNewUser };
  }

  async completeOnboarding(
    userId: string,
    profileData: AEAuthProfileInput,
  ): Promise<AEUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const updatedData: Partial<AEUser> = {
      ...profileData,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    await this.userRepo.update(userId, updatedData);
    return (await this.userRepo.findById(userId))!;
  }

  async updateProfile(
    userId: string,
    profileData: Partial<AEUser>,
  ): Promise<AEUser> {
    // Security: normal users cannot change their role or unblock themselves
    delete profileData.role;
    delete profileData.isBlocked;
    delete profileData.id;

    await this.userRepo.update(userId, profileData);
    return (await this.userRepo.findById(userId))!;
  }

  async getProfile(userId: string): Promise<AEUser | null> {
    return await this.userRepo.findById(userId);
  }
}

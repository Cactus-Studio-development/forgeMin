import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AE_USER_REPOSITORY,
  AE_JOB_REPOSITORY,
  AE_WALLET_REPOSITORY,
  AE_TRANSACTION_REPOSITORY,
  AE_WITHDRAWAL_REPOSITORY,
  AE_ADMIN_LOG_REPOSITORY,
  IAEUserRepository,
  IAEJobRepository,
  IAEWalletRepository,
  IAETransactionRepository,
  IAEWithdrawalRepository,
  IAEAdminLogRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AEUser,
  AEJob,
  AEWallet,
  AEWalletTransaction,
  AEWithdrawal,
  AEAdminLog,
  AEWithdrawalStatus,
} from '../../domain/argentina-empleos/entities';
import { AEAIService, AIGeneratedJobPayload } from '../../infrastructure/argentina-empleos/ae-ai.service';
import * as crypto from 'crypto';

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

@Injectable()
export class AEAdminService {
  constructor(
    @Inject(AE_USER_REPOSITORY) private readonly userRepo: IAEUserRepository,
    @Inject(AE_JOB_REPOSITORY) private readonly jobRepo: IAEJobRepository,
    @Inject(AE_WALLET_REPOSITORY) private readonly walletRepo: IAEWalletRepository,
    @Inject(AE_TRANSACTION_REPOSITORY)
    private readonly transactionRepo: IAETransactionRepository,
    @Inject(AE_WITHDRAWAL_REPOSITORY)
    private readonly withdrawalRepo: IAEWithdrawalRepository,
    @Inject(AE_ADMIN_LOG_REPOSITORY)
    private readonly adminLogRepo: IAEAdminLogRepository,
    private readonly aiService: AEAIService,
  ) {}

  private async assertSuperadmin(adminId: string): Promise<AEUser> {
    const admin = await this.userRepo.findById(adminId);
    if (!admin || admin.role !== 'superadmin') {
      throw new ForbiddenException(
        'Acceso restringido: Se requiere rol superadmin',
      );
    }
    return admin;
  }

  async getDashboardMetrics(adminId: string): Promise<AdminDashboardMetrics> {
    await this.assertSuperadmin(adminId);

    const [users, jobs, wallets, transactions, withdrawals, logs] =
      await Promise.all([
        this.userRepo.findAll(),
        this.jobRepo.findAll(),
        this.walletRepo.findAll(),
        this.transactionRepo.findAll(),
        this.withdrawalRepo.findAll(),
        this.adminLogRepo.findAll(),
      ]);

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsersThisWeek = users.filter(
      (u) => new Date(u.createdAt).getTime() >= oneWeekAgo,
    ).length;

    const activeJobs = jobs.filter((j) => j.status === 'active').length;
    const aiJobs = jobs.filter((j) => j.sourceType === 'AI_GENERATED').length;
    const adminCreatedJobs = jobs.filter((j) => j.sourceType === 'ADMIN_CREATED').length;

    const welcomeCreditsCount = transactions.filter(
      (t) => t.type === 'welcome_credit',
    ).length;

    const totalCreditsIssued = transactions
      .filter((t) => t.amount > 0)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'Pendiente');
    const pendingWithdrawalsCount = pendingWithdrawals.length;
    const totalPendingWithdrawalAmount = pendingWithdrawals.reduce(
      (acc, w) => acc + (w.amount || 0),
      0,
    );

    return {
      totalUsers: users.length,
      newUsersThisWeek,
      totalJobs: jobs.length,
      activeJobs,
      aiJobs,
      adminCreatedJobs,
      totalCreditsIssued,
      welcomeCreditsCount,
      pendingWithdrawalsCount,
      totalPendingWithdrawalAmount,
      recentLogs: logs.slice(0, 15),
    };
  }

  async listUsers(
    adminId: string,
    filters?: { provinceId?: string; cityId?: string; query?: string },
  ): Promise<Array<AEUser & { wallet?: AEWallet }>> {
    await this.assertSuperadmin(adminId);

    let users = await this.userRepo.findAll();
    const wallets = await this.walletRepo.findAll();
    const walletMap = new Map(wallets.map((w) => [w.userId, w]));

    if (filters?.provinceId) {
      users = users.filter((u) => u.provinceId === filters.provinceId);
    }
    if (filters?.cityId) {
      users = users.filter((u) => u.cityId === filters.cityId);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.cityName?.toLowerCase().includes(q) ||
          u.provinceName?.toLowerCase().includes(q),
      );
    }

    return users.map((u) => ({
      ...u,
      wallet: walletMap.get(u.id),
    }));
  }

  async toggleBlockUser(
    adminId: string,
    targetUserId: string,
    isBlocked: boolean,
  ): Promise<void> {
    const admin = await this.assertSuperadmin(adminId);
    const target = await this.userRepo.findById(targetUserId);
    if (!target) throw new NotFoundException('Usuario no encontrado');

    await this.userRepo.setBlockStatus(targetUserId, isBlocked);

    const log: AEAdminLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      targetId: targetUserId,
      targetType: 'user',
      metadata: { targetUserEmail: target.email, isBlocked },
      createdAt: new Date().toISOString(),
    };
    await this.adminLogRepo.save(log);
  }

  async listAllJobs(adminId: string): Promise<AEJob[]> {
    await this.assertSuperadmin(adminId);
    return await this.jobRepo.findAll();
  }

  async generateJobWithAI(
    adminId: string,
    prompt: string,
  ): Promise<AIGeneratedJobPayload> {
    const admin = await this.assertSuperadmin(adminId);
    const generated = await this.aiService.generateJob(prompt);

    const log: AEAdminLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'GENERATE_AI_JOB_DRAFT',
      targetId: 'draft',
      targetType: 'ai_generation',
      metadata: { prompt, generatedTitle: generated.title },
      createdAt: new Date().toISOString(),
    };
    await this.adminLogRepo.save(log);

    return generated;
  }

  async publishAIGeneratedJob(
    adminId: string,
    payload: AIGeneratedJobPayload & { sourceType?: 'AI_GENERATED' | 'ADMIN_CREATED' },
  ): Promise<AEJob> {
    const admin = await this.assertSuperadmin(adminId);
    const now = new Date().toISOString();

    const job: AEJob = {
      id: `job_ai_${crypto.randomBytes(6).toString('hex')}`,
      creatorId: admin.id,
      creatorName: admin.name,
      creatorEmail: admin.email,
      title: payload.title,
      description: payload.description,
      company: payload.company,
      categoryId: payload.categoryId,
      categoryName: payload.categoryName,
      provinceId: payload.provinceId,
      provinceName: payload.provinceName,
      cityId: payload.cityId,
      cityName: payload.cityName,
      modality: payload.modality,
      employmentType: payload.employmentType as any,
      workingDay: payload.workingDay,
      requirements: payload.requirements || [],
      skills: payload.skills || [],
      experienceLevel: payload.experienceLevel,
      educationLevel: payload.educationLevel,
      salary: payload.salary,
      contactInfo: payload.contactInfo,
      isAnonymous: false,
      sourceType: payload.sourceType || 'AI_GENERATED',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.jobRepo.save(job);

    const log: AEAdminLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'PUBLISH_AI_JOB',
      targetId: job.id,
      targetType: 'job',
      metadata: { jobTitle: job.title, sourceType: job.sourceType },
      createdAt: now,
    };
    await this.adminLogRepo.save(log);

    return job;
  }

  async moderateWithdrawal(
    adminId: string,
    withdrawalId: string,
    status: AEWithdrawalStatus,
    adminNotes?: string,
  ): Promise<AEWithdrawal> {
    const admin = await this.assertSuperadmin(adminId);
    const withdrawal = await this.withdrawalRepo.findById(withdrawalId);
    if (!withdrawal) throw new NotFoundException('Solicitud de retiro no encontrada');

    await this.withdrawalRepo.updateStatus(
      withdrawalId,
      status,
      adminNotes,
      admin.id,
    );

    const log: AEAdminLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'MODERATE_WITHDRAWAL',
      targetId: withdrawalId,
      targetType: 'withdrawal',
      metadata: { newStatus: status, userId: withdrawal.userId, amount: withdrawal.amount, adminNotes },
      createdAt: new Date().toISOString(),
    };
    await this.adminLogRepo.save(log);

    return (await this.withdrawalRepo.findById(withdrawalId))!;
  }

  async getAuditLogs(adminId: string): Promise<AEAdminLog[]> {
    await this.assertSuperadmin(adminId);
    return await this.adminLogRepo.findAll();
  }
}

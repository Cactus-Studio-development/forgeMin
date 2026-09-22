import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AE_WALLET_REPOSITORY,
  AE_TRANSACTION_REPOSITORY,
  AE_WITHDRAWAL_REPOSITORY,
  AE_USER_REPOSITORY,
  AE_ADMIN_LOG_REPOSITORY,
  IAEWalletRepository,
  IAETransactionRepository,
  IAEWithdrawalRepository,
  IAEUserRepository,
  IAEAdminLogRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AEWallet,
  AEWalletTransaction,
  AEWithdrawal,
  AEAdminLog,
} from '../../domain/argentina-empleos/entities';
import { AEMercadoPagoService } from '../../infrastructure/argentina-empleos/ae-mercadopago.service';
import * as crypto from 'crypto';

@Injectable()
export class AEWalletService {
  constructor(
    @Inject(AE_WALLET_REPOSITORY) private readonly walletRepo: IAEWalletRepository,
    @Inject(AE_TRANSACTION_REPOSITORY)
    private readonly transactionRepo: IAETransactionRepository,
    @Inject(AE_WITHDRAWAL_REPOSITORY)
    private readonly withdrawalRepo: IAEWithdrawalRepository,
    @Inject(AE_USER_REPOSITORY) private readonly userRepo: IAEUserRepository,
    @Inject(AE_ADMIN_LOG_REPOSITORY)
    private readonly adminLogRepo: IAEAdminLogRepository,
    private readonly mpService: AEMercadoPagoService,
  ) {}

  async getWallet(userId: string): Promise<{
    wallet: AEWallet;
    transactions: AEWalletTransaction[];
    withdrawals: AEWithdrawal[];
  }> {
    const wallet = await this.walletRepo.findById(userId);
    if (!wallet) {
      throw new NotFoundException('Billetera no encontrada');
    }
    const transactions = await this.transactionRepo.findByUserId(userId);
    const withdrawals = await this.withdrawalRepo.findByUserId(userId);

    return { wallet, transactions, withdrawals };
  }

  async grantCreditsBySuperadmin(
    adminId: string,
    targetUserId: string,
    amount: number,
    reason: string,
  ): Promise<{ wallet: AEWallet; transaction: AEWalletTransaction }> {
    const admin = await this.userRepo.findById(adminId);
    if (!admin || admin.role !== 'superadmin') {
      throw new ForbiddenException(
        'Acceso denegado: Únicamente superadmin puede otorgar créditos',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('El monto debe ser superior a 0');
    }

    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario destino no encontrado');
    }

    // Atomic update
    const updatedWallet = await this.walletRepo.updateCredits(targetUserId, amount);
    const now = new Date().toISOString();

    const transaction: AEWalletTransaction = {
      id: `tx_admin_${crypto.randomBytes(6).toString('hex')}`,
      userId: targetUserId,
      userEmail: targetUser.email,
      type: 'admin_credit',
      amount,
      currency: 'ARS',
      source: 'superadmin',
      description: `Crédito adicional otorgado por administración: ${reason}`,
      adminId: admin.id,
      adminEmail: admin.email,
      reason,
      createdAt: now,
      status: 'completed',
    };

    await this.transactionRepo.save(transaction);

    // Audit Log
    const auditLog: AEAdminLog = {
      id: `log_${crypto.randomBytes(6).toString('hex')}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'GRANT_CREDITS',
      targetId: targetUserId,
      targetType: 'wallet',
      metadata: {
        targetUserEmail: targetUser.email,
        amount,
        reason,
        newBalance: updatedWallet.internalCredits,
      },
      createdAt: now,
    };
    await this.adminLogRepo.save(auditLog);

    return { wallet: updatedWallet, transaction };
  }

  async linkMercadoPagoAccount(
    userId: string,
    account: string,
    email?: string,
  ): Promise<AEWallet> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const wallet = await this.walletRepo.findById(userId);
    if (!wallet) throw new NotFoundException('Billetera no encontrada');

    const validation = this.mpService.validateDestinationAccount(account, 'Mercado Pago');
    if (!validation.valid) {
      throw new BadRequestException(validation.error || 'Formato de cuenta Mercado Pago inválido');
    }

    const now = new Date().toISOString();
    const updatedWallet: AEWallet = {
      ...wallet,
      linkedMercadoPagoAccount: {
        account: account.trim(),
        email: email?.trim() || user.email,
        linkedAt: now,
        verified: true,
      },
      updatedAt: now,
    };

    await this.walletRepo.save(updatedWallet);
    return updatedWallet;
  }

  async unlinkMercadoPagoAccount(userId: string): Promise<AEWallet> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const wallet = await this.walletRepo.findById(userId);
    if (!wallet) throw new NotFoundException('Billetera no encontrada');

    const now = new Date().toISOString();
    const updatedWallet: AEWallet = {
      ...wallet,
      updatedAt: now,
    };
    delete updatedWallet.linkedMercadoPagoAccount;

    await this.walletRepo.save(updatedWallet);
    return updatedWallet;
  }

  async requestWithdrawal(
    userId: string,
    amount: number,
    method: 'Mercado Pago' | 'Transferencia Bancaria',
    destinationAccount: string,
  ): Promise<AEWithdrawal> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const wallet = await this.walletRepo.findById(userId);
    if (!wallet) throw new NotFoundException('Billetera no encontrada');

    // Rule 1: Must have linked Mercado Pago account
    if (!wallet.linkedMercadoPagoAccount) {
      throw new BadRequestException(
        'Debes vincular tu cuenta de Mercado Pago antes de poder solicitar un retiro.',
      );
    }

    // Rule 2: Must have at least 47.600 credits
    const MIN_WITHDRAWAL_CREDITS = 47600;
    if ((wallet.internalCredits || 0) < MIN_WITHDRAWAL_CREDITS) {
      throw new BadRequestException(
        `Se requiere un saldo mínimo de $ ${MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS en créditos para solicitar retiros. Tu saldo actual es de $ ${(wallet.internalCredits || 0).toLocaleString('es-AR')} ARS.`,
      );
    }

    // Validate account format
    const targetAccount = destinationAccount?.trim() || wallet.linkedMercadoPagoAccount.account;
    const validation = this.mpService.validateDestinationAccount(targetAccount, method);
    if (!validation.valid) {
      throw new BadRequestException(validation.error || 'Formato de cuenta inválido');
    }

    // Check balance
    if (wallet.internalCredits < amount) {
      throw new BadRequestException(
        'Saldo insuficiente de créditos para solicitar este retiro',
      );
    }

    const now = new Date().toISOString();
    const withdrawal: AEWithdrawal = {
      id: `wth_${crypto.randomBytes(6).toString('hex')}`,
      userId,
      userEmail: user.email,
      userName: user.name,
      amount,
      method,
      destinationAccount: targetAccount,
      status: 'Pendiente',
      adminNotes: 'Solicitud registrada con cuenta vinculada de Mercado Pago. Sujeta a revisión administrativa.',
      createdAt: now,
      updatedAt: now,
    };

    await this.withdrawalRepo.save(withdrawal);

    // Record pending transaction
    const transaction: AEWalletTransaction = {
      id: `tx_wth_${crypto.randomBytes(6).toString('hex')}`,
      userId,
      userEmail: user.email,
      type: 'withdrawal',
      amount: -amount,
      currency: 'ARS',
      source: 'user',
      description: `Solicitud de retiro vía ${method} (${targetAccount})`,
      createdAt: now,
      status: 'pending',
    };
    await this.transactionRepo.save(transaction);

    return withdrawal;
  }

  /**
   * Rule 3: Credit Purchase with Mercado Pago
   * Rate: $200 ARS paid = 20 internal credits (10 ARS = 1 credit)
   */
  async createCreditPurchasePreference(
    userId: string,
    paidAmountArs: number,
  ): Promise<{ preferenceId: string; initPoint: string; paidAmountArs: number; creditsToReceive: number }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (paidAmountArs < 100) {
      throw new BadRequestException('El monto mínimo de compra es de $ 100 ARS.');
    }

    // Conversion formula: 10 ARS paid = 1 credit (e.g. 200 ARS -> 20 credits)
    const creditsToReceive = Math.floor(paidAmountArs / 10);

    const pref = await this.mpService.createPreference({
      title: `Recarga de ${creditsToReceive.toLocaleString('es-AR')} Créditos - Argentina Empleos`,
      price: paidAmountArs,
      quantity: 1,
      payerEmail: user.email,
      externalReference: `buy_credits_${userId}_${paidAmountArs}_${Date.now()}`,
    });

    return {
      preferenceId: pref.id,
      initPoint: pref.initPoint,
      paidAmountArs,
      creditsToReceive,
    };
  }

  /**
   * Completes credit purchase accreditation
   */
  async confirmCreditPurchase(
    userId: string,
    paidAmountArs: number,
    paymentId?: string,
  ): Promise<{ wallet: AEWallet; transaction: AEWalletTransaction }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (paidAmountArs < 100) {
      throw new BadRequestException('El monto mínimo es de $ 100 ARS.');
    }

    const creditsToAdd = Math.floor(paidAmountArs / 10);
    const updatedWallet = await this.walletRepo.updateCredits(userId, creditsToAdd);
    const now = new Date().toISOString();

    const transaction: AEWalletTransaction = {
      id: `tx_buy_${crypto.randomBytes(6).toString('hex')}`,
      userId,
      userEmail: user.email,
      type: 'credit_purchase',
      amount: creditsToAdd,
      currency: 'ARS',
      source: 'user',
      description: `Compra de ${creditsToAdd.toLocaleString('es-AR')} créditos vía Mercado Pago ($ ${paidAmountArs.toLocaleString('es-AR')} ARS pagados)`,
      createdAt: now,
      status: 'completed',
    };

    await this.transactionRepo.save(transaction);
    return { wallet: updatedWallet, transaction };
  }

  async createCreditPackagePreference(
    userId: string,
    packageType: 'basic' | 'pro' | 'enterprise',
  ): Promise<{ preferenceId: string; initPoint: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const packages: Record<string, { title: string; price: number; credits: number }> = {
      basic: { title: 'Pack 10.000 Créditos ARS - Argentina Empleos', price: 9500, credits: 10000 },
      pro: { title: 'Pack 50.000 Créditos ARS - Argentina Empleos', price: 42000, credits: 50000 },
      enterprise: { title: 'Pack 150.000 Créditos ARS - Argentina Empleos', price: 110000, credits: 150000 },
    };

    const selected = packages[packageType] || packages.basic;
    const pref = await this.mpService.createPreference({
      title: selected.title,
      price: selected.price,
      quantity: 1,
      payerEmail: user.email,
      externalReference: `credit_pkg_${userId}_${packageType}_${Date.now()}`,
    });

    return {
      preferenceId: pref.id,
      initPoint: pref.initPoint,
    };
  }
}

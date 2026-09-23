import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AE_CREDIT_REQUEST_REPOSITORY,
  AE_USER_REPOSITORY,
  AE_WALLET_REPOSITORY,
  AE_TRANSACTION_REPOSITORY,
  AE_ADMIN_LOG_REPOSITORY,
  AE_NOTIFICATION_REPOSITORY,
  IAECreditRequestRepository,
  IAEUserRepository,
  IAEWalletRepository,
  IAETransactionRepository,
  IAEAdminLogRepository,
  IAENotificationRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AECreditRequest,
  AEWalletTransaction,
  AEAdminLog,
  AENotification,
} from '../../domain/argentina-empleos/entities';
import * as crypto from 'crypto';

@Injectable()
export class AECreditRequestService {
  constructor(
    @Inject(AE_CREDIT_REQUEST_REPOSITORY)
    private readonly requestRepo: IAECreditRequestRepository,
    @Inject(AE_USER_REPOSITORY) private readonly userRepo: IAEUserRepository,
    @Inject(AE_WALLET_REPOSITORY) private readonly walletRepo: IAEWalletRepository,
    @Inject(AE_TRANSACTION_REPOSITORY)
    private readonly transactionRepo: IAETransactionRepository,
    @Inject(AE_ADMIN_LOG_REPOSITORY)
    private readonly adminLogRepo: IAEAdminLogRepository,
    @Inject(AE_NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: IAENotificationRepository,
  ) {}

  private async assertSuperadmin(adminId: string) {
    const admin = await this.userRepo.findById(adminId);
    if (!admin || admin.role !== 'superadmin') {
      throw new ForbiddenException('Acceso restringido: Se requiere rol superadmin');
    }
    return admin;
  }

  async requestCredits(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<AECreditRequest> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('El monto solicitado debe ser superior a 0');
    }
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Por favor indicá el motivo o justificación de la solicitud');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const now = new Date().toISOString();
    const request: AECreditRequest = {
      id: `req_cred_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      userName: user.name,
      userEmail: user.email,
      amount,
      reason: reason.trim(),
      status: 'Pendiente',
      createdAt: now,
      updatedAt: now,
    };

    await this.requestRepo.save(request);

    // Audit log and Notification for Admin
    const log: AEAdminLog = {
      id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      adminId: 'system',
      adminEmail: 'sistema@argentinaempleos.local',
      action: 'CREDIT_REQUESTED',
      targetId: request.id,
      targetType: 'wallet',
      metadata: {
        userId,
        userName: user.name,
        userEmail: user.email,
        amount,
        reason,
      },
      createdAt: now,
    };
    await this.adminLogRepo.save(log);

    return request;
  }

  async getMyRequests(userId: string): Promise<AECreditRequest[]> {
    return await this.requestRepo.findByUserId(userId);
  }

  async listAllRequests(adminId: string, status?: string): Promise<AECreditRequest[]> {
    await this.assertSuperadmin(adminId);
    let list = await this.requestRepo.findAll();
    if (status && status !== 'ALL') {
      list = list.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    return list;
  }

  async moderateRequest(
    adminId: string,
    requestId: string,
    status: 'Aprobado' | 'Rechazado',
    adminNotes?: string,
  ): Promise<AECreditRequest> {
    const admin = await this.assertSuperadmin(adminId);
    const request = await this.requestRepo.findById(requestId);
    if (!request) throw new NotFoundException('Solicitud de créditos no encontrada');

    const now = new Date().toISOString();

    if (status === 'Aprobado' && request.status !== 'Aprobado') {
      // Grant credits to user wallet
      await this.walletRepo.updateCredits(request.userId, request.amount);

      // Save transaction
      const tx: AEWalletTransaction = {
        id: `tx_req_grant_${crypto.randomBytes(6).toString('hex')}`,
        userId: request.userId,
        userEmail: request.userEmail,
        type: 'admin_credit',
        amount: request.amount,
        currency: 'ARS',
        source: 'superadmin',
        description: `Créditos otorgados por solicitud aprobada: ${request.reason}`,
        adminId: admin.id,
        adminEmail: admin.email,
        reason: adminNotes || 'Solicitud de créditos aprobada',
        createdAt: now,
        status: 'completed',
      };
      await this.transactionRepo.save(tx);

      // Notification for user
      const userNotif: AENotification = {
        id: `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        userId: request.userId,
        type: 'CREDIT_REQUEST',
        title: '¡Solicitud de Créditos Aprobada!',
        message: `Se te han acreditado $ ${request.amount.toLocaleString('es-AR')} ARS en créditos. Detalle: ${adminNotes || 'Aprobado por administración'}`,
        link: '/argentinaEmpleos/billetera',
        read: false,
        createdAt: now,
      };
      await this.notificationRepo.save(userNotif);
    } else if (status === 'Rechazado') {
      const userNotif: AENotification = {
        id: `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        userId: request.userId,
        type: 'CREDIT_REQUEST',
        title: 'Solicitud de Créditos Rechazada',
        message: `Tu solicitud de $ ${request.amount.toLocaleString('es-AR')} ARS no fue aprobada. Motivo: ${adminNotes || 'Sin observaciones'}`,
        link: '/argentinaEmpleos/billetera',
        read: false,
        createdAt: now,
      };
      await this.notificationRepo.save(userNotif);
    }

    await this.requestRepo.updateStatus(requestId, status, adminNotes, admin.id);

    const log: AEAdminLog = {
      id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'MODERATE_CREDIT_REQUEST',
      targetId: requestId,
      targetType: 'wallet',
      metadata: {
        newStatus: status,
        userId: request.userId,
        amount: request.amount,
        adminNotes,
      },
      createdAt: now,
    };
    await this.adminLogRepo.save(log);

    return (await this.requestRepo.findById(requestId))!;
  }
}

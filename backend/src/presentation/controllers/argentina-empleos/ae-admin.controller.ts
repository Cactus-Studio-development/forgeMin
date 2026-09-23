import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AEAdminService } from '../../../application/argentina-empleos/ae-admin.service';
import { AEWalletService } from '../../../application/argentina-empleos/ae-wallet.service';
import { AECreditRequestService } from '../../../application/argentina-empleos/ae-credit-request.service';
import { AIGeneratedJobPayload } from '../../../infrastructure/argentina-empleos/ae-ai.service';
import { AEWithdrawalStatus } from '../../../domain/argentina-empleos/entities';

@Controller('argentina-empleos/admin')
export class AEAdminController {
  constructor(
    private readonly adminService: AEAdminService,
    private readonly walletService: AEWalletService,
    private readonly creditRequestService: AECreditRequestService,
  ) {}

  @Get('credit-requests')
  async listCreditRequests(
    @Headers('x-ae-user-id') adminId: string,
    @Query('status') status?: string,
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.creditRequestService.listAllRequests(adminId, status);
  }

  @Patch('credit-requests/:id/moderate')
  async moderateCreditRequest(
    @Param('id') requestId: string,
    @Headers('x-ae-user-id') adminId: string,
    @Body() body: { status: 'Aprobado' | 'Rechazado'; adminNotes?: string },
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.creditRequestService.moderateRequest(
      adminId,
      requestId,
      body.status,
      body.adminNotes,
    );
  }

  @Get('dashboard')
  async getDashboard(@Headers('x-ae-user-id') adminId: string) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.getDashboardMetrics(adminId);
  }

  @Get('users')
  async listUsers(
    @Headers('x-ae-user-id') adminId: string,
    @Query('provinceId') provinceId?: string,
    @Query('cityId') cityId?: string,
    @Query('query') query?: string,
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.listUsers(adminId, { provinceId, cityId, query });
  }

  @Patch('users/:userId/block')
  async toggleBlockUser(
    @Param('userId') targetUserId: string,
    @Headers('x-ae-user-id') adminId: string,
    @Body('isBlocked') isBlocked: boolean,
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    await this.adminService.toggleBlockUser(adminId, targetUserId, isBlocked);
    return { success: true };
  }

  @Get('jobs')
  async listAllJobs(@Headers('x-ae-user-id') adminId: string) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.listAllJobs(adminId);
  }

  @Post('ai/generate')
  async generateAIJob(
    @Headers('x-ae-user-id') adminId: string,
    @Body('prompt') prompt: string,
    @Body('count') count?: number,
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.generateJobsWithAI(adminId, prompt, count);
  }

  @Post('ai/publish')
  async publishAIJob(
    @Headers('x-ae-user-id') adminId: string,
    @Body() payload: AIGeneratedJobPayload & { sourceType?: 'AI_GENERATED' | 'ADMIN_CREATED' },
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.publishAIGeneratedJob(adminId, payload);
  }

  @Post('ai/publish-bulk')
  async publishAIJobsBulk(
    @Headers('x-ae-user-id') adminId: string,
    @Body('jobs') jobs: (AIGeneratedJobPayload & { sourceType?: 'AI_GENERATED' | 'ADMIN_CREATED' })[],
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.publishAIGeneratedJobsBulk(adminId, jobs || []);
  }

  @Post('wallet/grant-credits')
  async grantCredits(
    @Headers('x-ae-user-id') adminId: string,
    @Body()
    body: {
      targetUserId: string;
      amount: number;
      reason: string;
    },
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.walletService.grantCreditsBySuperadmin(
      adminId,
      body.targetUserId,
      body.amount,
      body.reason,
    );
  }

  @Get('withdrawals')
  async listWithdrawals(
    @Headers('x-ae-user-id') adminId: string,
    @Query('status') status?: string,
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.listWithdrawals(adminId, status);
  }

  @Patch('withdrawals/:id/moderate')
  async moderateWithdrawal(
    @Param('id') withdrawalId: string,
    @Headers('x-ae-user-id') adminId: string,
    @Body()
    body: {
      status: AEWithdrawalStatus;
      adminNotes?: string;
    },
  ) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.moderateWithdrawal(
      adminId,
      withdrawalId,
      body.status,
      body.adminNotes,
    );
  }

  @Get('audit-logs')
  async getAuditLogs(@Headers('x-ae-user-id') adminId: string) {
    if (!adminId) throw new UnauthorizedException('Falta ID de administrador');
    return await this.adminService.getAuditLogs(adminId);
  }
}

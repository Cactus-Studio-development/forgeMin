import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AEWalletService } from '../../../application/argentina-empleos/ae-wallet.service';
import { AECreditRequestService } from '../../../application/argentina-empleos/ae-credit-request.service';

@Controller('argentina-empleos/wallet')
export class AEWalletController {
  constructor(
    private readonly walletService: AEWalletService,
    private readonly creditRequestService: AECreditRequestService,
  ) {}

  @Get()
  async getMyWallet(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.getWallet(userId);
  }

  @Post('request-credits')
  async requestCredits(
    @Headers('x-ae-user-id') userId: string,
    @Body() body: { amount: number; reason: string },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.creditRequestService.requestCredits(
      userId,
      body.amount,
      body.reason,
    );
  }

  @Get('my-credit-requests')
  async getMyCreditRequests(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.creditRequestService.getMyRequests(userId);
  }

  @Post('withdraw')
  async requestWithdrawal(
    @Headers('x-ae-user-id') userId: string,
    @Body()
    body: {
      amount: number;
      method: 'Mercado Pago' | 'Transferencia Bancaria';
      destinationAccount: string;
    },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.requestWithdrawal(
      userId,
      body.amount,
      body.method,
      body.destinationAccount,
    );
  }

  @Get('mp-oauth-url')
  async getMPOAuthUrl(
    @Headers('x-ae-user-id') userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.getOAuthUrl(userId);
  }

  @Post('mp-oauth-callback')
  async handleMPOAuthCallback(
    @Headers('x-ae-user-id') userId: string,
    @Body() body: { code: string; redirectUri?: string },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.handleOAuthCallback(userId, body.code, body.redirectUri);
  }

  @Post('link-mp')
  async linkMercadoPagoAccount(
    @Headers('x-ae-user-id') userId: string,
    @Body()
    body: {
      account: string;
      email?: string;
      holderName?: string;
      dniCuil?: string;
      bankName?: string;
      accountType?: 'Mercado Pago' | 'Cuenta Bancaria';
    },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.linkMercadoPagoAccount(
      userId,
      body.account,
      body.email,
      body.holderName,
      body.dniCuil,
      body.bankName,
      body.accountType,
    );
  }

  @Post('unlink-mp')
  async unlinkMercadoPagoAccount(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.unlinkMercadoPagoAccount(userId);
  }

  @Post('buy-credits-preference')
  async buyCreditsPreference(
    @Headers('x-ae-user-id') userId: string,
    @Body('paidAmountArs') paidAmountArs: number,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.createCreditPurchasePreference(userId, Number(paidAmountArs));
  }

  @Post('confirm-purchase')
  async confirmPurchase(
    @Headers('x-ae-user-id') userId: string,
    @Body() body: { paidAmountArs: number; paymentId?: string },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.confirmCreditPurchase(userId, Number(body.paidAmountArs), body.paymentId);
  }

  @Post('checkout-preference')
  async createCheckoutPreference(
    @Headers('x-ae-user-id') userId: string,
    @Body('packageType') packageType: 'basic' | 'pro' | 'enterprise',
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.createCreditPackagePreference(userId, packageType || 'basic');
  }
}

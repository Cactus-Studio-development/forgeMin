import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AEWalletService } from '../../../application/argentina-empleos/ae-wallet.service';

@Controller('argentina-empleos/wallet')
export class AEWalletController {
  constructor(private readonly walletService: AEWalletService) {}

  @Get()
  async getMyWallet(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.getWallet(userId);
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

  @Post('link-mp')
  async linkMercadoPagoAccount(
    @Headers('x-ae-user-id') userId: string,
    @Body() body: { account: string; email?: string },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.walletService.linkMercadoPagoAccount(userId, body.account, body.email);
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

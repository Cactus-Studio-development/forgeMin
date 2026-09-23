import { Injectable, Logger } from '@nestjs/common';

export interface CreatePreferenceDto {
  title: string;
  price: number;
  quantity?: number;
  payerEmail?: string;
  externalReference?: string;
  backUrls?: {
    success?: string;
    pending?: string;
    failure?: string;
  };
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

@Injectable()
export class AEMercadoPagoService {
  private readonly logger = new Logger(AEMercadoPagoService.name);
  private readonly accessToken: string | undefined;
  private readonly publicKey: string | undefined;

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    this.publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

    if (this.accessToken) {
      this.logger.log('AEMercadoPagoService initialized with Access Token');
    } else {
      this.logger.warn('MERCADOPAGO_ACCESS_TOKEN is not defined in environment variables');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.accessToken);
  }

  getPublicKey(): string | undefined {
    return this.publicKey;
  }

  /**
   * Returns OAuth authorization URL for connecting Mercado Pago accounts
   */
  getOAuthAuthorizationUrl(userId: string, redirectUri = 'http://localhost:3000/argentinaEmpleos/billetera'): string {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID || '7684067614131162';
    const targetUri = encodeURIComponent(redirectUri);
    return `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${targetUri}`;
  }

  /**
   * Exchanges authorization code for Mercado Pago Access Token
   */
  async exchangeOAuthCode(
    code: string,
    redirectUri = 'http://localhost:3000/argentinaEmpleos/billetera',
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    mpUserId: string;
    publicKey?: string;
    liveMode: boolean;
  }> {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID || '7684067614131162';
    const clientSecret = this.accessToken;

    if (!clientSecret) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is required for OAuth token exchange');
    }

    try {
      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientSecret}`,
        },
        body: JSON.stringify({
          client_secret: clientSecret,
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Mercado Pago OAuth token error: ${response.status} - ${errorText}`);
        throw new Error(`Error vinculando cuenta de Mercado Pago: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        mpUserId: String(data.user_id),
        publicKey: data.public_key,
        liveMode: Boolean(data.live_mode),
      };
    } catch (error: any) {
      this.logger.error('Failed to exchange Mercado Pago OAuth code:', error.message);
      throw error;
    }
  }

  /**
   * Retrieves Mercado Pago account profile information
   */
  async getUserProfile(mpUserId: string | number, token?: string): Promise<any> {
    const authToken = token || this.accessToken;
    if (!authToken) return null;

    try {
      const response = await fetch(`https://api.mercadopago.com/users/${mpUserId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error: any) {
      this.logger.warn(`Could not fetch MP user profile ${mpUserId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Generates a checkout preference for credit packages or featured job boosts
   */
  async createPreference(dto: CreatePreferenceDto): Promise<MercadoPagoPreferenceResponse> {
    if (!this.accessToken) {
      this.logger.warn('Mocking Mercado Pago preference because access token is not set');
      return {
        id: `mock_pref_${Date.now()}`,
        initPoint: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock',
        sandboxInitPoint: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock',
      };
    }

    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: dto.title,
              quantity: dto.quantity || 1,
              currency_id: 'ARS',
              unit_price: Number(dto.price),
            },
          ],
          payer: dto.payerEmail ? { email: dto.payerEmail } : undefined,
          external_reference: dto.externalReference,
          back_urls: dto.backUrls || {
            success: 'http://localhost:3000/argentinaEmpleos/billetera?status=success',
            pending: 'http://localhost:3000/argentinaEmpleos/billetera?status=pending',
            failure: 'http://localhost:3000/argentinaEmpleos/billetera?status=failure',
          },
          auto_return: 'approved',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Mercado Pago API error: ${response.status} - ${errorText}`);
        throw new Error(`Mercado Pago error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      };
    } catch (error: any) {
      this.logger.error('Failed to create Mercado Pago preference:', error.message);
      throw error;
    }
  }

  /**
   * Retrieves payment status by ID
   */
  async getPayment(paymentId: string | number): Promise<any> {
    if (!this.accessToken) {
      return { id: paymentId, status: 'approved', status_detail: 'accredited_mock' };
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching payment ${paymentId}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      this.logger.error(`Failed to get payment ${paymentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Validates format of destination account for withdrawals
   */
  validateDestinationAccount(account: string, method: 'Mercado Pago' | 'Transferencia Bancaria'): { valid: boolean; error?: string } {
    const trimmed = account.trim();
    if (!trimmed) {
      return { valid: false, error: 'La cuenta de destino no puede estar vacía' };
    }

    if (method === 'Mercado Pago') {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const isCVU = /^\d{22}$/.test(trimmed);
      const isAlias = /^[a-zA-Z0-9.\-_]{3,30}$/.test(trimmed);

      if (!isEmail && !isCVU && !isAlias) {
        return { valid: false, error: 'Ingresá un CVU válido (22 dígitos), Alias o Email asociado a Mercado Pago' };
      }
      return { valid: true };
    }

    if (method === 'Transferencia Bancaria') {
      const isCBU = /^\d{22}$/.test(trimmed);
      const isAlias = /^[a-zA-Z0-9.\-_]{3,30}$/.test(trimmed);

      if (!isCBU && !isAlias) {
        return { valid: false, error: 'Ingresá un CBU válido (22 dígitos) o Alias bancario' };
      }
      return { valid: true };
    }

    return { valid: true };
  }
}

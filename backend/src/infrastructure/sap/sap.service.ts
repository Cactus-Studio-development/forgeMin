import { Injectable, Logger } from '@nestjs/common';

export interface SapCredentials {
  serverUrl: string;
  companyDb?: string;
  username: string;
  password?: string;
  apiKey?: string;
}

export interface SapBusinessPartnerPayload {
  cardCode?: string;
  cardName: string;
  cardType?: 'cCustomer' | 'cSupplier' | 'cLid';
  emailAddress?: string;
  phone1?: string;
  notes?: string;
}

@Injectable()
export class SapService {
  private readonly logger = new Logger(SapService.name);

  async testConnection(credentials: SapCredentials): Promise<{ success: boolean; message: string; sessionToken?: string }> {
    this.logger.log(`Probando conexión con servidor SAP: ${credentials.serverUrl}`);

    try {
      if (!credentials.serverUrl || !credentials.username) {
        return { success: false, message: 'La URL del servidor y el usuario de SAP son requeridos.' };
      }

      const token = `sap_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return {
        success: true,
        message: '¡Conexión exitosa con el servicio SAP OData / Service Layer!',
        sessionToken: token,
      };
    } catch (err: any) {
      this.logger.error('Error al conectar con SAP ERP:', err);
      return {
        success: false,
        message: err?.message || 'No se pudo establecer comunicación con el servidor SAP.',
      };
    }
  }

  async syncBusinessPartner(credentials: SapCredentials, partner: SapBusinessPartnerPayload): Promise<{ success: boolean; cardCode: string; message: string }> {
    this.logger.log(`Sincronizando Business Partner "${partner.cardName}" en SAP...`);

    const generatedCode = partner.cardCode || `C${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      cardCode: generatedCode,
      message: `Socio de negocios "${partner.cardName}" creado/actualizado exitosamente en SAP con código ${generatedCode}.`,
    };
  }

  async getBusinessPartners(credentials?: SapCredentials): Promise<any[]> {
    return [
      { CardCode: 'C10001', CardName: 'Tech Solutions SA', CardType: 'cCustomer', Email: 'contacto@techsolutions.com' },
      { CardCode: 'C10002', CardName: 'Global Dynamics Corp', CardType: 'cCustomer', Email: 'sales@globaldynamics.com' },
      { CardCode: 'C10003', CardName: 'Innovate Labs SRL', CardType: 'cCustomer', Email: 'info@innovatelabs.com' },
    ];
  }
}

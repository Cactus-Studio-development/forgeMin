import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Delete,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AEAuthService } from '../../../application/argentina-empleos/ae-auth.service';
import {
  ARGENTINA_PROVINCES,
  ARGENTINA_CITIES,
  DEFAULT_JOB_CATEGORIES,
} from '../../../infrastructure/argentina-empleos/argentina-geo.data';

@Controller('argentina-empleos/auth')
export class AEAuthController {
  constructor(private readonly authService: AEAuthService) {}

  @Post('sync')
  async syncUser(
    @Body()
    body: {
      uid: string;
      email?: string;
      displayName?: string;
      photoUrl?: string;
    },
  ) {
    const uid = body.uid;
    if (!uid) {
      throw new UnauthorizedException('Identificador de usuario no provisto');
    }
    const email = body.email?.trim() || `${uid}@argentinaempleos.local`;
    return await this.authService.syncOrCreateUser({
      ...body,
      uid,
      email,
    });
  }

  @Post('onboarding')
  async completeOnboarding(
    @Body() body: { userId: string; profileData: any },
  ) {
    return await this.authService.completeOnboarding(body.userId, body.profileData);
  }

  @Patch('profile')
  async updateProfile(
    @Body() body: { userId: string; profileData: any },
  ) {
    return await this.authService.updateProfile(body.userId, body.profileData);
  }

  @Get('profile')
  async getProfile(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.authService.getProfile(userId);
  }

  @Post('profile/cv')
  async attachCV(
    @Headers('x-ae-user-id') userId: string,
    @Body() cvData: { url: string; fileName: string; fileSize?: number; mimeType?: string },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.authService.attachCV(userId, cvData);
  }

  @Delete('profile/cv')
  async deleteCV(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.authService.deleteCV(userId);
  }

  @Post('profile/photos')
  async addPhoto(
    @Headers('x-ae-user-id') userId: string,
    @Body() photoData: { url: string; caption?: string },
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.authService.addProfilePhoto(userId, photoData);
  }

  @Delete('profile/photos/:photoId')
  async deletePhoto(
    @Headers('x-ae-user-id') userId: string,
    @Param('photoId') photoId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.authService.deleteProfilePhoto(userId, photoId);
  }

  @Get('geo/metadata')
  getGeoMetadata() {
    return {
      provinces: ARGENTINA_PROVINCES,
      cities: ARGENTINA_CITIES,
      categories: DEFAULT_JOB_CATEGORIES,
    };
  }
}

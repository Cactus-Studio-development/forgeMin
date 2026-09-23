import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AEMessagingService, SendMessageInput } from '../../../application/argentina-empleos/ae-messaging.service';

@Controller('argentina-empleos/messages')
export class AEMessagingController {
  constructor(private readonly messagingService: AEMessagingService) {}

  @Post('send')
  async sendMessage(
    @Headers('x-ae-user-id') senderId: string,
    @Body() input: SendMessageInput,
  ) {
    if (!senderId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.messagingService.sendMessage(senderId, input);
  }

  @Get('inbox')
  async getInbox(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.messagingService.getInbox(userId);
  }

  @Get('search-contacts')
  async searchContacts(
    @Headers('x-ae-user-id') userId: string,
    @Query('q') query?: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.messagingService.searchContacts(query || '', userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Headers('x-ae-user-id') userId: string,
    @Param('id') messageId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    await this.messagingService.markAsRead(userId, messageId);
    return { success: true };
  }

  @Patch('thread/:senderId/read')
  async markThreadAsRead(
    @Headers('x-ae-user-id') userId: string,
    @Param('senderId') senderId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    await this.messagingService.markThreadAsRead(userId, senderId);
    return { success: true };
  }

  @Get('notifications')
  async getNotifications(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.messagingService.getNotifications(userId);
  }

  @Patch('notifications/:id/read')
  async markNotificationAsRead(
    @Headers('x-ae-user-id') userId: string,
    @Param('id') notificationId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    await this.messagingService.markNotificationAsRead(userId, notificationId);
    return { success: true };
  }

  @Patch('notifications/read-all')
  async markAllNotificationsAsRead(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    await this.messagingService.markAllNotificationsAsRead(userId);
    return { success: true };
  }
}

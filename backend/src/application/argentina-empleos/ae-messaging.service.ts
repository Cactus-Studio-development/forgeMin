import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  AE_MESSAGE_REPOSITORY,
  AE_NOTIFICATION_REPOSITORY,
  AE_USER_REPOSITORY,
  IAEMessageRepository,
  IAENotificationRepository,
  IAEUserRepository,
} from '../../domain/argentina-empleos/ae.repository.interface';
import {
  AEMessage,
  AENotification,
} from '../../domain/argentina-empleos/entities';
import * as crypto from 'crypto';

export interface SendMessageInput {
  receiverId: string;
  content: string;
  subject?: string;
  jobId?: string;
  jobTitle?: string;
}

export interface ConversationThread {
  otherUser: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    headline?: string;
    role?: string;
    userType?: string;
  };
  lastMessage: AEMessage;
  unreadCount: number;
  messages: AEMessage[];
}

@Injectable()
export class AEMessagingService {
  constructor(
    @Inject(AE_MESSAGE_REPOSITORY) private readonly messageRepo: IAEMessageRepository,
    @Inject(AE_NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: IAENotificationRepository,
    @Inject(AE_USER_REPOSITORY) private readonly userRepo: IAEUserRepository,
  ) {}

  async sendMessage(senderId: string, input: SendMessageInput): Promise<AEMessage> {
    if (!input.content || !input.content.trim()) {
      throw new BadRequestException('El contenido del mensaje no puede estar vacío');
    }

    const [sender, receiver] = await Promise.all([
      this.userRepo.findById(senderId),
      this.userRepo.findById(input.receiverId),
    ]);

    if (!sender) throw new NotFoundException('Remitente no encontrado');
    if (!receiver) throw new NotFoundException('Destinatario no encontrado');

    const now = new Date().toISOString();
    const message: AEMessage = {
      id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      senderId,
      senderName: sender.name,
      senderEmail: sender.email,
      senderPhotoUrl: sender.photoUrl,
      receiverId: input.receiverId,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      subject: input.subject || (input.jobTitle ? `Consulta por: ${input.jobTitle}` : undefined),
      content: input.content.trim(),
      jobId: input.jobId,
      jobTitle: input.jobTitle,
      read: false,
      createdAt: now,
    };

    await this.messageRepo.save(message);

    // Create notification for receiver
    const notification: AENotification = {
      id: `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: receiver.id,
      type: 'MESSAGE',
      title: `Nuevo mensaje de ${sender.name}`,
      message: input.content.length > 80 ? `${input.content.substring(0, 80)}...` : input.content,
      link: '/argentinaEmpleos/mensajes',
      read: false,
      createdAt: now,
    };
    await this.notificationRepo.save(notification);

    return message;
  }

  async getInbox(userId: string): Promise<{
    threads: ConversationThread[];
    totalUnreadCount: number;
    rawMessages: AEMessage[];
  }> {
    const rawMessages = await this.messageRepo.findByUserId(userId);
    const threadsMap = new Map<string, AEMessage[]>();

    let totalUnreadCount = 0;

    for (const msg of rawMessages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!threadsMap.has(otherId)) {
        threadsMap.set(otherId, []);
      }
      threadsMap.get(otherId)!.push(msg);

      if (msg.receiverId === userId && !msg.read) {
        totalUnreadCount++;
      }
    }

    const threads: ConversationThread[] = [];

    for (const [otherId, msgs] of threadsMap.entries()) {
      const otherUser = await this.userRepo.findById(otherId);
      const unreadCount = msgs.filter((m) => m.receiverId === userId && !m.read).length;
      const lastMessage = msgs[msgs.length - 1];

      threads.push({
        otherUser: {
          id: otherId,
          name: otherUser?.name || 'Usuario',
          email: otherUser?.email || '',
          photoUrl: otherUser?.photoUrl,
          headline: otherUser?.headline,
          role: otherUser?.role,
          userType: otherUser?.userType,
        },
        lastMessage,
        unreadCount,
        messages: msgs,
      });
    }

    // Sort threads by latest message desc
    threads.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt || 0).getTime() -
        new Date(a.lastMessage.createdAt || 0).getTime(),
    );

    return { threads, totalUnreadCount, rawMessages };
  }

  async markAsRead(userId: string, messageId: string): Promise<void> {
    const msg = await this.messageRepo.findById(messageId);
    if (msg && msg.receiverId === userId) {
      await this.messageRepo.markAsRead(messageId);
    }
  }

  async markThreadAsRead(userId: string, otherUserId: string): Promise<void> {
    await this.messageRepo.markThreadAsRead(userId, otherUserId);
  }

  async getNotifications(userId: string): Promise<{
    notifications: AENotification[];
    unreadCount: number;
  }> {
    const notifications = await this.notificationRepo.findByUserId(userId);
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepo.markAsRead(notificationId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);
  }

  async searchContacts(
    query: string,
    currentUserId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      email?: string;
      photoUrl?: string;
      headline?: string;
      userType?: string;
      role?: string;
    }>
  > {
    const users = await this.userRepo.findAll();
    const q = (query || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return users
      .filter((u) => u.id !== currentUserId)
      .filter((u) => {
        if (!q) return true;
        const norm = (str?: string) => (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const nameMatch = norm(u.name).includes(q);
        const emailMatch = norm(u.email).includes(q);
        const headlineMatch = norm(u.headline).includes(q);
        const userTypeMatch = norm(u.userType).includes(q);
        const roleMatch = norm(u.role).includes(q);
        const adminAliasMatch = (q.includes('admin') || q.includes('super')) && u.role === 'superadmin';
        return nameMatch || emailMatch || headlineMatch || userTypeMatch || roleMatch || adminAliasMatch;
      })
      .slice(0, 30)
      .map((u) => ({
        id: u.id,
        name: u.name || 'Usuario',
        email: u.email && !u.email.endsWith('@argentinaempleos.local') ? u.email : undefined,
        photoUrl: u.photoUrl,
        headline: u.headline,
        userType: u.userType,
        role: u.role,
      }));
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { attachmentTypeFromMime } from '../../utils/media-attachments';
import type { UploadedMediaFile } from '../../utils/uploaded-file.type';
import { SendMessageDto } from './dto/send-message.dto';

const SENDER_SELECT = {
  select: { id: true, firstName: true, lastName: true, role: true },
} satisfies { select: Prisma.UserSelect };

const MESSAGE_INCLUDE = {
  sender: SENDER_SELECT,
  attachments: true,
} satisfies Prisma.MessageInclude;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(userId: string) {
    const existing = await this.prisma.conversation.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.conversation.create({ data: { userId } });
  }

  async getMyConversation(userId: string) {
    const conversation = await this.getOrCreateConversation(userId);

    await this.prisma.message.updateMany({
      where: { conversationId: conversation.id, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, include: MESSAGE_INCLUDE } },
    });
  }

  async sendMyMessage(userId: string, dto: SendMessageDto, files: UploadedMediaFile[]) {
    this.assertNotEmpty(dto, files);
    const conversation = await this.getOrCreateConversation(userId);
    return this.createMessage(conversation.id, userId, dto, files);
  }

  async listConversationsForAdmin() {
    const conversations = await this.prisma.conversation.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        messages: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conversation) => {
      const lastMessage = conversation.messages[0] ?? null;
      const unreadCount = conversation.messages.filter(
        (message) => message.senderId === conversation.userId && !message.isRead,
      ).length;

      return {
        id: conversation.id,
        status: conversation.status,
        updatedAt: conversation.updatedAt,
        user: conversation.user,
        lastMessage: lastMessage
          ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
          : null,
        unreadCount,
      };
    });
  }

  async getConversationForAdmin(id: string) {
    const conversation = await this.findConversationOrThrow(id);

    await this.prisma.message.updateMany({
      where: { conversationId: id, senderId: conversation.userId, isRead: false },
      data: { isRead: true },
    });

    return this.prisma.conversation.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: MESSAGE_INCLUDE },
      },
    });
  }

  async sendAdminReply(
    conversationId: string,
    adminUserId: string,
    dto: SendMessageDto,
    files: UploadedMediaFile[],
  ) {
    this.assertNotEmpty(dto, files);
    await this.findConversationOrThrow(conversationId);
    return this.createMessage(conversationId, adminUserId, dto, files);
  }

  async setStatus(conversationId: string, status: ConversationStatus) {
    await this.findConversationOrThrow(conversationId);
    return this.prisma.conversation.update({ where: { id: conversationId }, data: { status } });
  }

  private async findConversationOrThrow(id: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private assertNotEmpty(dto: SendMessageDto, files: UploadedMediaFile[]) {
    if (!dto.content?.trim() && files.length === 0) {
      throw new BadRequestException('Message must have text or at least one attachment');
    }
  }

  private async createMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
    files: UploadedMediaFile[],
  ) {
    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content: dto.content?.trim() || null },
    });

    if (files.length > 0) {
      await this.prisma.messageAttachment.createMany({
        data: files.map((file) => ({
          messageId: message.id,
          url: `/uploads/messages/${file.filename}`,
          type: attachmentTypeFromMime(file.mimetype),
          filename: file.originalname,
        })),
      });
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return this.prisma.message.findUniqueOrThrow({ where: { id: message.id }, include: MESSAGE_INCLUDE });
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementType, Prisma, ReactionType, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { attachmentTypeFromMime } from '../../utils/media-attachments';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SetCategoryVisibilityDto } from './dto/set-category-visibility.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

const CATEGORY_VISIBILITY_PREFIX = 'announcement_category_visible:';

const AUTHOR_SELECT = {
  select: { id: true, firstName: true, lastName: true, role: true },
} satisfies { select: Prisma.UserSelect };

const FEED_INCLUDE = {
  author: AUTHOR_SELECT,
  attachments: true,
  comments: {
    orderBy: { createdAt: 'asc' },
    include: { author: AUTHOR_SELECT },
  },
  reactions: true,
} satisfies Prisma.AnnouncementInclude;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForAdmin() {
    return this.prisma.announcement.findMany({
      include: {
        author: AUTHOR_SELECT,
        _count: { select: { comments: true, reactions: true, attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: FEED_INCLUDE,
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  create(dto: CreateAnnouncementDto, authorId: string) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetAudience: dto.targetAudience,
        isPublished: dto.isPublished ?? true,
        publishedAt: dto.isPublished ?? true ? new Date() : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        authorId,
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.findOne(id);

    const willPublish = dto.isPublished ?? existing.isPublished;
    const isNewlyPublished = willPublish && !existing.isPublished;

    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetAudience: dto.targetAudience,
        isPublished: dto.isPublished,
        publishedAt: isNewlyPublished ? new Date() : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  async findFeed(user: AuthenticatedUser) {
    const where: Prisma.AnnouncementWhereInput = {
      isPublished: true,
      targetAudience: { has: user.role },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    const announcements = await this.prisma.announcement.findMany({
      where,
      include: FEED_INCLUDE,
      orderBy: { publishedAt: 'desc' },
    });

    let visible = announcements;
    if (user.role === Role.PARENT) {
      const hiddenCategories = await this.getHiddenCategories();
      visible = announcements.filter((a) => !hiddenCategories.has(a.type));
    }

    return visible.map((announcement) => ({
      ...announcement,
      myReaction: announcement.reactions.find((r) => r.userId === user.id)?.type ?? null,
      reactionCounts: this.countReactions(announcement.reactions),
    }));
  }

  async getCategoryVisibility(): Promise<Record<AnnouncementType, boolean>> {
    const hidden = await this.getHiddenCategories();
    const result = {} as Record<AnnouncementType, boolean>;
    for (const category of Object.values(AnnouncementType)) {
      result[category] = !hidden.has(category);
    }
    return result;
  }

  async setCategoryVisibility(dto: SetCategoryVisibilityDto) {
    const entries = Object.entries(dto.categories) as [AnnouncementType, boolean][];
    await this.prisma.$transaction(
      entries
        .filter(([category]) => Object.values(AnnouncementType).includes(category))
        .map(([category, visible]) =>
          this.prisma.systemSetting.upsert({
            where: { key: `${CATEGORY_VISIBILITY_PREFIX}${category}` },
            update: { value: String(!!visible) },
            create: { key: `${CATEGORY_VISIBILITY_PREFIX}${category}`, value: String(!!visible) },
          }),
        ),
    );
    return this.getCategoryVisibility();
  }

  async addAttachments(
    announcementId: string,
    files: { filename: string; originalname: string; mimetype: string }[],
  ) {
    await this.findOne(announcementId);

    await this.prisma.announcementAttachment.createMany({
      data: files.map((file) => ({
        announcementId,
        url: `/uploads/announcements/${file.filename}`,
        type: attachmentTypeFromMime(file.mimetype),
        filename: file.originalname,
      })),
    });

    return this.prisma.announcementAttachment.findMany({ where: { announcementId } });
  }

  async removeAttachment(announcementId: string, attachmentId: string) {
    const attachment = await this.prisma.announcementAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.announcementId !== announcementId) {
      throw new NotFoundException('Attachment not found');
    }
    await this.prisma.announcementAttachment.delete({ where: { id: attachmentId } });
    return { success: true };
  }

  async addComment(announcementId: string, authorId: string, dto: CreateCommentDto) {
    await this.findOne(announcementId);
    return this.prisma.announcementComment.create({
      data: { announcementId, authorId, content: dto.content },
      include: { author: AUTHOR_SELECT },
    });
  }

  async removeComment(commentId: string, requestingUser: AuthenticatedUser) {
    const comment = await this.prisma.announcementComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const isOwner = comment.authorId === requestingUser.id;
    const isAdmin = requestingUser.role === Role.ADMIN || requestingUser.role === Role.SUPER_ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.announcementComment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async setReaction(announcementId: string, userId: string, dto: SetReactionDto) {
    await this.findOne(announcementId);

    const existing = await this.prisma.announcementReaction.findUnique({
      where: { announcementId_userId: { announcementId, userId } },
    });

    if (existing && existing.type === dto.type) {
      await this.prisma.announcementReaction.delete({ where: { id: existing.id } });
      return null;
    }

    return this.prisma.announcementReaction.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      update: { type: dto.type },
      create: { announcementId, userId, type: dto.type },
    });
  }

  async removeReaction(announcementId: string, userId: string) {
    await this.prisma.announcementReaction.deleteMany({ where: { announcementId, userId } });
    return { success: true };
  }

  private async getHiddenCategories(): Promise<Set<AnnouncementType>> {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: CATEGORY_VISIBILITY_PREFIX } },
    });
    const hidden = new Set<AnnouncementType>();
    for (const row of rows) {
      if (row.value === 'false') {
        hidden.add(row.key.replace(CATEGORY_VISIBILITY_PREFIX, '') as AnnouncementType);
      }
    }
    return hidden;
  }

  private countReactions(reactions: { type: ReactionType }[]): Record<ReactionType, number> {
    const counts = {} as Record<ReactionType, number>;
    for (const type of Object.values(ReactionType)) {
      counts[type] = 0;
    }
    for (const reaction of reactions) {
      counts[reaction.type] += 1;
    }
    return counts;
  }
}

import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementType, Prisma, ReactionType, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { attachmentTypeFromMime } from '../../utils/media-attachments';
import { canManageSchoolWidePosts } from '../../utils/staff-permissions';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SetCategoryVisibilityDto } from './dto/set-category-visibility.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

const CATEGORY_VISIBILITY_PREFIX = 'announcement_category_visible:';

const AUTHOR_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    role: true,
    teacher: { select: { staffTitle: true } },
    admin: { select: { position: true } },
  },
} satisfies { select: Prisma.UserSelect };

const ATTACHMENT_SELECT = {
  id: true, announcementId: true, url: true, type: true, filename: true, createdAt: true,
} satisfies Prisma.AnnouncementAttachmentSelect;

const FEED_INCLUDE = {
  author: AUTHOR_SELECT,
  attachments: { select: ATTACHMENT_SELECT },
  comments: {
    orderBy: { createdAt: 'asc' },
    include: { author: AUTHOR_SELECT },
  },
  reactions: true,
} satisfies Prisma.AnnouncementInclude;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForAdmin(user: AuthenticatedUser) {
    const isFullAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    return this.prisma.announcement.findMany({
      where: isFullAdmin ? undefined : { authorId: user.id },
      include: {
        author: AUTHOR_SELECT,
        _count: { select: { comments: true, reactions: true, attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, requestingUser?: AuthenticatedUser) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: FEED_INCLUDE,
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    if (requestingUser) {
      this.assertCanManage(announcement, requestingUser);
    }
    return announcement;
  }

  create(dto: CreateAnnouncementDto, user: AuthenticatedUser) {
    this.assertPublicPermission(dto.isPublic, user);
    if (!canManageSchoolWidePosts(user)) {
      throw new ForbiddenException('You do not have permission to create posts');
    }
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetAudience: dto.targetAudience,
        isPublished: dto.isPublished ?? true,
        isFeatured: dto.isFeatured ?? false,
        isPublic: dto.isPublic ?? false,
        publishedAt: dto.isPublished ?? true ? new Date() : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        authorId: user.id,
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto, user: AuthenticatedUser) {
    this.assertPublicPermission(dto.isPublic, user);
    const existing = await this.findOne(id, user);

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
        isFeatured: dto.isFeatured,
        isPublic: dto.isPublic,
        publishedAt: isNewlyPublished ? new Date() : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.findOne(id, user);
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  async findFeed(user: AuthenticatedUser, featuredOnly?: boolean) {
    const where: Prisma.AnnouncementWhereInput = {
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      AND: featuredOnly
        ? [{ isFeatured: true }]
        : [{ OR: [{ targetAudience: { has: user.role } }, { isFeatured: true }] }],
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
    user: AuthenticatedUser,
  ) {
    await this.findOne(announcementId, user);

    await this.prisma.announcementAttachment.createMany({
      data: await Promise.all(files.map(async (file) => ({
        announcementId,
        url: `/uploads/announcements/${file.filename}`,
        type: attachmentTypeFromMime(file.mimetype),
        filename: file.originalname,
        mimeType: file.mimetype,
        data: await readFile(join(process.cwd(), 'uploads', 'announcements', file.filename)),
      }))),
    });

    // Only remove temporary copies after the durable database write succeeds.
    await Promise.all(files.map(file => unlink(join(process.cwd(), 'uploads', 'announcements', file.filename)).catch(() => undefined)));
    return this.prisma.announcementAttachment.findMany({ where: { announcementId }, select: ATTACHMENT_SELECT });
  }

  async removeAttachment(announcementId: string, attachmentId: string, user: AuthenticatedUser) {
    await this.findOne(announcementId, user);
    const attachment = await this.prisma.announcementAttachment.findUnique({
      where: { id: attachmentId },
      select: ATTACHMENT_SELECT,
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

  private assertCanManage(announcement: { authorId: string; isPublic?: boolean }, user: AuthenticatedUser): void {
    const isFullAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    if (!isFullAdmin && announcement.isPublic) {
      throw new ForbiddenException('Only administrators can change public school updates');
    }
    if (!isFullAdmin && announcement.authorId !== user.id) {
      throw new ForbiddenException('You can only manage your own posts');
    }
  }

  private assertPublicPermission(isPublic: boolean | undefined, user: AuthenticatedUser) {
    if (isPublic && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only administrators can publish public school updates');
    }
  }

  private publicWhere(): Prisma.AnnouncementWhereInput {
    return { isPublic: true, isPublished: true, publishedAt: { lte: new Date() },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };
  }

  async findPublic(page: number) {
    const rows = await this.prisma.announcement.findMany({
      where: this.publicWhere(), skip: (page - 1) * 6, take: 7,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      select: { id: true, title: true, content: true, type: true, publishedAt: true,
        attachments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: { id: true, type: true, filename: true } } },
    });
    return { hasMore: rows.length > 6, items: rows.slice(0, 6).map(row => ({ ...row,
      attachments: row.attachments.map(file => ({ ...file,
        url: `/api/public-media/${row.id}/${file.id}` })),
    })) };
  }

  async findPublicMedia(id: string, attachmentId: string) {
    const attachment = await this.prisma.announcementAttachment.findFirst({
      where: { id: attachmentId, announcementId: id, announcement: { is: this.publicWhere() } },
      select: { id: true, url: true, data: true, mimeType: true },
    });
    if (!attachment || !/^\/uploads\/announcements\/[a-zA-Z0-9_.-]+$/.test(attachment.url)) {
      throw new NotFoundException('School update media not found');
    }
    return this.loadMedia(attachment);
  }

  async findPortalMedia(filename: string, user: AuthenticatedUser) {
    if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(filename)) throw new NotFoundException('Media not found');
    const attachment = await this.prisma.announcementAttachment.findFirst({
      where: { url: `/uploads/announcements/${filename}` },
      select: { id: true, url: true, data: true, mimeType: true,
        announcement: { select: { authorId: true, isPublished: true, expiresAt: true, targetAudience: true, isFeatured: true, type: true } } },
    });
    if (!attachment) throw new NotFoundException('Media not found');
    const post = attachment.announcement;
    const manager = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN || post.authorId === user.id;
    if (!manager && (!post.isPublished || (post.expiresAt && post.expiresAt <= new Date()) ||
      (!post.isFeatured && !post.targetAudience.includes(user.role)) ||
      (user.role === Role.PARENT && (await this.getHiddenCategories()).has(post.type)))) {
      throw new NotFoundException('Media not found');
    }
    return this.loadMedia(attachment);
  }

  private async loadMedia(attachment: { id: string; url: string; data: Uint8Array | null; mimeType: string | null }) {
    let data = attachment.data;
    const mimeType = attachment.mimeType || lookup(attachment.url) || 'application/octet-stream';
    if (!data) {
      const filename = attachment.url.split('/').pop()!;
      try {
        data = await readFile(join(process.cwd(), 'uploads', 'announcements', filename));
      } catch {
        throw new NotFoundException('This file is no longer available. An administrator needs to upload it again.');
      }
      // Upgrade any surviving legacy files when they are first opened.
      await this.prisma.announcementAttachment.update({ where: { id: attachment.id }, data: { data: new Uint8Array(data), mimeType }, select: { id: true } });
    }
    return { data: Buffer.from(data), mimeType };
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

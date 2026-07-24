import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { extensionFromMime, isAllowedMediaMime } from '../../utils/media-attachments';
import type { UploadedMediaFile } from '../../utils/uploaded-file.type';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SetCategoryVisibilityDto } from './dto/set-category-visibility.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'announcements');

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAllForAdmin() {
    return this.announcementsService.findAllForAdmin();
  }

  @Get('feed')
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  findFeed(@CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.findFeed(user);
  }

  @Get('category-visibility')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getCategoryVisibility() {
    return this.announcementsService.getCategoryVisibility();
  }

  @Patch('category-visibility')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  setCategoryVisibility(@Body() dto: SetCategoryVisibilityDto) {
    return this.announcementsService.setCategoryVisibility(dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }

  @Post(':id/attachments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          callback(null, UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const ext = extensionFromMime(file.mimetype, file.originalname);
          callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
        },
      }),
      limits: { fileSize: Number(process.env.MAX_FILE_SIZE ?? 20971520) },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedMediaMime(file.mimetype)) {
          callback(
            new BadRequestException('Only image, video, audio, or document files are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  addAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: UploadedMediaFile[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }
    return this.announcementsService.addAttachments(id, files);
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.announcementsService.removeAttachment(id, attachmentId);
  }

  @Post(':id/comments')
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.addComment(id, user.id, dto);
  }

  @Delete(':id/comments/:commentId')
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  removeComment(@Param('commentId') commentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.removeComment(commentId, user);
  }

  @Put(':id/reactions')
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  setReaction(
    @Param('id') id: string,
    @Body() dto: SetReactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.setReaction(id, user.id, dto);
  }

  @Delete(':id/reactions')
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  removeReaction(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.removeReaction(id, user.id);
  }
}

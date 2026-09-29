import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import { sendMedia } from '../../utils/send-media';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { extensionFromMime, isAllowedMediaMime } from '../../utils/media-attachments';
import type { UploadedMediaFile } from '../../utils/uploaded-file.type';
import { AuthenticatedUser } from '../auth/auth.types';
import { SendMessageDto } from './dto/send-message.dto';
import { SetConversationStatusDto } from './dto/set-conversation-status.dto';
import { MessagesService } from './messages.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'messages');

const messageFilesInterceptor = FilesInterceptor('files', 10, {
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
      callback(new BadRequestException('Unsupported file type'), false);
      return;
    }
    callback(null, true);
  },
});

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('media/:filename')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PARENT, Role.TEACHER)
  async media(@Param('filename') filename: string, @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request, @Res() response: Response) {
    return sendMedia(request, response, await this.messagesService.findMedia(filename, user));
  }

  @Get('my-conversation')
  @Roles(Role.PARENT, Role.TEACHER)
  getMyConversation(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.getMyConversation(user.id);
  }

  @Post('my-conversation')
  @Roles(Role.PARENT, Role.TEACHER)
  @UseInterceptors(messageFilesInterceptor)
  sendMyMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: UploadedMediaFile[] = [],
  ) {
    return this.messagesService.sendMyMessage(user.id, dto, files);
  }

  @Get('conversations')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  listConversations() {
    return this.messagesService.listConversationsForAdmin();
  }

  @Get('conversations/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getConversation(@Param('id') id: string) {
    return this.messagesService.getConversationForAdmin(id);
  }

  @Post('conversations/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(messageFilesInterceptor)
  sendAdminReply(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: UploadedMediaFile[] = [],
  ) {
    return this.messagesService.sendAdminReply(id, user.id, dto, files);
  }

  @Patch('conversations/:id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  setStatus(@Param('id') id: string, @Body() dto: SetConversationStatusDto) {
    return this.messagesService.setStatus(id, dto.status);
  }
}

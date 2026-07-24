import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import type { UploadedMediaFile } from '../../utils/uploaded-file.type';
import { GrantRoleDto } from './dto/grant-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query('search') search?: string, @Query('role') role?: Role) {
    return this.usersService.findAll({ search, role });
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          if (!existsSync(AVATAR_UPLOAD_DIR)) {
            mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
          }
          callback(null, AVATAR_UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const ext = file.mimetype.split('/')[1] ?? 'bin';
          callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file?: UploadedMediaFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const previous = await this.usersService.findOne(user.id);
    const updated = await this.usersService.updateAvatar(user.id, `/uploads/avatars/${file.filename}`);

    if (previous.avatar?.startsWith('/uploads/avatars/')) {
      const previousPath = join(process.cwd(), previous.avatar);
      if (existsSync(previousPath)) {
        unlinkSync(previousPath);
      }
    }

    return updated;
  }

  @Post(':id/grant-role')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  grantRole(@Param('id') id: string, @Body() dto: GrantRoleDto) {
    return this.usersService.grantRole(id, dto.role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
